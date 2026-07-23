import { useMemo, useState } from 'react'
import { LineBoard } from './components/LineBoard'
import { OpponentSetup } from './components/OpponentSetup'
import { RosterUpload } from './components/RosterUpload'
import { SimResults } from './components/SimResults'
import { StrategyPanel } from './components/StrategyPanel'
import { assignmentToCsv } from './lib/parseRoster'
import { makeSampleEnemy, makeSampleReviRoster } from './lib/sampleData'
import { emptyLanes, simulateMatch } from './lib/simulate'
import { applyStrategy } from './lib/strategies'
import type {
  BattleSettings,
  LaneAssignment,
  LaneId,
  MatchSimResult,
  Player,
  StrategyId,
} from './types'
import { DEFAULT_SETTINGS, LANE_IDS } from './types'
import './App.css'

export default function App() {
  const [roster, setRoster] = useState<Player[]>([])
  const [enemy, setEnemy] = useState<LaneAssignment>(emptyLanes())
  const [assignment, setAssignment] = useState<LaneAssignment>(emptyLanes())
  const [strategy, setStrategy] = useState<StrategyId>('maximizeFlags')
  const [settings, setSettings] = useState<BattleSettings>(DEFAULT_SETTINGS)
  const [result, setResult] = useState<MatchSimResult | null>(null)

  const assignedIds = useMemo(() => {
    const s = new Set<string>()
    for (const lane of LANE_IDS) {
      for (const p of assignment[lane]) s.add(p.id)
    }
    return s
  }, [assignment])

  const unassigned = useMemo(
    () => roster.filter((p) => !assignedIds.has(p.id)),
    [roster, assignedIds],
  )

  function handleRosterChange(players: Player[]) {
    setRoster(players)
    setAssignment(emptyLanes())
    setResult(null)
  }

  function handleEnemyChange(next: LaneAssignment) {
    setEnemy(next)
    const hasAssigned = LANE_IDS.some((l) => assignment[l].length > 0)
    if (hasAssigned) setResult(simulateMatch(assignment, next, settings))
  }

  function handleApply() {
    const next = applyStrategy(strategy, roster, enemy, settings)
    setAssignment(next)
    setResult(simulateMatch(next, enemy, settings))
  }

  function handleMove(playerId: string, from: LaneId | 'bench', to: LaneId | 'bench') {
    if (from === to) return
    const player =
      from === 'bench'
        ? roster.find((p) => p.id === playerId)
        : assignment[from].find((p) => p.id === playerId)
    if (!player) return

    const next: LaneAssignment = {
      left: [...assignment.left],
      center: [...assignment.center],
      right: [...assignment.right],
    }

    if (from !== 'bench') {
      next[from] = next[from].filter((p) => p.id !== playerId)
    } else {
      // leaving bench — ensure not duplicated
      for (const lane of LANE_IDS) {
        next[lane] = next[lane].filter((p) => p.id !== playerId)
      }
    }

    if (to !== 'bench') {
      // remove from any lane first
      for (const lane of LANE_IDS) {
        next[lane] = next[lane].filter((p) => p.id !== playerId)
      }
      next[to] = [...next[to], player].sort((a, b) => a.power - b.power)
    }

    setAssignment(next)
    setResult(simulateMatch(next, enemy, settings))
  }

  function handleExport() {
    const csv = assignmentToCsv(assignment)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'revi-lineup.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function loadDemo() {
    const revi = makeSampleReviRoster()
    const bdsm = makeSampleEnemy()
    setRoster(revi)
    setEnemy(bdsm)
    const next = applyStrategy('maximizeFlags', revi, bdsm, settings)
    setAssignment(next)
    setStrategy('maximizeFlags')
    setResult(simulateMatch(next, bdsm, settings))
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Альянс REVI · ивент</p>
          <h1>Завоевание каньона</h1>
          <p className="lead">
            Авторасстановка игроков по трём линиям под эстафетный бой. Загрузите
            ростер REVI и состав соперника, выберите стратегию и получите прогноз
            флагов.
          </p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={loadDemo}>
          Демо: REVI vs BDSM
        </button>
      </header>

      <div className="grid">
        <RosterUpload
          title="Ростер REVI"
          allianceTag="REVI"
          players={roster}
          onChange={handleRosterChange}
        />
        <OpponentSetup enemy={enemy} onChange={handleEnemyChange} />
        <StrategyPanel
          strategy={strategy}
          onStrategy={setStrategy}
          settings={settings}
          onSettings={(s) => {
            setSettings(s)
            const hasAssigned = LANE_IDS.some((l) => assignment[l].length > 0)
            if (hasAssigned) setResult(simulateMatch(assignment, enemy, s))
          }}
          onApply={handleApply}
          onExport={handleExport}
        />
      </div>

      <LineBoard
        assignment={assignment}
        maxPerLane={settings.maxPerLane}
        unassigned={unassigned}
        onMove={handleMove}
      />

      <SimResults result={result} />

      <footer className="footer">
        <p>
          Модель боя упрощённая: победитель продолжает с остатком{' '}
          <code>P_win − k · P_lose</code>, порядок на линии по возрастанию мощи,
          лимит боёв на отряд настраивается. Для точной калибровки сверьте{' '}
          <code>k</code> с боевыми отчётами.
        </p>
      </footer>
    </div>
  )
}
