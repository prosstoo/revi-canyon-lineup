import { formatPower } from '../lib/parseRoster'
import { lanePower } from '../lib/simulate'
import type { LaneAssignment, LaneId, Player } from '../types'
import { LANE_IDS, LANE_LABELS } from '../types'

interface Props {
  assignment: LaneAssignment
  allianceTag?: string
  title?: string
  maxPerLane: number
  onMove?: (playerId: string, from: LaneId, to: LaneId) => void
}

/** Главный результат: три линии — ник и мощь (БМ), как в игре */
export function LineupResult({
  assignment,
  allianceTag = 'REVI',
  title = 'Расстановка по линиям',
  maxPerLane,
  onMove,
}: Props) {
  const total = LANE_IDS.reduce((s, l) => s + assignment[l].length, 0)
  if (total === 0) {
    return (
      <section className="panel result-panel" id="result">
        <div className="panel-head">
          <h2>{title}</h2>
          <span className="badge">{allianceTag}</span>
        </div>
        <p className="muted">
          Загрузите ростер и нажмите «Рассчитать» — здесь появятся три линии с ником и
          мощью.
        </p>
      </section>
    )
  }

  return (
    <section className="panel result-panel" id="result">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p className="muted small">
            Порядок хода: слабые → сильные. Показываются ник и мощь отряда (БМ).
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
            onDrop={(id, from) => onMove?.(id, from, lane)}
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
}: {
  lane: LaneId
  players: Player[]
  maxPerLane: number
  onDrop: (id: string, from: LaneId) => void
}) {
  const sorted = [...players].sort((a, b) => a.power - b.power)
  const over = players.length > maxPerLane

  return (
    <div
      className={`result-lane ${over ? 'is-over' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/player-id')
        const from = e.dataTransfer.getData('text/from') as LaneId
        if (id && from) onDrop(id, from)
      }}
    >
      <div className="result-lane-head">
        <h3>{LANE_LABELS[lane]}</h3>
        <span>
          {players.length}/{maxPerLane} · Σ {formatPower(lanePower(players))}
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th className="col-ord">№</th>
            <th>Ник</th>
            <th className="col-pow">Мощь</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr
              key={p.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/player-id', p.id)
                e.dataTransfer.setData('text/from', lane)
              }}
            >
              <td className="col-ord">{i + 1}</td>
              <td className="col-nick">{p.nick}</td>
              <td className="col-pow">{formatPower(p.power)}</td>
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
}

export function EnemyLineupView({ enemy }: EnemyProps) {
  return (
    <section className="panel" id="enemy-view">
      <div className="panel-head">
        <h2>Соперник BDSM</h2>
        <span className="badge badge-warn">BDSM</span>
      </div>
      <div className="result-lanes">
        {LANE_IDS.map((lane) => {
          const players = [...enemy[lane]].sort((a, b) => a.power - b.power)
          return (
            <div key={lane} className="result-lane result-lane--enemy">
              <div className="result-lane-head">
                <h3>{LANE_LABELS[lane]}</h3>
                <span>
                  {players.length} · Σ {formatPower(lanePower(players))}
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th className="col-ord">№</th>
                    <th>Ник</th>
                    <th className="col-pow">Мощь</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, i) => (
                    <tr key={p.id}>
                      <td className="col-ord">{i + 1}</td>
                      <td className="col-nick">{p.nick}</td>
                      <td className="col-pow">{formatPower(p.power)}</td>
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
