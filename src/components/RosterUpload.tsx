import { useRef, useState } from 'react'
import { parseRosterFile, parseCsvText, formatPower } from '../lib/parseRoster'
import type { Player } from '../types'

interface Props {
  title: string
  allianceTag: string
  players: Player[]
  onChange: (players: Player[]) => void
}

export function RosterUpload({ title, allianceTag, players, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [paste, setPaste] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | null) {
    if (!file) return
    setError(null)
    try {
      const list = await parseRosterFile(file)
      if (list.length === 0) {
        setError('Не удалось прочитать игроков. Нужны столбцы «ник» и «мощь».')
        return
      }
      onChange(list)
    } catch {
      setError('Ошибка чтения файла.')
    }
  }

  function onPasteApply() {
    setError(null)
    const list = parseCsvText(paste)
    if (list.length === 0) {
      const lines = paste
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
      const manual: Player[] = []
      for (const line of lines) {
        if (/ник|nick|power|мощь/i.test(line) && manual.length === 0) continue
        const parts = line.split(/[;\t,|]/).map((x) => x.trim()).filter(Boolean)
        if (parts.length < 2) {
          const m = line.match(/^(.+?)\s+([\d\s\u00a0]+)$/)
          if (m) {
            const power = Number(m[2]!.replace(/[\s\u00a0]/g, ''))
            if (Number.isFinite(power) && power > 0) {
              manual.push({
                id: `paste-${manual.length}-${Date.now()}`,
                nick: m[1]!.trim(),
                power: Math.round(power),
              })
            }
          }
          continue
        }
        const power = Number(
          parts[parts.length - 1]!.replace(/[\s\u00a0]/g, '').replace(',', '.'),
        )
        const nick = parts.slice(0, -1).join(' ')
        if (nick && Number.isFinite(power) && power > 0) {
          manual.push({
            id: `paste-${manual.length}-${Date.now()}`,
            nick,
            power: Math.round(power),
          })
        }
      }
      if (manual.length === 0) {
        setError('Вставьте строки: ник;мощь или CSV с заголовками.')
        return
      }
      onChange(manual)
      return
    }
    onChange(list)
  }

  function updatePower(id: string, power: number) {
    onChange(players.map((p) => (p.id === id ? { ...p, power } : p)))
  }

  const total = players.reduce((s, p) => s + p.power, 0)
  const sorted = [...players].sort((a, b) => b.power - a.power)

  return (
    <section className="panel panel-equal">
      <header className="panel__head">
        <h2>{title}</h2>
        <span className="tag">{allianceTag}</span>
      </header>

      <div className="upload-row">
        <button type="button" className="btn" onClick={() => inputRef.current?.click()}>
          Загрузить CSV / Excel
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,.xlsx,.xls"
          hidden
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => onChange([])}
          disabled={players.length === 0}
        >
          Очистить
        </button>
      </div>

      <label className="field">
        <span>Или вставьте таблицу (ник;мощь)</span>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={3}
          placeholder={'ник;мощь\nPlayerOne;18500000'}
        />
      </label>
      <button type="button" className="btn btn-secondary" onClick={onPasteApply}>
        Применить вставку
      </button>

      {error && <p className="error">{error}</p>}

      <p className="meta">
        Игроков: <strong>{players.length}</strong>
        {players.length > 0 && (
          <>
            {' '}
            · сумма: <strong>{formatPower(total)}</strong>
          </>
        )}
      </p>

      {players.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="col-ord">Ход</th>
                <th>Ник</th>
                <th className="col-pow">Мощь</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.id}>
                  <td className="col-ord">{sorted.length - i}</td>
                  <td>{p.nick}</td>
                  <td className="col-pow">
                    <input
                      className="power-input"
                      type="text"
                      inputMode="numeric"
                      defaultValue={String(p.power)}
                      key={`${p.id}-${p.power}`}
                      onBlur={(e) => {
                        const n = Number(e.target.value.replace(/[\s\u00a0,]/g, ''))
                        if (Number.isFinite(n) && n > 0 && n !== p.power) {
                          updatePower(p.id, Math.round(n))
                        } else {
                          e.target.value = String(p.power)
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
