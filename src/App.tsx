import { useEffect, useMemo, useState } from 'react'
import { AlliancePanel } from './components/AlliancePanel'
import { EnemyLineupView, LineupResult } from './components/LineupResult'
import { SimResults } from './components/SimResults'
import { StrategyPanel } from './components/StrategyPanel'
import { assignmentToCsv } from './lib/parseRoster'
import {
  DEMO_NOTE,
  makeBdsmEnemy,
  makeReviCurrentAssignment,
} from './lib/sampleData'
import {
  emptyLanes,
  fightingLanes,
  flatPlayers,
  lanePower,
  simulateMatch,
} from './lib/simulate'
import { applyStrategy } from './lib/strategies'
import type {
  BattleSettings,
  LaneAssignment,
  LaneId,
  MatchSimResult,
  StrategyId,
} from './types'
import { DEFAULT_SETTINGS, LANE_IDS, LANE_LABELS } from './types'
import './App.css'

const THEME_KEY = 'canyon-theme'

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
  const [revi, setRevi] = useState<LaneAssignment>(emptyLanes)
  const [enemy, setEnemy] = useState<LaneAssignment>(() => makeBdsmEnemy())
  const [assignment, setAssignment] = useState<LaneAssignment>(emptyLanes)
  const [strategy, setStrategy] = useState<StrategyId>('maximizeFlags')
  const [settings] = useState<BattleSettings>(DEFAULT_SETTINGS)
  const [resultBefore, setResultBefore] = useState<MatchSimResult | null>(null)
  const [result, setResult] = useState<MatchSimResult | null>(null)
  const [demoNote, setDemoNote] = useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const reviFight = useMemo(
    () => fightingLanes(revi, settings.maxPerLane),
    [revi, settings.maxPerLane],
  )

  function resim(nextAssign: LaneAssignment, nextEnemy: LaneAssignment, nextRevi: LaneAssignment) {
    const currentFight = fightingLanes(nextRevi, settings.maxPerLane)
    if (LANE_IDS.some((l) => nextAssign[l].length > 0)) {
      setResult(simulateMatch(nextAssign, nextEnemy, settings))
    }
    if (LANE_IDS.some((l) => currentFight[l].length > 0)) {
      setResultBefore(simulateMatch(currentFight, nextEnemy, settings))
    }
  }

  function handleReviChange(next: LaneAssignment) {
    setRevi(next)
    setDemoNote(null)
    resim(assignment, enemy, next)
  }

  function handleEnemyChange(next: LaneAssignment) {
    setEnemy(next)
    resim(assignment, next, revi)
  }

  function handleApply() {
    const pool = flatPlayers(revi)
    if (pool.length === 0) return
    setDemoNote(null)
    const currentFight = fightingLanes(revi, settings.maxPerLane)
    setResultBefore(simulateMatch(currentFight, enemy, settings))
    const next = applyStrategy(strategy, pool, enemy, settings)
    setAssignment(next)
    setResult(simulateMatch(next, enemy, settings))
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
    setEnemy(bdsm)
    setRevi(reviNow)
    setDemoNote(DEMO_NOTE)
    setStrategy('maximizeFlags')
    const before = simulateMatch(reviNow, bdsm, settings)
    setResultBefore(before)
    const optimized = applyStrategy(
      'maximizeFlags',
      flatPlayers(reviNow),
      bdsm,
      settings,
    )
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
            <h1 className="title-cta">Завоевание каньона</h1>
            <div className="topbar-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              >
                {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              </button>
              <button type="button" className="btn btn-primary" onClick={loadDemo}>
                Демо REVI vs BDSM
              </button>
            </div>
          </div>

          <section className="panel rules-panel">
            <button
              type="button"
              className="collapsible-toggle"
              onClick={() => setRulesOpen((v) => !v)}
              aria-expanded={rulesOpen}
            >
              <span>Правила ивента</span>
              <span className="chevron">{rulesOpen ? '▾' : '▸'}</span>
            </button>
            {rulesOpen && (
              <div className="rules-body">
                <ul>
                  <li>3 линии: левая, центральная, правая. Победа — у кого больше захваченных флагов.</li>
                  <li>
                    Наша <strong>правая</strong> линия бьётся с их <strong>левой</strong>, наша левая —
                    с их правой, центр с центром.
                  </li>
                  <li>
                    На линии в бой идут не больше <strong>15</strong> самых сильных отрядов (можно
                    загрузить больше — лишние в запасе).
                  </li>
                  <li>
                    Бой — эстафета: порядок от слабых к сильным; победитель идёт дальше с остатком
                    мощи. Лимит боёв отряда — до 3.
                  </li>
                  <li>Лидер/офицеры могут перекидывать отряды между линиями до начала боя.</li>
                </ul>
              </div>
            )}
          </section>

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
                const ours = assignment[lane]?.length
                  ? assignment[lane]
                  : reviFight[lane]
                const theirs = fightingLanes(enemy, settings.maxPerLane)[lane]
                const ourP = lanePower(ours)
                const theirP = lanePower(theirs)
                const sim = result?.lanes[lane]
                const score =
                  sim != null
                    ? `${sim.winner === 'us' ? 'W' : sim.winner === 'them' ? 'L' : 'D'} · ${ours.length}:${theirs.length}`
                    : `${ours.length}:${theirs.length}`
                return (
                  <div key={lane} className={`lane-card ${idx === 2 ? 'is-hot' : ''}`}>
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

          <section className="panel">
            <button
              type="button"
              className="collapsible-toggle"
              onClick={() => setFormatOpen((v) => !v)}
              aria-expanded={formatOpen}
            >
              <span>Формат загрузки списков игроков</span>
              <span className="chevron">{formatOpen ? '▾' : '▸'}</span>
            </button>
            {formatOpen && (
              <div className="rules-body">
                <p>CSV / Excel с заголовками:</p>
                <pre className="code-block">{`nick,power,lane
PlayerOne,18500000,left
PlayerTwo,16200000,center
PlayerThree,15000000,right`}</pre>
                <ul>
                  <li>
                    <code>lane</code>: <code>left</code> / <code>center</code> / <code>right</code>{' '}
                    (или лево / центр / право)
                  </li>
                  <li>Без столбца lane все попадут на левую — потом перенесите вручную.</li>
                  <li>
                    Для REVI можно больше 15 на линию: в бою участвуют только 15 самых сильных.
                  </li>
                  <li>Мощь каждого игрока можно править прямо в таблице.</li>
                </ul>
              </div>
            )}
          </section>

          <div className="grid-2 equal-alliances">
            <AlliancePanel
              title="Альянс REVI"
              allianceTag="REVI"
              variant="ally"
              lanes={revi}
              onChange={handleReviChange}
              allowOverflow
              maxFight={settings.maxPerLane}
            />
            <AlliancePanel
              title="Альянс BDSM"
              allianceTag="BDSM"
              variant="enemy"
              lanes={enemy}
              onChange={handleEnemyChange}
              allowOverflow
              maxFight={settings.maxPerLane}
            />
          </div>

          <StrategyPanel
            strategy={strategy}
            onStrategy={setStrategy}
            onApply={handleApply}
            onExport={handleExport}
          />

          <div className="score-bar">
            <div>
              <span className="muted">Сейчас (топ-15 на линиях)</span>
              <strong>{outcomeLabel(resultBefore)}</strong>
            </div>
            <div>
              <span className="muted">После оптимизации</span>
              <strong className={result?.outcome === 'win' ? 'ok' : ''}>
                {outcomeLabel(result)}
              </strong>
            </div>
          </div>

          <EnemyLineupView enemy={fightingLanes(enemy, settings.maxPerLane)} />

          <LineupResult
            assignment={assignment}
            allianceTag="REVI рекомендуем"
            title="Рекомендуемая расстановка REVI"
            maxPerLane={settings.maxPerLane}
            onMove={handleMoveBetweenLanes}
            showFacingHint
            onEditPower={(id, power) => {
              const nextAssign = updatePowerInLanes(assignment, id, power)
              const nextRevi = updatePowerInLanes(revi, id, power)
              setAssignment(nextAssign)
              setRevi(nextRevi)
              resim(nextAssign, enemy, nextRevi)
            }}
          />

          <LineupResult
            assignment={revi}
            allianceTag="REVI загружено"
            title="Составы из загруженных списков REVI"
            maxPerLane={settings.maxPerLane}
            onEditPower={(id, power) => {
              const nextRevi = updatePowerInLanes(revi, id, power)
              setRevi(nextRevi)
              resim(assignment, enemy, nextRevi)
            }}
          />

          <SimResults result={result} title="Прогноз боёв (после оптимизации)" />
        </div>
      </main>
    </div>
  )
}
