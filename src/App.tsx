import { useEffect, useState } from 'react'
import { AlliancePanel } from './components/AlliancePanel'
import { JoustAnimation } from './components/JoustAnimation'
import { MatchupLineups } from './components/MatchupLineups'
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
import { DEFAULT_SETTINGS, LANE_IDS } from './types'
import './App.css'

const THEME_KEY = 'canyon-theme'

const NAV = [
  { id: 'rules', label: 'Правила' },
  { id: 'vs', label: 'Vs' },
  { id: 'format', label: 'Формат CSV' },
  { id: 'alliances', label: 'Составы' },
  { id: 'strategy', label: 'Стратегия' },
  { id: 'score', label: 'Прогноз' },
  { id: 'recommended', label: 'Рекомендация' },
  { id: 'uploaded', label: 'Загружено' },
  { id: 'battles', label: 'Бои' },
] as const

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

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function App() {
  const [ourName, setOurName] = useState('REVI')
  const [enemyName, setEnemyName] = useState('BDSM')
  const [revi, setRevi] = useState<LaneAssignment>(emptyLanes)
  const [enemy, setEnemy] = useState<LaneAssignment>(() => makeBdsmEnemy())
  const [assignment, setAssignment] = useState<LaneAssignment>(emptyLanes)
  const [strategy, setStrategy] = useState<StrategyId>('maximizeFlags')
  const [settings] = useState<BattleSettings>(DEFAULT_SETTINGS)
  const [resultBefore, setResultBefore] = useState<MatchSimResult | null>(null)
  const [result, setResult] = useState<MatchSimResult | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [demoNote, setDemoNote] = useState<string | null>(null)
  const [noPerfectNote, setNoPerfectNote] = useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  type NavId = (typeof NAV)[number]['id']
  const [activeNav, setActiveNav] = useState<NavId>(NAV[0].id)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
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

  useEffect(() => {
    function updateActiveNav() {
      const offset = 96
      let current: NavId = NAV[0].id
      for (const item of NAV) {
        const el = document.getElementById(item.id)
        if (!el) continue
        if (el.getBoundingClientRect().top - offset <= 0) current = item.id
      }
      setActiveNav(current)
    }
    updateActiveNav()
    window.addEventListener('scroll', updateActiveNav, { passive: true })
    window.addEventListener('resize', updateActiveNav)
    return () => {
      window.removeEventListener('scroll', updateActiveNav)
      window.removeEventListener('resize', updateActiveNav)
    }
  }, [hasCalculated])

  function resim(
    nextAssign: LaneAssignment,
    nextEnemy: LaneAssignment,
    nextRevi: LaneAssignment,
  ) {
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
    const before = simulateMatch(currentFight, enemy, settings)
    setResultBefore(before)
    const next = applyStrategy(strategy, pool, enemy, settings)
    const after = simulateMatch(next, enemy, settings)
    setAssignment(next)
    setResult(after)
    setHasCalculated(true)
    if (after.ourFlags === 3 && after.theirFlags === 0) {
      setNoPerfectNote(null)
    } else if (strategy === 'maximizeFlags') {
      setNoPerfectNote(
        `Вариант 3:0 для текущего состава не найден (лучший прогноз ${after.ourFlags}:${after.theirFlags}).`,
      )
    } else {
      setNoPerfectNote(null)
    }
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
    a.download = `${ourName}-lineup.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function loadDemo() {
    const bdsm = makeBdsmEnemy()
    const reviNow = makeReviCurrentAssignment()
    setOurName('REVI')
    setEnemyName('BDSM')
    setEnemy(bdsm)
    setRevi(reviNow)
    setAssignment(emptyLanes())
    setResult(null)
    setResultBefore(null)
    setHasCalculated(false)
    setNoPerfectNote(null)
    setDemoNote(DEMO_NOTE)
    setStrategy('maximizeFlags')
  }

  useEffect(() => {
    loadDemo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const outcomeLabel = (r: MatchSimResult | null) => {
    if (!r) return '—'
    if (r.outcome === 'win') return `Победа ${ourName} ${r.ourFlags}:${r.theirFlags}`
    if (r.outcome === 'lose') return `Поражение ${r.ourFlags}:${r.theirFlags}`
    return `Ничья ${r.ourFlags}:${r.theirFlags}`
  }

  return (
    <div className={`app-shell ${navOpen ? 'nav-open' : ''}`}>
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
            <span className="side-nav-subtitle">
              {ourName} vs {enemyName}
            </span>
          </div>
        </div>

        <nav className="side-nav-menu">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`side-nav-item${activeNav === item.id ? ' is-active' : ''}`}
              aria-current={activeNav === item.id ? 'true' : undefined}
              onClick={() => {
                scrollToId(item.id)
                setActiveNav(item.id)
                setNavOpen(false)
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="side-nav-theme-toggle"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        >
          <span className="theme-icon" aria-hidden>
            {theme === 'dark' ? '☀' : '☾'}
          </span>
          <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>

        <button type="button" className="btn btn-primary side-nav-demo" onClick={loadDemo}>
          Демо
        </button>
      </aside>

      <button
        type="button"
        className="nav-burger"
        aria-label="Меню"
        onClick={() => setNavOpen((v) => !v)}
      >
        ☰
      </button>
      {navOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setNavOpen(false)}
        />
      )}

      <main className="app-main">
        <div className="app">
          <div className="game-topbar">
            <h1 className="title-cta">Завоевание каньона</h1>
            <button type="button" className="btn btn-primary" onClick={loadDemo}>
              Демо {ourName} vs {enemyName}
            </button>
          </div>

          <section className="panel" id="rules">
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
                  <li>3 линии. Победа — у кого больше флагов.</li>
                  <li>
                    Наша правая бьётся с их левой, наша левая — с их правой, центр с центром.
                  </li>
                  <li>В бой на линии — до 15 самых сильных (можно загрузить больше).</li>
                  <li>Эстафета: слабые → сильные, победитель идёт с остатком мощи.</li>
                </ul>
              </div>
            )}
          </section>

          <section className="arena-banner" id="vs">
            <div className="arena-banner__art" aria-hidden />
            <div className="arena-banner__content">
              <div className="vs-row">
                <div className="vs-side vs-side--ally">
                  <div>
                    <span>наш альянс</span>
                    <strong>#{ourName}</strong>
                  </div>
                </div>
                <div className="vs-center">
                  <JoustAnimation size="md" />
                  <div className="vs-badge" aria-hidden>
                    Vs
                  </div>
                </div>
                <div className="vs-side vs-side--enemy">
                  <div>
                    <span>противник</span>
                    <strong>#{enemyName}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {demoNote && <div className="toast-note">{demoNote}</div>}

          <section className="panel" id="format">
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
                <pre className="code-block">{`nick,power,lane
PlayerOne,18500000,left
PlayerTwo,16200000,center
PlayerThree,15000000,right`}</pre>
                <ul>
                  <li>
                    <code>lane</code>: left / center / right (или лево / центр / право)
                  </li>
                  <li>Без lane — всё на левую, потом перенесите.</li>
                  <li>Больше 15 на линию можно: в бой идут топ-15.</li>
                </ul>
              </div>
            )}
          </section>

          <div className="grid-2 equal-alliances" id="alliances">
            <AlliancePanel
              name={ourName}
              onNameChange={setOurName}
              accent="ally"
              lanes={revi}
              onChange={handleReviChange}
              maxFight={settings.maxPerLane}
              allowLaneSwap
            />
            <AlliancePanel
              name={enemyName}
              onNameChange={setEnemyName}
              accent="enemy"
              lanes={enemy}
              onChange={handleEnemyChange}
              maxFight={settings.maxPerLane}
            />
          </div>

          <div id="strategy">
            <StrategyPanel
              strategy={strategy}
              onStrategy={setStrategy}
              onApply={handleApply}
              onExport={handleExport}
            />
          </div>

          {hasCalculated && (
            <>
              <div className="score-bar" id="score">
                <div>
                  <span className="muted">Сейчас (топ-15)</span>
                  <strong>{outcomeLabel(resultBefore)}</strong>
                </div>
                <div className="score-bar__after">
                  <JoustAnimation
                    size="sm"
                    impact={result?.outcome === 'win'}
                    className="score-bar__joust"
                  />
                  <div>
                    <span className="muted">После оптимизации</span>
                    <strong className={result?.outcome === 'win' ? 'ok' : ''}>
                      {outcomeLabel(result)}
                    </strong>
                  </div>
                </div>
              </div>
              {noPerfectNote && <div className="toast-note toast-note--warn">{noPerfectNote}</div>}
              <div id="recommended">
                <MatchupLineups
                  title={`Рекомендуемая расстановка · ${ourName} vs ${enemyName}`}
                  badge="Рекомендация"
                  ourName={ourName}
                  enemyName={enemyName}
                  ours={assignment}
                  enemy={enemy}
                  maxPerLane={settings.maxPerLane}
                  result={result}
                  editable
                  onMove={handleMoveBetweenLanes}
                  onEditPower={(id, power) => {
                    const nextAssign = updatePowerInLanes(assignment, id, power)
                    const nextRevi = updatePowerInLanes(revi, id, power)
                    setAssignment(nextAssign)
                    setRevi(nextRevi)
                    resim(nextAssign, enemy, nextRevi)
                  }}
                />
              </div>
              <div id="uploaded">
                <MatchupLineups
                  title={`Загруженная расстановка · ${ourName} vs ${enemyName}`}
                  badge="Загружено"
                  ourName={ourName}
                  enemyName={enemyName}
                  ours={revi}
                  enemy={enemy}
                  maxPerLane={settings.maxPerLane}
                  result={resultBefore}
                />
              </div>
              <div id="battles">
                <SimResults
                  result={result}
                  title="Прогноз боёв (после оптимизации)"
                  ourLabel={ourName}
                  theirLabel={enemyName}
                />
              </div>
            </>
          )}
          {!hasCalculated && (
            <section className="panel" id="score">
              <p className="muted">Нажмите «Рассчитать расстановку», чтобы увидеть составы линий (6 таблиц) и прогноз.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
