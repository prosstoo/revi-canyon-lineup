import type { BattleSettings, StrategyId } from '../types'
import { STRATEGY_META } from '../types'

interface Props {
  strategy: StrategyId
  onStrategy: (s: StrategyId) => void
  settings: BattleSettings
  onSettings: (s: BattleSettings) => void
  onApply: () => void
  onExport: () => void
  busy?: boolean
}

const STRATEGY_IDS = Object.keys(STRATEGY_META) as StrategyId[]

export function StrategyPanel({
  strategy,
  onStrategy,
  settings,
  onSettings,
  onApply,
  onExport,
  busy,
}: Props) {
  return (
    <section className="panel">
      <header className="panel__head">
        <h2>Стратегия и настройки</h2>
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

      <div className="settings-grid">
        <label className="field">
          <span>Макс. на линию</span>
          <input
            type="number"
            min={1}
            max={50}
            value={settings.maxPerLane}
            onChange={(e) =>
              onSettings({ ...settings, maxPerLane: Number(e.target.value) || 15 })
            }
          />
        </label>
        <label className="field">
          <span>Лимит боёв отряда</span>
          <input
            type="number"
            min={1}
            max={5}
            value={settings.maxBattles}
            onChange={(e) =>
              onSettings({ ...settings, maxBattles: Number(e.target.value) || 3 })
            }
          />
        </label>
        <label className="field">
          <span>Коэфф. урона (модель)</span>
          <input
            type="number"
            min={0.1}
            max={2}
            step={0.05}
            value={settings.damageCoeff}
            onChange={(e) =>
              onSettings({
                ...settings,
                damageCoeff: Number(e.target.value) || 1,
              })
            }
          />
        </label>
      </div>

      <div className="upload-row">
        <button type="button" className="btn btn--primary" onClick={onApply} disabled={busy}>
          Рассчитать расстановку
        </button>
        <button type="button" className="btn btn--secondary" onClick={onExport}>
          Экспорт CSV
        </button>
      </div>
    </section>
  )
}
