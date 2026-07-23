import { useMemo, useState } from 'react'
import { EnemyLineupView, LineupResult } from './components/LineupResult'
import { OpponentSetup } from './components/OpponentSetup'
import { RosterUpload } from './components/RosterUpload'
import { SimResults } from './components/SimResults'
import { StrategyPanel } from './components/StrategyPanel'
import { assignmentToCsv } from './lib/parseRoster'
import {
  DEMO_NOTE,
  makeSampleEnemy,
  makeSampleReviRoster,
} from './lib/sampleData'
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
  const [enemy, setEnemy] = useState<LaneAssignment>(() => makeSampleEnemy())
  const [assignment, setAssignment] = useState<LaneAssignment>(emptyLanes())
  const [strategy, setStrategy] = useState<StrategyId>('maximizeFlags')
  const [settings, setSettings] = useState<BattleSettings>(DEFAULT_SETTINGS)
  const [result, setResult] = useState<MatchSimResult | null>(null)
  const [demoNote, setDemoNote] = useState<string | null>(null)
  const [section, setSection] = useState<'setup' | 'result' | 'battle'>('setup')

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
    setDemoNote(null)
  }

  function handleEnemyChange(next: LaneAssignment) {
    setEnemy(next)
    const hasAssigned = LANE_IDS.some((l) => assignment[l].length > 0)
    if (hasAssigned) setResult(simulateMatch(assignment, next, settings))
  }

  function handleApply() {
    if (roster.length === 0) return
    const next = applyStrategy(strategy, roster, enemy, settings)
    setAssignment(next)
    setResult(simulateMatch(next, enemy, settings))
    setSection('result')
  }

  function handleMoveBetweenLanes(playerId: string, from: LaneId, to: LaneId) {
    if (from === to) return
    const player = assignment[from].find((p) => p.id === playerId)
    if (!player) return
    const next: LaneAssignment = {
      left: [...assignment.left],
      center: [...assignment.center],
      right: [...assignment.right],
    }
    next[from] = next[from].filter((p) => p.id !== playerId)
    next[to] = [...next[to], player].sort((a, b) => a.power - b.power)
    setAssignment(next)
    setResult(simulateMatch(next, enemy, settings))
  }

  function handleExport() {
    const csv = assignmentToCsv(assignment)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
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
    setDemoNote(DEMO_NOTE)
    const next = applyStrategy('maximizeFlags', revi, bdsm, settings)
    setAssignment(next)
    setStrategy('maximizeFlags')
    setResult(simulateMatch(next, bdsm, settings))
    setSection('result')
  }

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="side-nav-brand">
          <div className="side-nav-logo" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
              <circle cx="18" cy="16" r="2" />
            </svg>
          </div>
          <div className="side-nav-brand-text">
            <span className="side-nav-title">Каньон</span>
            <span className="side-nav-subtitle">REVI · линии</span>
          </div>
        </div>
        <nav className="side-nav-menu">
          <button
            type="button"
            className={`side-nav-item ${section === 'setup' ? 'is-active' : ''}`}
            onClick={() => setSection('setup')}
          >
            Данные
          </button>
          <button
            type="button"
            className={`side-nav-item ${section === 'result' ? 'is-active' : ''}`}
            onClick={() => setSection('result')}
          >
            Расстановка
          </button>
          <button
            type="button"
            className={`side-nav-item ${section === 'battle' ? 'is-active' : ''}`}
            onClick={() => setSection('battle')}
          >
            Бои
          </button>
        </nav>
        <button type="button" className="btn btn-secondary side-nav-demo" onClick={loadDemo}>
          Демо vs BDSM
        </button>
      </aside>

      <main className="app-main">
        <div className="app">
          <header className="page-header">
            <div>
              <p className="eyebrow">Альянс REVI</p>
              <h1>Завоевание каньона</h1>
              <p className="lead">
                Расстановка игроков по трём линиям: на выходе — ник и мощь (БМ), как в
                игре.
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={loadDemo}>
              Демо vs BDSM
            </button>
          </header>

          {demoNote && <div className="toast-note">{demoNote}</div>}

          {(section === 'setup' || section === 'result') && (
            <>
              {section === 'setup' && (
                <div className="grid-2">
                  <RosterUpload
                    title="Ростер REVI"
                    allianceTag="REVI"
                    players={roster}
                    onChange={handleRosterChange}
                  />
                  <OpponentSetup enemy={enemy} onChange={handleEnemyChange} />
                </div>
              )}

              {section === 'setup' && (
                <StrategyPanel
                  strategy={strategy}
                  onStrategy={setStrategy}
                  settings={settings}
                  onSettings={(s) => {
                    setSettings(s)
                    if (LANE_IDS.some((l) => assignment[l].length > 0)) {
                      setResult(simulateMatch(assignment, enemy, s))
                    }
                  }}
                  onApply={handleApply}
                  onExport={handleExport}
                />
              )}

              <LineupResult
                assignment={assignment}
                maxPerLane={settings.maxPerLane}
                onMove={handleMoveBetweenLanes}
              />

              {section === 'result' && <EnemyLineupView enemy={enemy} />}

              {unassigned.length > 0 && section === 'result' && (
                <section className="panel">
                  <div className="panel-head">
                    <h2>Не на линии</h2>
                    <span className="badge">{unassigned.length}</span>
                  </div>
                  <table className="plain-table">
                    <thead>
                      <tr>
                        <th>Ник</th>
                        <th className="col-pow">Мощь</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...unassigned]
                        .sort((a, b) => b.power - a.power)
                        .map((p) => (
                          <tr key={p.id}>
                            <td>{p.nick}</td>
                            <td className="col-pow">
                              {p.power.toLocaleString('ru-RU')}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          )}

          {section === 'battle' && <SimResults result={result} />}
        </div>
      </main>
    </div>
  )
}
