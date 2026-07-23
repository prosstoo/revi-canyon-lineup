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
import { emptyLanes, lanePower, simulateMatch } from './lib/simulate'
import { applyStrategy } from './lib/strategies'
import type {
  BattleSettings,
  LaneAssignment,
  LaneId,
  MatchSimResult,
  Player,
  StrategyId,
} from './types'
import { DEFAULT_SETTINGS, LANE_IDS, LANE_LABELS } from './types'
import './App.css'

function flatFromAssignment(a: LaneAssignment): Player[] {
  return LANE_IDS.flatMap((l) => a[l])
}

function formatMillions(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 100_000_000 ? 0 : 1)}M`
  return n.toLocaleString('ru-RU')
}

function updatePowerInLanes(
  lanes: LaneAssignment,
  playerId: string,
  power: number,
): LaneAssignment {
  const next = emptyLanes()
  for (const lane of LANE_IDS) {
    next[lane] = lanes[lane].map((p) =>
      p.id === playerId ? { ...p, power } : p,
    )
  }
  return next
}

export default function App() {
  const [roster, setRoster] = useState<Player[]>([])
  const [enemy, setEnemy] = useState<LaneAssignment>(() => makeBdsmEnemy())
  const [currentAssignment, setCurrentAssignment] =
    useState<LaneAssignment>(emptyLanes)
  const [assignment, setAssignment] = useState<LaneAssignment>(emptyLanes)
  const [strategy, setStrategy] = useState<StrategyId>('maximizeFlags')
  const [settings] = useState<BattleSettings>(DEFAULT_SETTINGS)
  const [resultBefore, setResultBefore] = useState<MatchSimResult | null>(null)
  const [result, setResult] = useState<MatchSimResult | null>(null)
  const [demoNote, setDemoNote] = useState<string | null>(null)

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

  function resim(nextAssignment: LaneAssignment, nextEnemy: LaneAssignment, nextCurrent: LaneAssignment) {
    if (LANE_IDS.some((l) => nextAssignment[l].length > 0)) {
      setResult(simulateMatch(nextAssignment, nextEnemy, settings))
    }
    if (LANE_IDS.some((l) => nextCurrent[l].length > 0)) {
      setResultBefore(simulateMatch(nextCurrent, nextEnemy, settings))
    }
  }

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
    resim(assignment, next, currentAssignment)
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
  }

  function handleApply() {
    const players =
      roster.length > 0 ? roster : flatFromAssignment(currentAssignment)
    if (players.length === 0) return
    setDemoNote(null)
    optimize(players, enemy, currentAssignment)
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
    next[to] = [...next[to], player]
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
  }

  useEffect(() => {
    loadDemo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const outcomeLabel = (r: MatchSimResult | null) => {
    if (!r) return '—'
    if (r.outcome === 'win') return `Победа REVI ${r.ourFlags}:${r.theirFlags}`
    if (r.outcome === 'lose') return `Поражение ${r.ourFlags}:${r.theirFlags}`
    return `Ничья ${r.ourFlags}:${r.theirFlags}`
  }

  return (
    <div className="app-shell app-shell--single">
      <main className="app-main">
        <div className="app">
          <div className="game-topbar">
            <h1>Завоевание каньона</h1>
            <button type="button" className="btn btn-primary" onClick={loadDemo}>
              Демо REVI vs BDSM
            </button>
          </div>

          <div className="game-phases">
            <span className="phase-pill">Регистрация</span>
            <span className="phase-pill">Группировка</span>
            <span className="phase-pill is-active">Фаза сражения</span>
            <span className="phase-pill">Награды</span>
          </div>

          <section className="arena-banner">
            <div className="vs-row">
              <div className="vs-side vs-side--ally">
                <div>
                  <span>наш альянс</span>
                  <strong>#REVI</strong>
                </div>
              </div>
              <div className="vs-badge" aria-hidden>
                Vs
              </div>
              <div className="vs-side vs-side--enemy">
                <div>
                  <span>противник</span>
                  <strong>#BDSM</strong>
                </div>
              </div>
            </div>

            <div className="lane-summary">
              {LANE_IDS.map((lane, idx) => {
                const ours = assignment[lane] ?? []
                const theirs = enemy[lane] ?? []
                const ourP = lanePower(ours)
                const theirP = lanePower(theirs)
                const sim = result?.lanes[lane]
                const score =
                  sim != null
                    ? `${sim.winner === 'us' ? 'W' : sim.winner === 'them' ? 'L' : 'D'} · ${ours.length}:${theirs.length}`
                    : `${ours.length}:${theirs.length}`
                return (
                  <div
                    key={lane}
                    className={`lane-card ${idx === 2 ? 'is-hot' : ''}`}
                  >
                    <h3>
                      <span className="dot" />
                      {LANE_LABELS[lane]}
                    </h3>
                    <div className="meta-line">
                      <span>Участники</span>
                      <b>{score}</b>
                    </div>
                    <div className="meta-line">
                      <span>Мощь</span>
                      <b>
                        {formatMillions(ourP)} / {formatMillions(theirP)}
                      </b>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {demoNote && <div className="toast-note">{demoNote}</div>}

          {/* 1. Два альянса одинаковой ширины */}
          <div className="grid-2 equal-alliances">
            <RosterUpload
              title="Альянс REVI"
              allianceTag="REVI"
              players={roster}
              onChange={handleRosterChange}
            />
            <OpponentSetup enemy={enemy} onChange={handleEnemyChange} />
          </div>

          {/* 2. Стратегия без настроек */}
          <StrategyPanel
            strategy={strategy}
            onStrategy={setStrategy}
            onApply={handleApply}
            onExport={handleExport}
          />

          {/* 3. Прогноз побед */}
          <div className="score-bar">
            <div>
              <span className="muted">Сейчас (текущая расстановка)</span>
              <strong>{outcomeLabel(resultBefore)}</strong>
            </div>
            <div>
              <span className="muted">После оптимизации</span>
              <strong className={result?.outcome === 'win' ? 'ok' : ''}>
                {outcomeLabel(result)}
              </strong>
            </div>
          </div>

          {/* 4. Составы соперника */}
          <EnemyLineupView
            enemy={enemy}
            onEditPower={(lane, id, power) => {
              const next = {
                ...enemy,
                [lane]: enemy[lane].map((p) =>
                  p.id === id ? { ...p, power } : p,
                ),
              }
              setEnemy(next)
              resim(assignment, next, currentAssignment)
            }}
          />

          {/* 5. Рекомендуемая расстановка */}
          <LineupResult
            assignment={assignment}
            allianceTag="REVI рекомендуем"
            title="Рекомендуемая расстановка REVI"
            maxPerLane={settings.maxPerLane}
            onMove={handleMoveBetweenLanes}
            showFacingHint
            onEditPower={(id, power) => {
              const nextAssign = updatePowerInLanes(assignment, id, power)
              const nextRoster = roster.map((p) =>
                p.id === id ? { ...p, power } : p,
              )
              const nextCurrent = updatePowerInLanes(currentAssignment, id, power)
              setAssignment(nextAssign)
              setRoster(nextRoster)
              setCurrentAssignment(nextCurrent)
              resim(nextAssign, enemy, nextCurrent)
            }}
          />

          {/* 6. Загруженные / текущие списки */}
          {LANE_IDS.some((l) => currentAssignment[l].length > 0) && (
            <LineupResult
              assignment={currentAssignment}
              allianceTag="REVI загружено"
              title="Составы из загруженных списков (текущая расстановка)"
              maxPerLane={settings.maxPerLane}
              onEditPower={(id, power) => {
                const nextCurrent = updatePowerInLanes(currentAssignment, id, power)
                const nextRoster = roster.map((p) =>
                  p.id === id ? { ...p, power } : p,
                )
                setCurrentAssignment(nextCurrent)
                setRoster(nextRoster)
                resim(assignment, enemy, nextCurrent)
              }}
            />
          )}

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
                        <td className="col-pow">
                          <input
                            className="power-input"
                            type="text"
                            inputMode="numeric"
                            defaultValue={String(p.power)}
                            key={`${p.id}-${p.power}`}
                            onBlur={(e) => {
                              const n = Number(
                                e.target.value.replace(/[\s\u00a0,]/g, ''),
                              )
                              if (Number.isFinite(n) && n > 0 && n !== p.power) {
                                setRoster(
                                  roster.map((x) =>
                                    x.id === p.id ? { ...x, power: Math.round(n) } : x,
                                  ),
                                )
                              } else {
                                e.target.value = String(p.power)
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          )}

          {/* 7. Прогноз боёв */}
          <SimResults result={result} title="Прогноз боёв (после оптимизации)" />
        </div>
      </main>
    </div>
  )
}
