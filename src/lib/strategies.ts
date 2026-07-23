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

function cloneLanes(a: LaneAssignment): LaneAssignment {
  return {
    left: [...a.left],
    center: [...a.center],
    right: [...a.right],
  }
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


/**
 * Жадно закрывает цели по мощи: сначала самую опасную линию врага,
 * потом остальные (с небольшим запасом).
 */
function strategyCoverTargets(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
  priority: 'dangerFirst' | 'weakFirst',
): LaneAssignment {
  const max = settings.maxPerLane
  const sorted = [...players].sort(byPowerDesc)
  const targets = LANE_IDS.map((ourLane) => ({
    ourLane,
    need: lanePower(enemyFacingOur(ourLane, enemy)),
  }))
  targets.sort((a, b) =>
    priority === 'dangerFirst' ? b.need - a.need : a.need - b.need,
  )

  const out = emptyLanes()
  let idx = 0

  for (const t of targets) {
    const surplus = Math.max(500_000, Math.floor(t.need * 0.01))
    const goal = t.need + surplus
    while (
      idx < sorted.length &&
      out[t.ourLane].length < max &&
      (lanePower(out[t.ourLane]) < goal || out[t.ourLane].length < 8)
    ) {
      out[t.ourLane].push(sorted[idx]!)
      idx += 1
    }
  }

  while (idx < sorted.length) {
    let best: LaneId | null = null
    let bestGap = -Infinity
    for (const lane of LANE_IDS) {
      if (out[lane].length >= max) continue
      const need = lanePower(enemyFacingOur(lane, enemy))
      const gap = need - lanePower(out[lane])
      if (gap > bestGap) {
        bestGap = gap
        best = lane
      }
    }
    if (!best) {
      best = LANE_IDS.reduce((a, b) =>
        out[a].length <= out[b].length ? a : b,
      )
    }
    out[best].push(sorted[idx]!)
    idx += 1
  }

  return sortLanes(out)
}

/** Разрез по силе: N самых сильных на указанную линию, далее по приоритету */
function stackSplit(
  players: Player[],
  order: LaneId[],
  counts: [number, number, number],
  maxPerLane: number,
): LaneAssignment {
  const sorted = [...players].sort(byPowerDesc)
  const out = emptyLanes()
  let idx = 0
  for (let i = 0; i < 3; i++) {
    const lane = order[i]!
    const n = Math.min(counts[i]!, maxPerLane, sorted.length - idx)
    out[lane] = sorted.slice(idx, idx + n)
    idx += n
  }
  while (idx < sorted.length) {
    const lane = order.reduce((a, b) =>
      out[a].length <= out[b].length ? a : b,
    )
    if (out[lane].length >= maxPerLane) break
    out[lane].push(sorted[idx]!)
    idx += 1
  }
  return sortLanes(out)
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function randomPartition(
  players: Player[],
  maxPerLane: number,
  rand: () => number,
): LaneAssignment {
  const shuffled = [...players]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  const out = emptyLanes()
  let i = 0
  for (const p of shuffled) {
    // round-robin with capacity
    let placed = false
    for (let k = 0; k < 3; k++) {
      const lane = LANE_IDS[(i + k) % 3]!
      if (out[lane].length < maxPerLane) {
        out[lane].push(p)
        placed = true
        break
      }
    }
    if (!placed) {
      const lane = LANE_IDS.reduce((a, b) =>
        out[a].length <= out[b].length ? a : b,
      )
      out[lane].push(p)
    }
    i += 1
  }
  return sortLanes(out)
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
  // 3:0 важнее всего; штраф за флаги врага сильнее
  return (
    sim.ourFlags * 10_000 -
    sim.theirFlags * 4_000 +
    margin +
    (sim.ourFlags === 3 && sim.theirFlags === 0 ? 50_000 : 0)
  )
}

function consider(
  candidate: LaneAssignment,
  enemy: LaneAssignment,
  settings: BattleSettings,
  best: { assign: LaneAssignment; score: number },
): boolean {
  const sorted = sortLanes(candidate)
  const sc = scoreAssignment(sorted, enemy, settings)
  if (sc > best.score) {
    best.assign = sorted
    best.score = sc
    return true
  }
  return false
}

function isPerfect(score: number): boolean {
  // ourFlags=3, their=0 → минимум 30000+50000
  return score >= 80_000
}

function hillClimbSwaps(
  start: LaneAssignment,
  enemy: LaneAssignment,
  settings: BattleSettings,
  best: { assign: LaneAssignment; score: number },
  maxIter = 80,
): void {
  let cur = cloneLanes(start)
  let curScore = scoreAssignment(cur, enemy, settings)
  if (curScore > best.score) {
    best.assign = sortLanes(cur)
    best.score = curScore
  }

  for (let iter = 0; iter < maxIter; iter++) {
    if (isPerfect(best.score)) return
    let improved = false
    for (let a = 0; a < LANE_IDS.length; a++) {
      for (let b = a + 1; b < LANE_IDS.length; b++) {
        const la = LANE_IDS[a]!
        const lb = LANE_IDS[b]!
        for (let i = 0; i < cur[la].length; i++) {
          for (let j = 0; j < cur[lb].length; j++) {
            const next = cloneLanes(cur)
            const tmp = next[la][i]!
            next[la][i] = next[lb][j]!
            next[lb][j] = tmp
            const sorted = sortLanes(next)
            const sc = scoreAssignment(sorted, enemy, settings)
            if (sc > curScore) {
              cur = sorted
              curScore = sc
              improved = true
              if (sc > best.score) {
                best.assign = sorted
                best.score = sc
              }
              if (isPerfect(best.score)) return
            }
          }
        }
      }
    }
    // одиночные переносы (если есть место)
    for (const from of LANE_IDS) {
      for (const to of LANE_IDS) {
        if (from === to) continue
        if (cur[to].length >= settings.maxPerLane) continue
        for (let i = 0; i < cur[from].length; i++) {
          const next = cloneLanes(cur)
          const [moved] = next[from].splice(i, 1)
          if (!moved) continue
          next[to].push(moved)
          const sorted = sortLanes(next)
          const sc = scoreAssignment(sorted, enemy, settings)
          if (sc > curScore) {
            cur = sorted
            curScore = sc
            improved = true
            if (sc > best.score) {
              best.assign = sorted
              best.score = sc
            }
            if (isPerfect(best.score)) return
          }
        }
      }
    }
    if (!improved) break
  }
}

function strategyMaximizeFlags(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  const max = settings.maxPerLane
  const best = {
    assign: strategyBalance(players, settings),
    score: -Infinity,
  }
  best.score = scoreAssignment(best.assign, enemy, settings)

  const seeds: LaneAssignment[] = [
    strategyBalance(players, settings),
    strategyTwoStrong(players, enemy, settings),
    strategyCoverTargets(players, enemy, settings, 'dangerFirst'),
    strategyCoverTargets(players, enemy, settings, 'weakFirst'),
  ]

  // стек сильнейших против самой жирной линии врага (наше право ↔ их лево)
  for (const nRight of [15, 14, 13, 12, 11, 10]) {
    for (const nCenter of [15, 14, 13, 12, 11, 10]) {
      const nLeft = players.length - nRight - nCenter
      if (nLeft < 1 || nLeft > max) continue
      seeds.push(
        stackSplit(players, ['right', 'center', 'left'], [nRight, nCenter, nLeft], max),
      )
      seeds.push(
        stackSplit(players, ['right', 'left', 'center'], [nRight, nLeft, nCenter], max),
      )
      seeds.push(
        stackSplit(players, ['left', 'center', 'right'], [nLeft, nCenter, nRight], max),
      )
    }
  }

  for (const seed of seeds) {
    consider(seed, enemy, settings, best)
    if (isPerfect(best.score)) return best.assign
  }

  // hill-climb с лучших сидов
  const topSeeds = [...seeds]
    .map((s) => ({ s, sc: scoreAssignment(s, enemy, settings) }))
    .sort((a, b) => b.sc - a.sc)
    .slice(0, 8)
  for (const { s } of topSeeds) {
    hillClimbSwaps(s, enemy, settings, best, 60)
    if (isPerfect(best.score)) return best.assign
  }

  // случайные перезапуски — на демо 3:0 редкий, но находится
  const randomTries = Math.min(6_000, Math.max(1_500, players.length * 80))
  const rand = mulberry32(0xc4a701 ^ (players.length * 9973))
  for (let t = 0; t < randomTries; t++) {
    const part = randomPartition(players, max, rand)
    if (consider(part, enemy, settings, best)) {
      hillClimbSwaps(part, enemy, settings, best, 25)
    }
    if (isPerfect(best.score)) return best.assign
  }

  hillClimbSwaps(best.assign, enemy, settings, best, 100)
  return best.assign
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
    case 'maximizeFlags':
      return strategyMaximizeFlags(players, enemy, settings)
    default:
      return strategyBalance(players, settings)
  }
}
