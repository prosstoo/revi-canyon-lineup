import { formatPower } from '../lib/parseRoster'
import { lanePower } from '../lib/simulate'
import type { LaneAssignment, LaneId, Player } from '../types'
import { LANE_IDS, LANE_LABELS } from '../types'

interface Props {
  assignment: LaneAssignment
  maxPerLane: number
  unassigned: Player[]
  onMove: (playerId: string, from: LaneId | 'bench', to: LaneId | 'bench') => void
}

export function LineBoard({ assignment, maxPerLane, unassigned, onMove }: Props) {
  return (
    <section className="panel panel--wide">
      <header className="panel__head">
        <h2>Расстановка REVI</h2>
        <span className="tag">порядок на линии: слабые → сильные</span>
      </header>

      <div className="lanes">
        {LANE_IDS.map((lane) => (
          <LaneColumn
            key={lane}
            lane={lane}
            players={assignment[lane]}
            maxPerLane={maxPerLane}
            onDropPlayer={(id, from) => onMove(id, from, lane)}
            onRemove={(id) => onMove(id, lane, 'bench')}
          />
        ))}
      </div>

      <div
        className="bench"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const id = e.dataTransfer.getData('text/player-id')
          const from = e.dataTransfer.getData('text/from') as LaneId | 'bench'
          if (id) onMove(id, from, 'bench')
        }}
      >
        <h3>
          Скамейка <span>({unassigned.length})</span>
        </h3>
        <div className="bench__list">
          {[...unassigned]
            .sort((a, b) => b.power - a.power)
            .map((p) => (
              <PlayerChip key={p.id} player={p} from="bench" />
            ))}
        </div>
      </div>
    </section>
  )
}

function LaneColumn({
  lane,
  players,
  maxPerLane,
  onDropPlayer,
  onRemove,
}: {
  lane: LaneId
  players: Player[]
  maxPerLane: number
  onDropPlayer: (id: string, from: LaneId | 'bench') => void
  onRemove: (id: string) => void
}) {
  const over = players.length > maxPerLane
  const sorted = [...players].sort((a, b) => a.power - b.power)

  return (
    <div
      className={`lane-col ${over ? 'lane-col--over' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/player-id')
        const from = e.dataTransfer.getData('text/from') as LaneId | 'bench'
        if (id) onDropPlayer(id, from)
      }}
    >
      <div className="lane-col__head">
        <h3>{LANE_LABELS[lane]}</h3>
        <p>
          {players.length}/{maxPerLane} · {formatPower(lanePower(players))}
        </p>
        {over && <p className="warn">Превышен лимит линии</p>}
      </div>
      <ol>
        {sorted.map((p, i) => (
          <li key={p.id}>
            <PlayerChip player={p} from={lane} order={i + 1} onRemove={() => onRemove(p.id)} />
          </li>
        ))}
      </ol>
    </div>
  )
}

function PlayerChip({
  player,
  from,
  order,
  onRemove,
}: {
  player: Player
  from: LaneId | 'bench'
  order?: number
  onRemove?: () => void
}) {
  return (
    <div
      className="chip"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/player-id', player.id)
        e.dataTransfer.setData('text/from', from)
      }}
    >
      {order != null && <span className="chip__ord">{order}</span>}
      <span className="chip__nick">{player.nick}</span>
      <span className="chip__pow">{formatPower(player.power)}</span>
      {onRemove && (
        <button type="button" className="btn btn--tiny" onClick={onRemove} title="На скамейку">
          ↩
        </button>
      )}
    </div>
  )
}
