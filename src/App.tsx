import { useEffect, useMemo, useState } from 'react'
import { EnemyLineupView, LineupResult } from './components/LineupResult'
import { OpponentSetup } from './components/OpponentSetup'
import { RosterUpload } from './components/RosterUpload'
import { SimResults } from './components/SimResults'
import { StrategyPanel } from './components/StrategyPanel'
import { assignmentToCsv } from './lib/parseRoster'
import {
  DEMO_NOTE,
  makeBdsmEnemy,
  makeReviCurrentAssignment,
  makeReviRoster,
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

function flatFromAssignment(a: LaneAssignment): Player[] {
  return LANE_IDS.flatMap((l) => a[l])
}

export default function App() {
  const [roster, setRoster] = useState<Player[]>([])
  const [enemy, setEnemy] = useState<LaneAssignment>(() => makeBdsmEnemy())
  const [currentAssignment, setCurrentAssignment] =
    useState<LaneAssignment>(emptyLanes)
  const [assignment, setAssignment] = useState<LaneAssignment>(emptyLanes)
  const [strategy, setStrategy] = useState<StrategyId>('maximizeFlags')
  const [settings, setSettings] = useState<BattleSettings>(DEFAULT_SETTINGS)
  const [resultBefore, setResultBefore] = useState<MatchSimResult | null>(null)
  const [result, setResult] = useState<MatchSimResult | null>(null)
  const [demoNote, setDemoNote] = useState<string | null>(null)
  const [section, setSection] = useState<'setup' | 'result' | 'battle'>('result')

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
    setCurrentAssignment(emptyLanes())
    setAssignment(emptyLanes())
    setResult(null)
    setResultBefore(null)
    setDemoNote(null)
  }

  function handleEnemyChange(next: LaneAssignment) {
    setEnemy(next)
    if (LANE_IDS.some((l) => assignment[l].length > 0)) {
      setResult(simulateMatch(assignment, next, settings))
    }
    if (LANE_IDS.some((l) => currentAssignment[l].length > 0)) {
      setResultBefore(simulateMatch(currentAssignment, next, settings))
    }
  }

  function optimize(players: Player[], vs: LaneAssignment, current: LaneAssignment) {
    const before =
      LANE_IDS.some((l) => current[l].length > 0)
        ? simulateMatch(current, vs, settings)
        : null
    setResultBefore(before)
    const next = applyStrategy(strategy, players, vs, settings)
    setAssignment(next)
    setResult(simulateMatch(next, vs, settings))
    setSection('result')
  }

  function handleApply() {
    if (roster.length === 0) return
    setDemoNote(null)
    optimize(roster, enemy, currentAssignment)
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
    const bdsm = makeBdsmEnemy()
    const reviNow = makeReviCurrentAssignment()
    const players = makeReviRoster()
    setEnemy(bdsm)
    setRoster(players)
    setCurrentAssignment(reviNow)
    setDemoNote(DEMO_NOTE)
    setStrategy('maximizeFlags')
    const before = simulateMatch(reviNow, bdsm, settings)
    setResultBefore(before)
    const optimized = applyStrategy('maximizeFlags', players, bdsm, settings)
    setAssignment(optimized)
    setResult(simulateMatch(optimized, bdsm, settings))
    setSection('result')
  }

  useEffect(() => {
    loadDemo()
    // только при монтировании
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const outcomeLabel = (r: MatchSimResult | null) => {
    if (!r) return '—'
    if (r.outcome === 'win') return `Победа REVI ${r.ourFlags}:${r.theirFlags}`
    if (r.outcome === 'lose') return `Поражение ${r.ourFlags}:${r.theirFlags}`
    return `Ничья ${r.ourFlags}:${r.theirFlags}`
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
            <span className="side-nav-subtitle">REVI vs BDSM</span>
          </div>
        </div>
        <nav className="side-nav-menu">
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
            Прогноз боёв
          </button>
          <button
            type="button"
            className={`side-nav-item ${section === 'setup' ? 'is-active' : ''}`}
            onClick={() => setSection('setup')}
          >
            Данные
          </button>
        </nav>
        <button type="button" className="btn btn-secondary side-nav-demo" onClick={loadDemo}>
          Демо REVI vs BDSM
        </button>
      </aside>

      <main className="app-main">
        <div className="app">
          <header className="page-header">
            <div>
              <p className="eyebrow">Цель: победить BDSM</p>
              <h1>Расстановка REVI</h1>
              <p className="lead">
                Берём текущий состав REVI и состав BDSM со скринов, считаем перестановку
                по трём линиям (ник + мощь), чтобы выиграть по флагам.
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={loadDemo}>
              Демо REVI vs BDSM
            </button>
          </header>

          {demoNote && <div className="toast-note">{demoNote}</div>}

          {section === 'result' && (
            <>
              <div className="score-bar">
                <div>
                  <span className="muted">Сейчас</span>
                  <strong>{outcomeLabel(resultBefore)}</strong>
                </div>
                <div>
                  <span className="muted">После оптимизации</span>
                  <strong className={result?.outcome === 'win' ? 'ok' : ''}>
                    {outcomeLabel(result)}
                  </strong>
                </div>
              </div>

              <EnemyLineupView enemy={enemy} />

              {LANE_IDS.some((l) => currentAssignment[l].length > 0) && (
                <LineupResult
                  assignment={currentAssignment}
                  allianceTag="REVI сейчас"
                  title="Текущая расстановка REVI (со скринов)"
                  maxPerLane={settings.maxPerLane}
                />
              )}

              <LineupResult
                assignment={assignment}
                allianceTag="REVI рекомендуем"
                title="Рекомендуемая расстановка REVI (чтобы обыграть BDSM)"
                maxPerLane={settings.maxPerLane}
                onMove={handleMoveBetweenLanes}
              />

              {unassigned.length > 0 && (
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
                            <td className="col-pow">{p.power.toLocaleString('ru-RU')}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </section>
              )}
            </>
          )}

          {section === 'setup' && (
            <>
              <div className="grid-2">
                <RosterUpload
                  title="Ростер REVI (ник + мощь)"
                  allianceTag="REVI"
                  players={roster}
                  onChange={handleRosterChange}
                />
                <OpponentSetup enemy={enemy} onChange={handleEnemyChange} />
              </div>
              <StrategyPanel
                strategy={strategy}
                onStrategy={setStrategy}
                settings={settings}
                onSettings={(s) => {
                  setSettings(s)
                  if (LANE_IDS.some((l) => assignment[l].length > 0)) {
                    setResult(simulateMatch(assignment, enemy, s))
                  }
                  if (LANE_IDS.some((l) => currentAssignment[l].length > 0)) {
                    setResultBefore(simulateMatch(currentAssignment, enemy, s))
                  }
                }}
                onApply={() => {
                  if (roster.length === 0 && flatFromAssignment(currentAssignment).length) {
                    optimize(
                      flatFromAssignment(currentAssignment),
                      enemy,
                      currentAssignment,
                    )
                    return
                  }
                  handleApply()
                }}
                onExport={handleExport}
              />
            </>
          )}

          {section === 'battle' && (
            <>
              {resultBefore && (
                <section className="panel">
                  <div className="panel-head">
                    <h2>Прогноз при текущей расстановке</h2>
                    <span className="badge">{outcomeLabel(resultBefore)}</span>
                  </div>
                </section>
              )}
              <SimResults result={result} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
