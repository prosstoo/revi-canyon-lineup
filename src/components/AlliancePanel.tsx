import { useRef, useState } from 'react'
import { createPlayer, formatPower, parseOpponentFile } from '../lib/parseRoster'
import {
  emptyLanes,
  lanePower,
  sortForDisplay,
  topFighters,
  turnOrderNumber,
} from '../lib/simulate'
import type { LaneAssignment, LaneId, Player } from '../types'
import { LANE_IDS, LANE_LABELS } from '../types'

interface Props {
  title: string
  allianceTag: string
  variant: 'ally' | 'enemy'
  lanes: LaneAssignment
  onChange: (lanes: LaneAssignment) => void
  /** Можно держать больше 15 — в бой идут топ-15 по мощи */
  allowOverflow?: boolean
  maxFight?: number
}

export function AlliancePanel({
  title,
  allianceTag,
  variant,
  lanes,
  onChange,
  allowOverflow = true,
  maxFight = 15,
}: Props) {
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
      // файл без столбца lane → всё в left; пользователь разнесёт
      onChange(next)
    } catch {
      setError('Не удалось прочитать файл. Нужны столбцы ник, мощь (и желательно lane).')
    }
  }

  function addManual() {
    const p = Number(power.replace(/[\s\u00a0]/g, '').replace(',', '.'))
    if (!nick.trim() || !Number.isFinite(p) || p <= 0) {
      setError('Укажите ник и мощь.')
      return
    }
    setError(null)
    onChange({
      ...lanes,
      [lane]: [...lanes[lane], createPlayer(nick, Math.round(p))],
    })
    setNick('')
    setPower('')
  }

  function removePlayer(l: LaneId, id: string) {
    onChange({ ...lanes, [l]: lanes[l].filter((p) => p.id !== id) })
  }

  function updatePower(l: LaneId, id: string, nextPower: number) {
    onChange({
      ...lanes,
      [l]: lanes[l].map((p) => (p.id === id ? { ...p, power: nextPower } : p)),
    })
  }

  function movePlayer(id: string, from: LaneId, to: LaneId) {
    if (from === to) return
    const player = lanes[from].find((p) => p.id === id)
    if (!player) return
    onChange({
      ...lanes,
      [from]: lanes[from].filter((p) => p.id !== id),
      [to]: [...lanes[to], player],
    })
  }

  const total = LANE_IDS.reduce((s, l) => s + lanes[l].length, 0)
  const fightTotal = LANE_IDS.reduce(
    (s, l) => s + Math.min(lanes[l].length, maxFight),
    0,
  )

  return (
    <section className={`panel panel-equal alliance-panel alliance-panel--${variant}`}>
      <header className="panel__head">
        <h2>{title}</h2>
        <span className={`tag ${variant === 'enemy' ? 'tag--enemy' : 'badge-ok'}`}>
          {allianceTag}
        </span>
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
          Очистить
        </button>
      </div>

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

      <p className="meta">
        Всего: <strong>{total}</strong>
        {allowOverflow && (
          <>
            {' '}
            · в бою (топ-{maxFight}/линия): <strong>{fightTotal}</strong>
          </>
        )}
      </p>

      <div className="enemy-lanes">
        {LANE_IDS.map((l) => (
          <LaneEditor
            key={l}
            lane={l}
            players={lanes[l]}
            maxFight={maxFight}
            allowOverflow={allowOverflow}
            variant={variant}
            onClear={() => onChange({ ...lanes, [l]: [] })}
            onRemove={(id) => removePlayer(l, id)}
            onEditPower={(id, pow) => updatePower(l, id, pow)}
            onMoveTo={(id, to) => movePlayer(id, l, to)}
          />
        ))}
      </div>
    </section>
  )
}

function LaneEditor({
  lane,
  players,
  maxFight,
  allowOverflow,
  variant,
  onClear,
  onRemove,
  onEditPower,
  onMoveTo,
}: {
  lane: LaneId
  players: Player[]
  maxFight: number
  allowOverflow: boolean
  variant: 'ally' | 'enemy'
  onClear: () => void
  onRemove: (id: string) => void
  onEditPower: (id: string, power: number) => void
  onMoveTo: (id: string, to: LaneId) => void
}) {
  const sorted = sortForDisplay(players)
  const fightingIds = new Set(topFighters(players, maxFight).map((p) => p.id))
  const overflow = allowOverflow && players.length > maxFight

  return (
    <div
      className={`enemy-lane ${variant === 'enemy' ? 'enemy-lane--foe' : 'enemy-lane--ally'}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/player-id')
        const from = e.dataTransfer.getData('text/from') as LaneId
        if (id && from && from !== lane) onMoveTo(id, lane)
      }}
    >
      <div className="enemy-lane__head">
        <h3>{LANE_LABELS[lane]}</h3>
        <span>
          {players.length}
          {overflow ? ` (бой: ${maxFight})` : ''} · {formatPower(lanePower(topFighters(players, maxFight)))}
        </span>
        <button type="button" className="btn btn--tiny" onClick={onClear}>
          очистить
        </button>
      </div>
      <ul>
        {sorted.map((p) => {
          const inFight = fightingIds.has(p.id)
          return (
            <li
              key={p.id}
              className={inFight ? '' : 'is-bench'}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/player-id', p.id)
                e.dataTransfer.setData('text/from', lane)
              }}
              title={inFight ? 'В бою' : `Вне топ-${maxFight} — не участвует в бою`}
            >
              <span className="ord">
                {(() => {
                  if (!inFight) return '—'
                  const fighters = sortForDisplay(topFighters(players, maxFight))
                  const idx = fighters.findIndex((x) => x.id === p.id)
                  return turnOrderNumber(idx, fighters.length)
                })()}
              </span>
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
              <select
                className="lane-move"
                value={lane}
                onChange={(e) => onMoveTo(p.id, e.target.value as LaneId)}
                title="Перенести на линию"
              >
                {LANE_IDS.map((x) => (
                  <option key={x} value={x}>
                    {x === 'left' ? 'Л' : x === 'center' ? 'Ц' : 'П'}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn--tiny" onClick={() => onRemove(p.id)}>
                ×
              </button>
            </li>
          )
        })}
      </ul>
      {overflow && (
        <p className="hint tiny">
          Серым — запас: в бой идут только {maxFight} самых сильных на линии.
        </p>
      )}
    </div>
  )
}
