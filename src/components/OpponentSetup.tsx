import { useRef, useState } from 'react'
import { formatPower, parseOpponentFile, createPlayer } from '../lib/parseRoster'
import { emptyLanes, lanePower, sortForDisplay, turnOrderNumber } from '../lib/simulate'
import type { LaneAssignment, LaneId, Player } from '../types'
import { LANE_IDS, LANE_LABELS } from '../types'

interface Props {
  enemy: LaneAssignment
  onChange: (enemy: LaneAssignment) => void
}

export function OpponentSetup({ enemy, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lane, setLane] = useState<LaneId>('left')
  const [nick, setNick] = useState('')
  const [power, setPower] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File | null) {
    if (!file) return
    setError(null)
    try {
      const parsed = await parseOpponentFile(file)
      const next = emptyLanes()
      for (const l of LANE_IDS) {
        next[l] = parsed[l] ?? []
      }
      onChange(next)
    } catch {
      setError('Не удалось прочитать файл соперника.')
    }
  }

  function addManual() {
    const p = Number(power.replace(/[\s\u00a0]/g, '').replace(',', '.'))
    if (!nick.trim() || !Number.isFinite(p) || p <= 0) {
      setError('Укажите ник и мощь.')
      return
    }
    setError(null)
    const player = createPlayer(nick, Math.round(p))
    onChange({
      ...enemy,
      [lane]: [...enemy[lane], player],
    })
    setNick('')
    setPower('')
  }

  function removePlayer(l: LaneId, id: string) {
    onChange({
      ...enemy,
      [l]: enemy[l].filter((p) => p.id !== id),
    })
  }

  function updatePower(l: LaneId, id: string, nextPower: number) {
    onChange({
      ...enemy,
      [l]: enemy[l].map((p) => (p.id === id ? { ...p, power: nextPower } : p)),
    })
  }

  function clearLane(l: LaneId) {
    onChange({ ...enemy, [l]: [] })
  }

  return (
    <section className="panel panel-equal">
      <header className="panel__head">
        <h2>Альянс BDSM</h2>
        <span className="tag tag--enemy">ник + мощь</span>
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
          onClick={() => onChange(emptyLanes())}
        >
          Очистить всё
        </button>
      </div>
      <p className="hint">
        Столбец <code>lane</code>: left / center / right. Мощь можно править в таблице.
      </p>

      <div className="manual-add">
        <select value={lane} onChange={(e) => setLane(e.target.value as LaneId)}>
          {LANE_IDS.map((l) => (
            <option key={l} value={l}>
              {LANE_LABELS[l]}
            </option>
          ))}
        </select>
        <input placeholder="Ник" value={nick} onChange={(e) => setNick(e.target.value)} />
        <input placeholder="Мощь" value={power} onChange={(e) => setPower(e.target.value)} />
        <button type="button" className="btn btn-secondary" onClick={addManual}>
          Добавить
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="enemy-lanes">
        {LANE_IDS.map((l) => (
          <EnemyLane
            key={l}
            lane={l}
            players={enemy[l]}
            onClear={() => clearLane(l)}
            onRemove={(id) => removePlayer(l, id)}
            onEditPower={(id, pow) => updatePower(l, id, pow)}
          />
        ))}
      </div>
    </section>
  )
}

function EnemyLane({
  lane,
  players,
  onClear,
  onRemove,
  onEditPower,
}: {
  lane: LaneId
  players: Player[]
  onClear: () => void
  onRemove: (id: string) => void
  onEditPower: (id: string, power: number) => void
}) {
  const sorted = sortForDisplay(players)
  return (
    <div className="enemy-lane">
      <div className="enemy-lane__head">
        <h3>{LANE_LABELS[lane]}</h3>
        <span>
          {players.length} · {formatPower(lanePower(players))}
        </span>
        <button type="button" className="btn btn--tiny" onClick={onClear}>
          очистить
        </button>
      </div>
      <ul>
        {sorted.map((p, i) => (
          <li key={p.id}>
            <span className="ord">{turnOrderNumber(i, sorted.length)}.</span>
            <span className="nick">{p.nick}</span>
            <input
              className="power-input"
              type="text"
              inputMode="numeric"
              defaultValue={String(p.power)}
              key={`${p.id}-${p.power}`}
              onBlur={(e) => {
                const n = Number(e.target.value.replace(/[\s\u00a0,]/g, ''))
                if (Number.isFinite(n) && n > 0 && n !== p.power) {
                  onEditPower(p.id, Math.round(n))
                } else {
                  e.target.value = String(p.power)
                }
              }}
            />
            <button type="button" className="btn btn--tiny" onClick={() => onRemove(p.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
