import type {
  BattleSettings,
  LaneAssignment,
  LaneId,
  Player,
  StrategyId,
} from '../types'
import { FACING_LANE, LANE_IDS } from '../types'
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

/** Линия врага, которая стоит напротив нашей */
function enemyFacingOur(ourLane: LaneId, enemy: LaneAssignment): Player[] {
  return enemy[FACING_LANE[ourLane]] ?? []
}

function takeRoundRobin(players: Player[], maxPerLane: number): LaneAssignment {
  const out = emptyLanes()
  const sorted = [...players].sort(byPowerDesc)
  let i = 0
  for (const p of sorted) {
    let best: LaneId | null = null
    let bestSum = Infinity
    for (let k = 0; k < LANE_IDS.length; k++) {
      const lane = LANE_IDS[(i + k) % LANE_IDS.length]!
      if (out[lane].length >= maxPerLane) continue
      const sum = lanePower(out[lane])
      if (sum < bestSum) {
        bestSum = sum
        best = lane
      }
    }
    if (!best) {
      best = LANE_IDS.reduce((a, b) =>
        lanePower(out[a]) <= lanePower(out[b]) ? a : b,
      )
    }
    out[best].push(p)
    i += 1
  }
  return sortLanes(out)
}

function strategyBalance(players: Player[], settings: BattleSettings): LaneAssignment {
  return takeRoundRobin(players, settings.maxPerLane)
}

/** Жертва — наша линия напротив самой сильной линии врага */
function strategyTwoStrong(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  const enemySums = LANE_IDS.map((enemyLane) => ({
    enemyLane,
    // наша линия, которая с ней дерётся
    ourLane: LANE_IDS.find((l) => FACING_LANE[l] === enemyLane) ?? 'center',
    s: lanePower(enemy[enemyLane]),
  }))
  enemySums.sort((a, b) => b.s - a.s)
  const sacrifice: LaneId =
    enemySums[0]!.s > 0 ? enemySums[0]!.ourLane : 'right'
  const strong = LANE_IDS.filter((l) => l !== sacrifice)

  const sorted = [...players].sort(byPowerAsc)
  const sacrificeCount = Math.max(
    1,
    Math.min(settings.maxPerLane, Math.floor(players.length / 5) || 1),
  )
  const out = emptyLanes()
  const weakPool = sorted.slice(0, sacrificeCount)
  const strongPool = sorted.slice(sacrificeCount).reverse()

  for (const p of weakPool) {
    if (out[sacrifice].length < settings.maxPerLane) out[sacrifice].push(p)
    else strongPool.push(p)
  }

  let i = 0
  for (const p of strongPool) {
    const lane = strong[i % strong.length]!
    if (out[lane].length < settings.maxPerLane) out[lane].push(p)
    else {
      const other =
        strong.find((l) => out[l].length < settings.maxPerLane) ?? sacrifice
      out[other].push(p)
    }
    i += 1
  }
  return sortLanes(out)
}

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

  for (const ourLane of LANE_IDS) {
    const enemySorted = [...enemyFacingOur(ourLane, enemy)].sort(byPowerAsc)
    for (const foe of enemySorted) {
      if (out[ourLane].length >= settings.maxPerLane) break
      let pick: Player | null = null
      for (const p of pool) {
        if (used.has(p.id)) continue
        if (p.power > foe.power) {
          pick = p
          break
        }
      }
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
        out[ourLane].push(pick)
      }
    }
  }

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

function strategyMaximizeFlags(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  let best = strategyBalance(players, settings)
  let bestScore = scoreAssignment(best, enemy, settings)

  const seeds = [
    strategyTwoStrong(players, enemy, settings),
    strategyCounterRelay(players, enemy, settings),
  ]
  for (const seed of seeds) {
    const s = scoreAssignment(seed, enemy, settings)
    if (s > bestScore) {
      best = seed
      bestScore = s
    }
  }

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
    case 'twoStrong':
      return strategyTwoStrong(players, enemy, settings)
    case 'counterRelay':
      return strategyCounterRelay(players, enemy, settings)
    case 'maximizeFlags':
      return strategyMaximizeFlags(players, enemy, settings)
    default:
      return strategyBalance(players, settings)
  }
}
