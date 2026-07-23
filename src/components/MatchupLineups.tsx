import { formatPower } from '../lib/parseRoster'
import {
  fightingLanes,
  lanePower,
  sortForDisplay,
  turnOrderNumber,
} from '../lib/simulate'
import type { LaneAssignment, LaneId, MatchSimResult, Player } from '../types'
import { FACING_LANE, LANE_IDS, LANE_LABELS } from '../types'
import { CrossedSwords } from './JoustAnimation'

interface Props {
  title: string
  badge: string
  ourName: string
  enemyName: string
  ours: LaneAssignment
  enemy: LaneAssignment
  maxPerLane: number
  result?: MatchSimResult | null
  editable?: boolean
  onMove?: (playerId: string, from: LaneId, to: LaneId) => void
  onEditPower?: (playerId: string, power: number) => void
}

/** 6 таблиц в ряд: наша линия | линия врага напротив × 3 */
export function MatchupLineups({
  title,
  badge,
  ourName,
  enemyName,
  ours,
  enemy,
  maxPerLane,
  result,
  editable,
  onMove,
  onEditPower,
}: Props) {
  const ourFight = fightingLanes(ours, maxPerLane)
  const theirFight = fightingLanes(enemy, maxPerLane)

  return (
    <section className="panel matchup-panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p className="muted small">
            В каждом поединке слева — {ourName}, справа — линия {enemyName} напротив.
            Порядок: сильные → слабые.
          </p>
        </div>
        <div className="matchup-head-meta">
          {result && (
            <span
              className={`badge ${result.outcome === 'win' ? 'badge-ok' : result.outcome === 'lose' ? 'badge-warn' : ''}`}
            >
              {result.ourFlags}:{result.theirFlags}
            </span>
          )}
          <span className="badge badge-ok">{badge}</span>
        </div>
      </div>

      <div className="matchup-scroll">
        <div className="matchup-grid">
          {LANE_IDS.map((ourLane) => {
            const theirLane = FACING_LANE[ourLane]
            const laneResult = result?.lanes[ourLane]
            return (
              <div key={ourLane} className="matchup-pair">
                <div className="matchup-pair-label">
                  <span>
                    <CrossedSwords /> {LANE_LABELS[ourLane]} vs {LANE_LABELS[theirLane]}
                  </span>
                  {laneResult && (
                    <span
                      className={
                        laneResult.winner === 'us'
                          ? 'ok'
                          : laneResult.winner === 'them'
                            ? 'err'
                            : 'muted'
                      }
                    >
                      {laneResult.winner === 'us'
                        ? 'флаг наш'
                        : laneResult.winner === 'them'
                          ? 'флаг врага'
                          : 'ничья'}
                    </span>
                  )}
                </div>
                <div className="matchup-pair-tables">
                  <LaneMiniTable
                    accent="ally"
                    title={`${ourName} · ${shortLane(ourLane)}`}
                    subtitle="наш состав"
                    lane={ourLane}
                    players={ourFight[ourLane]}
                    fullCount={ours[ourLane].length}
                    maxPerLane={maxPerLane}
                    editable={editable}
                    onMove={onMove}
                    onEditPower={onEditPower}
                  />
                  <LaneMiniTable
                    accent="enemy"
                    title={`${enemyName} · ${shortLane(theirLane)}`}
                    subtitle="напротив"
                    lane={theirLane}
                    players={theirFight[theirLane]}
                    fullCount={enemy[theirLane].length}
                    maxPerLane={maxPerLane}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function shortLane(lane: LaneId): string {
  return lane === 'left' ? 'Л' : lane === 'center' ? 'Ц' : 'П'
}

function LaneMiniTable({
  accent,
  title,
  subtitle,
  lane,
  players,
  fullCount,
  maxPerLane,
  editable,
  onMove,
  onEditPower,
}: {
  accent: 'ally' | 'enemy'
  title: string
  subtitle: string
  lane: LaneId
  players: Player[]
  fullCount: number
  maxPerLane: number
  editable?: boolean
  onMove?: (playerId: string, from: LaneId, to: LaneId) => void
  onEditPower?: (playerId: string, power: number) => void
}) {
  const sorted = sortForDisplay(players)
  const canDrag = Boolean(editable && onMove)

  return (
    <div
      className={`result-lane matchup-lane result-lane--${accent === 'enemy' ? 'enemy' : 'ally'}`}
      onDragOver={(e) => canDrag && e.preventDefault()}
      onDrop={
        canDrag
          ? (e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/player-id')
              const from = e.dataTransfer.getData('text/from') as LaneId
              if (id && from && onMove) onMove(id, from, lane)
            }
          : undefined
      }
    >
      <div className="result-lane-head">
        <div>
          <h3>{title}</h3>
          <p className="muted small">{subtitle}</p>
        </div>
        <span>
          {fullCount > maxPerLane ? `${maxPerLane}/${fullCount}` : fullCount} · Σ{' '}
          {formatPower(lanePower(players))}
        </span>
      </div>
      <div className="matchup-table-wrap matchup-table-wrap--full">
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
                draggable={canDrag}
                onDragStart={
                  canDrag
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
                  {onEditPower && editable ? (
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
    </div>
  )
}
