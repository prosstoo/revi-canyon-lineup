import type { StrategyId } from '../types'
import { STRATEGY_META } from '../types'
import { JoustAnimation } from './JoustAnimation'

interface Props {
  strategy: StrategyId
  onStrategy: (s: StrategyId) => void
  onApply: () => void
  onExport: () => void
  busy?: boolean
}

const STRATEGY_IDS = Object.keys(STRATEGY_META) as StrategyId[]

export function StrategyPanel({
  strategy,
  onStrategy,
  onApply,
  onExport,
  busy,
}: Props) {
  return (
    <section className="panel">
      <header className="panel__head">
        <h2>Стратегия</h2>
        <span className="tag">наше право ↔ их лево</span>
      </header>

      <div className="strategies">
        {STRATEGY_IDS.map((id) => (
          <label key={id} className={`strat ${strategy === id ? 'strat--active' : ''}`}>
            <input
              type="radio"
              name="strategy"
              checked={strategy === id}
              onChange={() => onStrategy(id)}
            />
            <span className="strat__title">{STRATEGY_META[id].title}</span>
            <span className="strat__desc">{STRATEGY_META[id].description}</span>
          </label>
        ))}
      </div>

      <div className="calc-row">
        <JoustAnimation size="sm" className="calc-row__joust" />
        <div className="upload-row calc-row__btns">
          <button type="button" className="btn btn-primary" onClick={onApply} disabled={busy}>
            Рассчитать расстановку
          </button>
          <button type="button" className="btn btn-secondary" onClick={onExport}>
            Экспорт CSV
          </button>
        </div>
      </div>
    </section>
  )
}
