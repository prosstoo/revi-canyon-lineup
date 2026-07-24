import type {
  BattleSettings,
  HeroColor,
  LaneAssignment,
  LaneId,
  Player,
  StrategyId,
} from '../types'
import { FACING_LANE, LANE_IDS } from '../types'
import {
  counterColor,
  dominantColor,
  effectiveVsLane,
  laneEffectiveThreat,
  normalizeSquad,
} from './colors'
import { emptyLanes, lanePower, laneThreat, simulateMatch } from './simulate'

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

function enemyFacingOur(ourLane: LaneId, enemy: LaneAssignment): Player[] {
  return enemy[FACING_LANE[ourLane]] ?? []
}

function enemyLaneThreat(enemy: LaneAssignment, enemyLane: LaneId): number {
  return laneThreat(enemy[enemyLane] ?? [])
}

function playerFitsCounter(p: Player, want: HeroColor | null): number {
  if (!want) return 0
  const dom = dominantColor(normalizeSquad(p.squad))
  if (dom === want) return 2
  const squad = normalizeSquad(p.squad)
  const hits = squad.filter((c) => c === want).length
  return hits > 0 ? 1 : 0
}

/**
 * Всегда 2 сильные + 1 слабая.
 * Жертва — напротив самой опасной линии врага (мощь × моно).
 * На сильные линии优先руем игроков, чей цвет контрит доминирующий цвет врага напротив.
 */
function strategyTwoStrong(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
  forcedSacrifice?: LaneId,
): LaneAssignment {
  const max = settings.maxPerLane
  const enemyRanks = LANE_IDS.map((enemyLane) => ({
    enemyLane,
    ourLane: LANE_IDS.find((l) => FACING_LANE[l] === enemyLane) ?? 'center',
    threat: enemyLaneThreat(enemy, enemyLane),
  })).sort((a, b) => b.threat - a.threat)

  const sacrifice: LaneId =
    forcedSacrifice ??
    (enemyRanks[0]!.threat > 0 ? enemyRanks[0]!.ourLane : 'right')
  const strong = LANE_IDS.filter((l) => l !== sacrifice) as [LaneId, LaneId]

  const counters: Record<LaneId, HeroColor | null> = {
    left: counterColor(dominantColor(enemyFacingOur('left', enemy).flatMap((p) => p.squad))),
    center: counterColor(
      dominantColor(enemyFacingOur('center', enemy).flatMap((p) => p.squad)),
    ),
    right: counterColor(dominantColor(enemyFacingOur('right', enemy).flatMap((p) => p.squad))),
  }
  // dominant of flattened heroes on facing lane
  for (const our of LANE_IDS) {
    const foes = enemyFacingOur(our, enemy)
    const allColors = foes.flatMap((p) => normalizeSquad(p.squad))
    counters[our] = counterColor(dominantColor(allColors))
  }

  const sortedAsc = [...players].sort(byPowerAsc)
  const sacrificeCount = Math.max(
    1,
    Math.min(max, Math.floor(players.length / 5) || 1),
  )
  const out = emptyLanes()
  const weakPool = sortedAsc.slice(0, sacrificeCount)
  let strongPool = sortedAsc.slice(sacrificeCount).reverse()

  for (const p of weakPool) {
    if (out[sacrifice].length < max) out[sacrifice].push(p)
    else strongPool.push(p)
  }

  // Раздаём сильных: сначала кто лучше контрит линию с большим дефицитом
  strongPool = [...strongPool].sort((a, b) => {
    const score = (p: Player) => {
      let best = -Infinity
      for (const lane of strong) {
        if (out[lane].length >= max) continue
        const foes = enemyFacingOur(lane, enemy)
        const fit = playerFitsCounter(p, counters[lane])
        const eff = effectiveVsLane(p, foes)
        best = Math.max(best, eff + fit * 2_000_000)
      }
      return best
    }
    return score(b) - score(a)
  })

  for (const p of strongPool) {
    let bestLane: LaneId | null = null
    let bestScore = -Infinity
    for (const lane of strong) {
      if (out[lane].length >= max) continue
      const foes = enemyFacingOur(lane, enemy)
      const fit = playerFitsCounter(p, counters[lane])
      const eff = effectiveVsLane(p, foes)
      // предпочитаем недозаполненную / слабее набранную линию
      const fillPenalty = out[lane].length * 50_000
      const need = laneEffectiveThreat(foes) - laneThreat(out[lane])
      const sc = eff + fit * 3_000_000 + need * 0.15 - fillPenalty
      if (sc > bestScore) {
        bestScore = sc
        bestLane = lane
      }
    }
    if (!bestLane) {
      bestLane =
        strong.find((l) => out[l].length < max) ??
        (out[sacrifice].length < max ? sacrifice : strong[0]!)
    }
    out[bestLane].push(p)
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
  return (
    sim.ourFlags * 10_000 -
    sim.theirFlags * 4_000 +
    margin +
    (sim.ourFlags === 3 && sim.theirFlags === 0 ? 50_000 : 0)
  )
}

/**
 * Максимум флагов только среди вариантов «2 сильные + жертва»
 * (разные линии жертвы + лёгкий hill-climb свапами).
 */
function strategyMaximizeFlags(
  players: Player[],
  enemy: LaneAssignment,
  settings: BattleSettings,
): LaneAssignment {
  const best = {
    assign: strategyTwoStrong(players, enemy, settings),
    score: -Infinity,
  }
  best.score = scoreAssignment(best.assign, enemy, settings)

  for (const sac of LANE_IDS) {
    const cand = strategyTwoStrong(players, enemy, settings, sac)
    const sc = scoreAssignment(cand, enemy, settings)
    if (sc > best.score) {
      best.assign = cand
      best.score = sc
    }
  }

  // локальные свапы между сильными и жертвой
  let cur = cloneLanes(best.assign)
  let curScore = best.score
  for (let iter = 0; iter < 40; iter++) {
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
            // сохраняем паттерн 2+1: одна линия заметно слабее
            const threats = LANE_IDS.map((l) => laneThreat(sorted[l]))
            const sortedThreats = [...threats].sort((x, y) => x - y)
            if (sortedThreats[0]! * 1.35 > sortedThreats[1]!) continue
            const sc = scoreAssignment(sorted, enemy, settings)
            if (sc > curScore) {
              cur = sorted
              curScore = sc
              improved = true
              if (sc > best.score) {
                best.assign = sorted
                best.score = sc
              }
            }
          }
        }
      }
    }
    if (!improved) break
  }

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
      return strategyTwoStrong(players, enemy, settings)
  }
}
