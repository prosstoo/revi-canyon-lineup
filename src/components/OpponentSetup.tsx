import { useRef, useState } from 'react'
import { formatPower, parseOpponentFile, createPlayer } from '../lib/parseRoster'
import { emptyLanes, lanePower } from '../lib/simulate'
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

  function clearLane(l: LaneId) {
    onChange({ ...enemy, [l]: [] })
  }

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>Соперник</h2>
        <span className="tag tag--enemy">BDSM / вручную</span>
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
        Для файла со столбцом <code>линия</code> / <code>lane</code> значения: left/лево,
        center/центр, right/право. Без столбца — всё попадёт на левую линию.
      </p>

      <div className="manual-add">
        <select value={lane} onChange={(e) => setLane(e.target.value as LaneId)}>
          {LANE_IDS.map((l) => (
            <option key={l} value={l}>
              {LANE_LABELS[l]}
            </option>
          ))}
        </select>
        <input
          placeholder="Ник"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
        />
        <input
          placeholder="Мощь"
          value={power}
          onChange={(e) => setPower(e.target.value)}
        />
        <button type="button" className="btn btn--secondary" onClick={addManual}>
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
}: {
  lane: LaneId
  players: Player[]
  onClear: () => void
  onRemove: (id: string) => void
}) {
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
        {[...players]
          .sort((a, b) => a.power - b.power)
          .map((p, i) => (
            <li key={p.id}>
              <span className="ord">{i + 1}.</span>
              <span className="nick">{p.nick}</span>
              <span className="pow">{formatPower(p.power)}</span>
              <button type="button" className="btn btn--tiny" onClick={() => onRemove(p.id)}>
                ×
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}
