import { formatPower } from '../lib/parseRoster'
import type { MatchSimResult } from '../types'
import { FACING_LANE, LANE_IDS, LANE_LABELS } from '../types'

interface Props {
  result: MatchSimResult | null
  title?: string
  ourLabel?: string
  theirLabel?: string
}

export function SimResults({
  result,
  title = 'Прогноз боёв',
  ourLabel = 'LMB',
  theirLabel = 'ASBI',
}: Props) {
  if (!result) {
    return (
      <section className="panel">
        <header className="panel__head">
          <h2>{title}</h2>
        </header>
        <p className="hint">Нажмите «Рассчитать расстановку».</p>
      </section>
    )
  }

  const outcomeLabel =
    result.outcome === 'win'
      ? `Победа ${ourLabel}`
      : result.outcome === 'lose'
        ? 'Поражение'
        : 'Ничья'

  return (
    <section className="panel">
      <header className="panel__head">
        <h2>{title}</h2>
        <span
          className={`tag ${
            result.outcome === 'win'
              ? 'tag--win'
              : result.outcome === 'lose'
                ? 'tag--lose'
                : ''
          }`}
        >
          {outcomeLabel}: {result.ourFlags} : {result.theirFlags}
        </span>
      </header>

      <div className="sim-lanes">
        {LANE_IDS.map((lane) => {
          const r = result.lanes[lane]
          const facing = r.facingLane ?? FACING_LANE[lane]
          const w =
            r.winner === 'us'
              ? ourLabel
              : r.winner === 'them'
                ? theirLabel
                : 'ничья'
          return (
            <div key={lane} className={`sim-lane sim-lane--${r.winner}`}>
              <h3>
                Наша {LANE_LABELS[lane].toLowerCase()} vs их{' '}
                {LANE_LABELS[facing].toLowerCase()} — {w}
              </h3>
              <p className="meta">
                Выжившие: мы {r.ourSurvivors} / враг {r.theirSurvivors} · дуэлей:{' '}
                {r.fights.length}
              </p>
              <div className="table-wrap table-wrap--full">
                <table>
                  <thead>
                    <tr>
                      <th>{ourLabel}</th>
                      <th>Мощь</th>
                      <th>Эфф.</th>
                      <th></th>
                      <th>{theirLabel}</th>
                      <th>Мощь</th>
                      <th>Эфф.</th>
                      <th>Остаток</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.fights.map((f, i) => (
                      <tr
                        key={`${lane}-${i}`}
                        className={f.winner === 'us' ? 'row-win' : 'row-lose'}
                      >
                        <td>{f.oursNick}</td>
                        <td>{formatPower(f.oursPower)}</td>
                        <td className="col-eff" title="С учётом цвета и моно">
                          {formatPower(f.oursEffective)}
                        </td>
                        <td>{f.winner === 'us' ? '▶' : '◀'}</td>
                        <td>{f.theirsNick}</td>
                        <td>{formatPower(f.theirsPower)}</td>
                        <td className="col-eff" title="С учётом цвета и моно">
                          {formatPower(f.theirsEffective)}
                        </td>
                        <td>{formatPower(f.residual)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
