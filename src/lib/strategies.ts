import type {
  BattleSettings,
  LaneAssignment,
  LaneId,
  Player,
  StrategyId,
} from '../types'
import { LANE_IDS } from '../types'
import { emptyLanes, lanePower, simulateMatch } from './simulate'

function byPowerDesc(a: Player, b: Player): number {
  return b.power - a.power
}

function byPowerAsc(a: Player, b: Player): number {
  return a.power - b.power
}

function sortLanes(assignment: LaneAssignment): LaneAssignment {
  const out = emptyLanes()
  for (const lane of LANE_IDS) {
    out[lane] = [...assignment[lane]].sort(byPowerAsc)
  }
  return out
}

function takeRoundRobin(
  players: Player[],
  maxPerLane: number,
  order: LaneId[] = [...LANE_IDS],
): LaneAssignment {
  const out = emptyLanes()
  const sorted = [...players].sort(byPowerDesc)
  let i = 0
  for (const p of sorted) {
    // find lane with room and currently lowest sum among preferred rotation
    let best: LaneId | null = null
    let bestSum = Infinity
    for (let k = 0; k < order.length; k++) {
      const lane = order[(i + k) % order.length]!
      if (out[lane].length >= maxPerLane) continue
      const sum = lanePower(out[lane])
      if (sum < bestSum) {
        bestSum = sum
        best = lane
      }
    }
    if (!best) {
      // overflow: put on least loaded even if over cap (UI will warn)
      best = LANE_IDS.reduce((a, b) =>
        lanePower(out[a]) <= lanePower(out[b]) ? a : b,
      )
    }
    out[best].push(p)
    i += 1
  }
  return sortLanes(out)
}

/** Баланс по сумме мощи */
function strategyBalance(players: Player[], settings: BattleSettings): LaneAssignment {
  return takeRoundRobin(players, settings.maxPerLane)
}

/** Зеркало: целевые суммы = суммы соперника (или равные, если враг пуст) */
function strategyMirror(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  const targets: Record<LaneId, number> = {
    left: lanePower(enemy.left) || 1,
    center: lanePower(enemy.center) || 1,
    right: lanePower(enemy.right) || 1,
  }
  const totalTarget = targets.left + targets.center + targets.right
  const totalOurs = players.reduce((s, p) => s + p.power, 0)
  const scaled: Record<LaneId, number> = {
    left: (targets.left / totalTarget) * totalOurs,
    center: (targets.center / totalTarget) * totalOurs,
    right: (targets.right / totalTarget) * totalOurs,
  }

  const out = emptyLanes()
  const sorted = [...players].sort(byPowerDesc)
  for (const p of sorted) {
    let best: LaneId = 'left'
    let bestScore = Infinity
    for (const lane of LANE_IDS) {
      if (out[lane].length >= settings.maxPerLane) continue
      const next = lanePower(out[lane]) + p.power
      const score = Math.abs(next - scaled[lane])
      // prefer under-filled relative to target
      const under = next <= scaled[lane] ? 0 : 1_000_000
      const total = under + score
      if (total < bestScore) {
        bestScore = total
        best = lane
      }
    }
    // if all full
    if (LANE_IDS.every((l) => out[l].length >= settings.maxPerLane)) {
      best = LANE_IDS.reduce((a, b) =>
        Math.abs(lanePower(out[a]) + p.power - scaled[a]) <=
        Math.abs(lanePower(out[b]) + p.power - scaled[b])
          ? a
          : b,
      )
    }
    out[best].push(p)
  }
  return sortLanes(out)
}

/** 2 сильные + жертва: жертва = самая сильная линия врага (или right) */
function strategyTwoStrong(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  const enemySums = LANE_IDS.map((l) => ({ l, s: lanePower(enemy[l]) }))
  enemySums.sort((a, b) => b.s - a.s)
  const sacrifice: LaneId =
    enemySums[0]!.s > 0 ? enemySums[0]!.l : 'right'
  const strong = LANE_IDS.filter((l) => l !== sacrifice)

  const sorted = [...players].sort(byPowerAsc)
  const sacrificeCount = Math.max(
    1,
    Math.min(
      settings.maxPerLane,
      Math.floor(players.length / 5) || 1,
    ),
  )
  const out = emptyLanes()
  const weakPool = sorted.slice(0, sacrificeCount)
  const strongPool = sorted.slice(sacrificeCount).reverse() // strongest first

  for (const p of weakPool) {
    if (out[sacrifice].length < settings.maxPerLane) out[sacrifice].push(p)
    else strongPool.push(p)
  }

  let i = 0
  for (const p of strongPool) {
    const lane = strong[i % strong.length]!
    if (out[lane].length < settings.maxPerLane) {
      out[lane].push(p)
    } else {
      const other = strong.find((l) => out[l].length < settings.maxPerLane) ?? sacrifice
      out[other].push(p)
    }
    i += 1
  }
  return sortLanes(out)
}

/** Давление на самую слабую линию врага */
function strategyPressureWeak(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  const enemySums = LANE_IDS.map((l) => ({ l, s: lanePower(enemy[l]) }))
  const hasEnemy = enemySums.some((x) => x.s > 0)
  enemySums.sort((a, b) => a.s - b.s)
  const focus: LaneId = hasEnemy ? enemySums[0]!.l : 'left'
  const others = LANE_IDS.filter((l) => l !== focus)

  const sorted = [...players].sort(byPowerDesc)
  const out = emptyLanes()
  const focusShare = Math.min(
    settings.maxPerLane,
    Math.ceil(players.length * 0.45),
  )

  for (const p of sorted) {
    if (out[focus].length < focusShare) {
      out[focus].push(p)
      continue
    }
    const lane = others.reduce((a, b) =>
      lanePower(out[a]) <= lanePower(out[b]) ? a : b,
    )
    if (out[lane].length < settings.maxPerLane) out[lane].push(p)
    else if (out[focus].length < settings.maxPerLane) out[focus].push(p)
    else out[lane].push(p)
  }
  return sortLanes(out)
}

/**
 * Контр-эстафета: для каждой линии врага подбираем «контр-стек»
 * игроков чуть сильнее соответствующих слотов, остальное — баланс.
 */
function strategyCounterRelay(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  const hasEnemy = LANE_IDS.some((l) => enemy[l].length > 0)
  if (!hasEnemy) return strategyBalance(players, settings)

  const pool = [...players].sort(byPowerAsc)
  const used = new Set<string>()
  const out = emptyLanes()

  for (const lane of LANE_IDS) {
    const enemySorted = [...enemy[lane]].sort(byPowerAsc)
    for (const foe of enemySorted) {
      if (out[lane].length >= settings.maxPerLane) break
      // smallest player who still beats foe
      let pick: Player | null = null
      for (const p of pool) {
        if (used.has(p.id)) continue
        if (p.power > foe.power) {
          pick = p
          break
        }
      }
      // else strongest remaining unused if none beats
      if (!pick) {
        for (let i = pool.length - 1; i >= 0; i--) {
          const p = pool[i]!
          if (!used.has(p.id)) {
            pick = p
            break
          }
        }
      }
      if (pick) {
        used.add(pick.id)
        out[lane].push(pick)
      }
    }
  }

  // leftover → fill underfilled lanes by balance
  const leftover = pool.filter((p) => !used.has(p.id)).sort(byPowerDesc)
  for (const p of leftover) {
    let best: LaneId = LANE_IDS[0]!
    let bestSum = Infinity
    for (const lane of LANE_IDS) {
      if (out[lane].length >= settings.maxPerLane) continue
      const s = lanePower(out[lane])
      if (s < bestSum) {
        bestSum = s
        best = lane
      }
    }
    out[best].push(p)
  }
  return sortLanes(out)
}

/** Жадный поиск: стартуем с баланса, пробуем свапы для улучшения флагов */
function strategyMaximizeFlags(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  let best = strategyBalance(players, settings)
  let bestScore = scoreAssignment(best, enemy, settings)

  // seed with other heuristics
  const seeds = [
    strategyMirror(players, enemy, settings),
    strategyTwoStrong(players, enemy, settings),
    strategyPressureWeak(players, enemy, settings),
    strategyCounterRelay(players, enemy, settings),
  ]
  for (const seed of seeds) {
    const s = scoreAssignment(seed, enemy, settings)
    if (s > bestScore) {
      best = seed
      bestScore = s
    }
  }

  // local search: swap across lanes
  const maxIter = 400
  for (let iter = 0; iter < maxIter; iter++) {
    let improved = false
    for (let a = 0; a < LANE_IDS.length; a++) {
      for (let b = a + 1; b < LANE_IDS.length; b++) {
        const la = LANE_IDS[a]!
        const lb = LANE_IDS[b]!
        for (let i = 0; i < best[la].length; i++) {
          for (let j = 0; j < best[lb].length; j++) {
            const next: LaneAssignment = {
              left: [...best.left],
              center: [...best.center],
              right: [...best.right],
            }
            const tmp = next[la][i]!
            next[la][i] = next[lb][j]!
            next[lb][j] = tmp
            const sorted = sortLanes(next)
            const sc = scoreAssignment(sorted, enemy, settings)
            if (sc > bestScore) {
              best = sorted
              bestScore = sc
              improved = true
            }
          }
        }
      }
    }
    if (!improved) break
  }
  return best
}

function scoreAssignment(
  ours: LaneAssignment,
  enemy: LaneAssignment,
  settings: BattleSettings,
): number {
  const sim = simulateMatch(ours, enemy, settings)
  // primary: flags, secondary: survivors margin
  let margin = 0
  for (const lane of LANE_IDS) {
    margin += sim.lanes[lane].ourSurvivors - sim.lanes[lane].theirSurvivors
  }
  return sim.ourFlags * 1000 - sim.theirFlags * 500 + margin
}

export function applyStrategy(
  strategy: StrategyId,
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  if (players.length === 0) return emptyLanes()
  switch (strategy) {
    case 'balance':
      return strategyBalance(players, settings)
    case 'mirror':
      return strategyMirror(players, enemy, settings)
    case 'twoStrong':
      return strategyTwoStrong(players, enemy, settings)
    case 'pressureWeak':
      return strategyPressureWeak(players, enemy, settings)
    case 'counterRelay':
      return strategyCounterRelay(players, enemy, settings)
    case 'maximizeFlags':
      return strategyMaximizeFlags(players, enemy, settings)
    default:
      return strategyBalance(players, settings)
  }
}
