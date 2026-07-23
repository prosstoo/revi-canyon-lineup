import { formatPower } from '../lib/parseRoster'
import type { MatchSimResult } from '../types'
import { LANE_IDS, LANE_LABELS } from '../types'

interface Props {
  result: MatchSimResult | null
}

export function SimResults({ result }: Props) {
  if (!result) {
    return (
      <section className="panel">
        <header className="panel__head">
          <h2>Прогноз боя</h2>
        </header>
        <p className="hint">Загрузите ростеры и нажмите «Рассчитать расстановку».</p>
      </section>
    )
  }

  const outcomeLabel =
    result.outcome === 'win'
      ? 'Победа REVI'
      : result.outcome === 'lose'
        ? 'Поражение'
        : 'Ничья'

  return (
    <section className="panel panel--wide">
      <header className="panel__head">
        <h2>Прогноз боя</h2>
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
          const w =
            r.winner === 'us' ? 'REVI' : r.winner === 'them' ? 'враг' : 'ничья'
          return (
            <div key={lane} className={`sim-lane sim-lane--${r.winner}`}>
              <h3>
                {LANE_LABELS[lane]} — {w}
              </h3>
              <p className="meta">
                Выжившие: мы {r.ourSurvivors} / враг {r.theirSurvivors} · дуэлей:{' '}
                {r.fights.length}
              </p>
              <div className="table-wrap table-wrap--compact">
                <table>
                  <thead>
                    <tr>
                      <th>REVI</th>
                      <th>Мощь</th>
                      <th></th>
                      <th>Враг</th>
                      <th>Мощь</th>
                      <th>Остаток</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.fights.map((f, i) => (
                      <tr key={`${lane}-${i}`} className={f.winner === 'us' ? 'row-win' : 'row-lose'}>
                        <td>{f.oursNick}</td>
                        <td>{formatPower(f.oursPower)}</td>
                        <td>{f.winner === 'us' ? '▶' : '◀'}</td>
                        <td>{f.theirsNick}</td>
                        <td>{formatPower(f.theirsPower)}</td>
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
