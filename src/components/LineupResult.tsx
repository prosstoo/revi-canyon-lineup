import { formatPower } from '../lib/parseRoster'
import { lanePower, sortForDisplay, turnOrderNumber } from '../lib/simulate'
import type { LaneAssignment, LaneId, Player } from '../types'
import { FACING_LANE, LANE_IDS, LANE_LABELS } from '../types'

interface Props {
  assignment: LaneAssignment
  allianceTag?: string
  title?: string
  maxPerLane: number
  onMove?: (playerId: string, from: LaneId, to: LaneId) => void
  onEditPower?: (playerId: string, power: number) => void
  showFacingHint?: boolean
}

export function LineupResult({
  assignment,
  allianceTag = 'REVI',
  title = 'Расстановка по линиям',
  maxPerLane,
  onMove,
  onEditPower,
  showFacingHint,
}: Props) {
  const total = LANE_IDS.reduce((s, l) => s + assignment[l].length, 0)
  if (total === 0) {
    return (
      <section className="panel result-panel">
        <div className="panel-head">
          <h2>{title}</h2>
          <span className="badge">{allianceTag}</span>
        </div>
        <p className="muted">Нет игроков на линиях.</p>
      </section>
    )
  }

  return (
    <section className="panel result-panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p className="muted small">
            Порядок в списке: сильные → слабые (ход {Math.max(...LANE_IDS.map((l) => assignment[l].length), 1)}…1).
            {showFacingHint ? ' Наша левая бьётся с их правой, наша правая — с их левой.' : ''}
          </p>
        </div>
        <span className="badge badge-ok">{allianceTag}</span>
      </div>

      <div className="result-lanes">
        {LANE_IDS.map((lane) => (
          <LaneTable
            key={lane}
            lane={lane}
            players={assignment[lane]}
            maxPerLane={maxPerLane}
            onDrop={onMove ? (id, from) => onMove(id, from, lane) : undefined}
            onEditPower={onEditPower}
            facingLabel={
              showFacingHint
                ? `против их: ${LANE_LABELS[FACING_LANE[lane]]}`
                : undefined
            }
          />
        ))}
      </div>
    </section>
  )
}

function LaneTable({
  lane,
  players,
  maxPerLane,
  onDrop,
  onEditPower,
  facingLabel,
}: {
  lane: LaneId
  players: Player[]
  maxPerLane: number
  onDrop?: (id: string, from: LaneId) => void
  onEditPower?: (playerId: string, power: number) => void
  facingLabel?: string
}) {
  const sorted = sortForDisplay(players)
  const over = players.length > maxPerLane

  return (
    <div
      className={`result-lane ${over ? 'is-over' : ''}`}
      onDragOver={(e) => onDrop && e.preventDefault()}
      onDrop={
        onDrop
          ? (e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/player-id')
              const from = e.dataTransfer.getData('text/from') as LaneId
              if (id && from) onDrop(id, from)
            }
          : undefined
      }
    >
      <div className="result-lane-head">
        <div>
          <h3>{LANE_LABELS[lane]}</h3>
          {facingLabel && <p className="muted small">{facingLabel}</p>}
        </div>
        <span>
          {players.length}/{maxPerLane} · Σ {formatPower(lanePower(players))}
        </span>
      </div>
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
            <tr
              key={p.id}
              draggable={Boolean(onDrop)}
              onDragStart={
                onDrop
                  ? (e) => {
                      e.dataTransfer.setData('text/player-id', p.id)
                      e.dataTransfer.setData('text/from', lane)
                    }
                  : undefined
              }
            >
              <td className="col-ord">{turnOrderNumber(i, sorted.length)}</td>
              <td className="col-nick">{p.nick}</td>
              <td className="col-pow">
                {onEditPower ? (
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
                ) : (
                  formatPower(p.power)
                )}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                Пусто
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

interface EnemyProps {
  enemy: LaneAssignment
  onEditPower?: (lane: LaneId, playerId: string, power: number) => void
}

export function EnemyLineupView({ enemy, onEditPower }: EnemyProps) {
  return (
    <section className="panel" id="enemy-view">
      <div className="panel-head">
        <div>
          <h2>Состав линий соперника</h2>
          <p className="muted small">
            Их левая стоит напротив нашей правой; их правая — напротив нашей левой.
          </p>
        </div>
        <span className="badge badge-warn">BDSM</span>
      </div>
      <div className="result-lanes">
        {LANE_IDS.map((lane) => {
          const players = sortForDisplay(enemy[lane])
          return (
            <div key={lane} className="result-lane result-lane--enemy">
              <div className="result-lane-head">
                <div>
                  <h3>{LANE_LABELS[lane]}</h3>
                  <p className="muted small">
                    против нашей: {LANE_LABELS[FACING_LANE[lane]]}
                  </p>
                </div>
                <span>
                  {players.length} · Σ {formatPower(lanePower(players))}
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th className="col-ord">Ход</th>
                    <th>Ник</th>
                    <th className="col-pow">Мощь</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => (
                    <tr key={p.id}>
                      <td className="col-ord">{turnOrderNumber(i, players.length)}</td>
                      <td className="col-nick">{p.nick}</td>
                      <td className="col-pow">
                        {onEditPower ? (
                          <input
                            className="power-input"
                            type="text"
                            inputMode="numeric"
                            defaultValue={String(p.power)}
                            key={`${p.id}-${p.power}`}
                            onBlur={(e) => {
                              const n = Number(
                                e.target.value.replace(/[\s\u00a0,]/g, ''),
                              )
                              if (Number.isFinite(n) && n > 0 && n !== p.power) {
                                onEditPower(lane, p.id, Math.round(n))
                              } else {
                                e.target.value = String(p.power)
                              }
                            }}
                          />
                        ) : (
                          formatPower(p.power)
                        )}
                      </td>
                    </tr>
                  ))}
                  {players.length === 0 && (
                    <tr>
                      <td colSpan={3} className="muted">
                        Нет данных
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </section>
  )
}
