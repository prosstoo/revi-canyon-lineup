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
  name: string
  onNameChange: (name: string) => void
  lanes: LaneAssignment
  onChange: (lanes: LaneAssignment) => void
  maxFight?: number
  accent: 'ally' | 'enemy'
  allowLaneSwap?: boolean
}

export function AlliancePanel({
  name,
  onNameChange,
  lanes,
  onChange,
  maxFight = 15,
  accent,
  allowLaneSwap = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lane, setLane] = useState<LaneId>('left')
  const [nick, setNick] = useState('')
  const [power, setPower] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  function swapLanes(a: LaneId, b: LaneId) {
    if (a === b) return
    onChange({ ...lanes, [a]: lanes[b], [b]: lanes[a] })
  }

  async function onFile(file: File | null) {
    if (!file) return
    setError(null)
    try {
      const parsed = await parseOpponentFile(file)
      const next = emptyLanes()
      for (const l of LANE_IDS) next[l] = parsed[l] ?? []
      onChange(next)
    } catch {
      setError('Не удалось прочитать файл. Нужны столбцы ник, мощь, lane.')
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
    <section className={`panel panel-equal alliance-panel alliance-panel--${accent}`}>
      <header className="panel__head alliance-head">
        <label className="alliance-name-field">
          <span className="muted small">Название альянса</span>
          <input
            className="alliance-name-input"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            aria-label="Название альянса"
          />
        </label>
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
          onClick={() => setShowAdd((v) => !v)}
        >
          {showAdd ? 'Скрыть добавление' : 'Добавить игрока'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => onChange(emptyLanes())}>
          Очистить
        </button>
        {allowLaneSwap && (
          <div className="lane-swap-inline" role="group" aria-label="Линии местами">
            <span className="lane-swap-label">Линии местами</span>
            <button type="button" className="btn lane-swap-btn" onClick={() => swapLanes('left', 'center')}>
              Л ↔ Ц
            </button>
            <button type="button" className="btn lane-swap-btn" onClick={() => swapLanes('center', 'right')}>
              Ц ↔ П
            </button>
            <button type="button" className="btn lane-swap-btn" onClick={() => swapLanes('left', 'right')}>
              Л ↔ П
            </button>
          </div>
        )}
      </div>

      {showAdd && (
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
      )}

      {error && <p className="error">{error}</p>}

      <p className="meta">
        Всего: <strong>{total}</strong> · в бою (топ-{maxFight}/линия): <strong>{fightTotal}</strong>
      </p>

      <div className="lane-editors">
        {LANE_IDS.map((l) => (
          <LaneEditor
            key={l}
            lane={l}
            players={lanes[l]}
            maxFight={maxFight}
            allowLaneSwap={allowLaneSwap}
            onClear={() => onChange({ ...lanes, [l]: [] })}
            onRemove={(id) => removePlayer(l, id)}
            onEditPower={(id, pow) => updatePower(l, id, pow)}
            onMoveTo={(id, to) => movePlayer(id, l, to)}
            onSwapWith={(other) => swapLanes(l, other)}
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
  allowLaneSwap,
  onClear,
  onRemove,
  onEditPower,
  onMoveTo,
  onSwapWith,
}: {
  lane: LaneId
  players: Player[]
  maxFight: number
  allowLaneSwap: boolean
  onClear: () => void
  onRemove: (id: string) => void
  onEditPower: (id: string, power: number) => void
  onMoveTo: (id: string, to: LaneId) => void
  onSwapWith: (other: LaneId) => void
}) {
  const sorted = sortForDisplay(players)
  const fighters = sortForDisplay(topFighters(players, maxFight))
  const fightingIds = new Set(fighters.map((p) => p.id))
  const overflow = players.length > maxFight
  const others = LANE_IDS.filter((x) => x !== lane)

  return (
    <div
      className="lane-editor"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/player-id')
        const from = e.dataTransfer.getData('text/from') as LaneId
        if (id && from && from !== lane) onMoveTo(id, lane)
      }}
    >
      <div className="lane-editor__head">
        <h3>
          <span className={`lane-mark lane-mark--${lane}`} aria-hidden />
          {LANE_LABELS[lane]}
        </h3>
        <span>
          {players.length}
          {overflow ? ` (бой: ${maxFight})` : ''} · {formatPower(lanePower(fighters))}
        </span>
        {allowLaneSwap && (
          <div className="lane-head-swaps">
            {others.map((o) => (
              <button
                key={o}
                type="button"
                className="btn btn--tiny"
                title={`Поменять с: ${LANE_LABELS[o]}`}
                onClick={() => onSwapWith(o)}
              >
                ↔ {o === 'left' ? 'Л' : o === 'center' ? 'Ц' : 'П'}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="btn btn--tiny" onClick={onClear}>
          очистить
        </button>
      </div>
      <ul>
        {sorted.map((p) => {
          const inFight = fightingIds.has(p.id)
          const idx = fighters.findIndex((x) => x.id === p.id)
          return (
            <li
              key={p.id}
              className={inFight ? '' : 'is-bench'}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/player-id', p.id)
                e.dataTransfer.setData('text/from', lane)
              }}
            >
              <span className="ord">
                {inFight ? turnOrderNumber(idx, fighters.length) : '—'}
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
                title="Линия"
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
        <p className="hint tiny">Серым — запас: в бой идут только {maxFight} самых сильных.</p>
      )}
    </div>
  )
}
