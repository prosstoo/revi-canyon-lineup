/**
 * Temporary search: can REVI beat BDSM 3:0?
 * Run: npx tsx scripts/search30.ts
 */
import type { LaneAssignment, LaneId, Player } from '../src/types'
import { DEFAULT_SETTINGS, FACING_LANE, LANE_IDS, type StrategyId } from '../src/types'
import { applyStrategy } from '../src/lib/strategies'
import {
  makeBdsmEnemy,
  makeReviCurrentAssignment,
  makeReviRoster,
} from '../src/lib/sampleData'
import { lanePower, simulateMatch, sortForDisplay } from '../src/lib/simulate'

const STRATEGIES: StrategyId[] = [
  'balance',
  'twoStrong',
  'counterRelay',
  'maximizeFlags',
]

function scoreKey(ourFlags: number, theirFlags: number): number {
  return ourFlags * 1000 - theirFlags * 100
}

function fmtAssignment(ours: LaneAssignment): string {
  const lines: string[] = []
  for (const lane of LANE_IDS) {
    const top = sortForDisplay(ours[lane]).slice(0, 5)
    const sum = lanePower(ours[lane])
    const names = top.map((p) => `${p.nick}(${p.power})`).join(', ')
    lines.push(
      `  ${lane} n=${ours[lane].length} sum=${sum}: ${names}${ours[lane].length > 5 ? ' ...' : ''}`,
    )
  }
  return lines.join('\n')
}

type EvalR = {
  label: string
  ourFlags: number
  theirFlags: number
  outcome: string
  ours: LaneAssignment
}

function evalAssign(label: string, ours: LaneAssignment, enemy: LaneAssignment): EvalR {
  const sim = simulateMatch(ours, enemy, DEFAULT_SETTINGS)
  return {
    label,
    ourFlags: sim.ourFlags,
    theirFlags: sim.theirFlags,
    outcome: sim.outcome,
    ours,
  }
}

function randomPartition(players: Player[], seed: number): LaneAssignment {
  let s = seed >>> 0
  const rand = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0x100000000
  }
  const shuffled = [...players]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return {
    left: shuffled.slice(0, 15),
    center: shuffled.slice(15, 30),
    right: shuffled.slice(30, 45),
  }
}

/** Strongest N on our right (faces BDSM left), next on center, rest on left */
function stackRightSplit(players: Player[], nRight: number, nCenter: number): LaneAssignment {
  const sorted = [...players].sort((a, b) => b.power - a.power)
  return {
    right: sorted.slice(0, nRight),
    center: sorted.slice(nRight, nRight + nCenter),
    left: sorted.slice(nRight + nCenter),
  }
}

/** Greedy: stack vs weak enemy right (our left faces their right) */
function greedyStackVsWeakRight(players: Player[], enemy: LaneAssignment): LaneAssignment {
  const sorted = [...players].sort((a, b) => b.power - a.power)
  const variants: LaneAssignment[] = []
  for (const nLeft of [10, 12, 13, 14, 15]) {
    for (const nCenter of [10, 12, 13, 14, 15]) {
      const nRight = 45 - nLeft - nCenter
      if (nRight < 1 || nRight > 15) continue
      variants.push({
        left: sorted.slice(0, nLeft),
        center: sorted.slice(nLeft, nLeft + nCenter),
        right: sorted.slice(nLeft + nCenter, nLeft + nCenter + nRight),
      })
    }
  }
  variants.push({
    left: sorted.slice(0, 15),
    center: sorted.slice(15, 30),
    right: sorted.slice(30, 45),
  })
  variants.push({
    center: sorted.slice(0, 15),
    left: sorted.slice(15, 30),
    right: sorted.slice(30, 45),
  })
  let best = variants[0]!
  let bestSc = -Infinity
  for (const v of variants) {
    const sim = simulateMatch(v, enemy, DEFAULT_SETTINGS)
    const sc = scoreKey(sim.ourFlags, sim.theirFlags)
    if (sc > bestSc) {
      bestSc = sc
      best = v
    }
  }
  return best
}

/** Put strongest on lane that faces weakest enemy lane */
function greedyVsWeakestEnemy(players: Player[], enemy: LaneAssignment): LaneAssignment[] {
  const pairs = LANE_IDS.map((ourLane) => ({
    ourLane,
    enemyLane: FACING_LANE[ourLane],
    s: lanePower(enemy[FACING_LANE[ourLane]]),
  })).sort((a, b) => a.s - b.s)

  const sorted = [...players].sort((a, b) => b.power - a.power)
  const out: LaneAssignment[] = []

  for (const n0 of [15, 14, 13, 12, 10]) {
    for (const n1 of [15, 14, 13, 12, 10]) {
      const n2 = 45 - n0 - n1
      if (n2 < 1 || n2 > 15) continue
      const counts = [n0, n1, n2]
      const assign: LaneAssignment = { left: [], center: [], right: [] }
      let idx = 0
      for (let i = 0; i < 3; i++) {
        const lane = pairs[i]!.ourLane
        assign[lane] = sorted.slice(idx, idx + counts[i]!)
        idx += counts[i]!
      }
      out.push(assign)
    }
  }
  return out
}

function main() {
  const enemy = makeBdsmEnemy()
  const roster = makeReviRoster()
  const current = makeReviCurrentAssignment()

  console.log('=== Enemy BDSM lane powers ===')
  for (const l of LANE_IDS) {
    console.log(`  their ${l}: n=${enemy[l].length} sum=${lanePower(enemy[l])}`)
  }
  console.log('Facing: our left↔their right, center↔center, our right↔their left')
  console.log(`Roster size: ${roster.length}`)

  console.log('\n=== Current assignment ===')
  {
    const r = evalAssign('current', current, enemy)
    console.log(`${r.label}: ${r.ourFlags}:${r.theirFlags} ${r.outcome}`)
  }

  console.log('\n=== applyStrategy for each StrategyId ===')
  const results: EvalR[] = []
  for (const sid of STRATEGIES) {
    const assign = applyStrategy(sid, roster, enemy, DEFAULT_SETTINGS)
    const r = evalAssign(sid, assign, enemy)
    results.push(r)
    console.log(`${sid}: ${r.ourFlags}:${r.theirFlags} ${r.outcome}`)
  }

  console.log('\n=== Improved search for 3:0 ===')

  let best = results.reduce((a, b) =>
    scoreKey(a.ourFlags, a.theirFlags) >= scoreKey(b.ourFlags, b.theirFlags) ? a : b,
  )
  let found30: EvalR | null =
    best.ourFlags === 3 && best.theirFlags === 0 ? best : null

  const consider = (r: EvalR) => {
    results.push(r)
    if (scoreKey(r.ourFlags, r.theirFlags) > scoreKey(best.ourFlags, best.theirFlags)) {
      best = r
    }
    if (r.ourFlags === 3 && r.theirFlags === 0 && !found30) {
      found30 = r
      console.log(`FOUND 3:0 via ${r.label}`)
    }
  }

  const TRIES = 8000
  let randBestFlags = { ourFlags: 0, theirFlags: 3, t: -1 }
  let rb: LaneAssignment | null = null
  let rbSc = -Infinity
  let rbLabel = ''
  for (let t = 0; t < TRIES; t++) {
    const assign = randomPartition(roster, 12345 + t * 997)
    const sim = simulateMatch(assign, enemy, DEFAULT_SETTINGS)
    const sc = scoreKey(sim.ourFlags, sim.theirFlags)
    if (
      scoreKey(sim.ourFlags, sim.theirFlags) >
      scoreKey(randBestFlags.ourFlags, randBestFlags.theirFlags)
    ) {
      randBestFlags = { ourFlags: sim.ourFlags, theirFlags: sim.theirFlags, t }
    }
    if (sc > rbSc) {
      rbSc = sc
      rb = assign
      rbLabel = `randomBest#${t}`
    }
    if (sim.ourFlags === 3 && sim.theirFlags === 0) {
      consider(evalAssign(`random#${t}`, assign, enemy))
    }
  }
  console.log(
    `Random ${TRIES} tries best: ${randBestFlags.ourFlags}:${randBestFlags.theirFlags} (t=${randBestFlags.t})`,
  )
  if (rb) consider(evalAssign(rbLabel, rb, enemy))

  console.log('Trying right-stack N splits...')
  for (const nRight of [15, 14, 13, 12, 10, 8]) {
    for (const nCenter of [15, 14, 13, 12, 10, 8]) {
      const nLeft = 45 - nRight - nCenter
      if (nLeft < 1 || nLeft > 15) continue
      const assign = stackRightSplit(roster, nRight, nCenter)
      consider(evalAssign(`stackRight r=${nRight} c=${nCenter} l=${nLeft}`, assign, enemy))
    }
  }

  console.log('Trying greedy vs weak enemy right...')
  consider(evalAssign('greedyVsWeakRight', greedyStackVsWeakRight(roster, enemy), enemy))

  {
    const sorted = [...roster].sort((a, b) => b.power - a.power)
    consider(
      evalAssign(
        'pureStrongLeft',
        { left: sorted.slice(0, 15), center: sorted.slice(15, 30), right: sorted.slice(30, 45) },
        enemy,
      ),
    )
    consider(
      evalAssign(
        'pureStrongRight',
        { right: sorted.slice(0, 15), center: sorted.slice(15, 30), left: sorted.slice(30, 45) },
        enemy,
      ),
    )
    consider(
      evalAssign(
        'pureStrongCenter',
        { center: sorted.slice(0, 15), left: sorted.slice(15, 30), right: sorted.slice(30, 45) },
        enemy,
      ),
    )
  }

  console.log('Trying greedy vs weakest enemy...')
  for (const assign of greedyVsWeakestEnemy(roster, enemy)) {
    const n = LANE_IDS.map((l) => `${l}:${assign[l].length}`).join(',')
    consider(evalAssign(`greedyWeakEnemy ${n}`, assign, enemy))
  }

  console.log('Hill-climb swaps from best...')
  {
    let cur: LaneAssignment = {
      left: [...best.ours.left],
      center: [...best.ours.center],
      right: [...best.ours.right],
    }
    let curSc = scoreKey(best.ourFlags, best.theirFlags)
    for (let iter = 0; iter < 200; iter++) {
      let improved = false
      for (let a = 0; a < 3; a++) {
        for (let b = a + 1; b < 3; b++) {
          const la = LANE_IDS[a]!
          const lb = LANE_IDS[b]!
          for (let i = 0; i < cur[la].length; i++) {
            for (let j = 0; j < cur[lb].length; j++) {
              const next: LaneAssignment = {
                left: [...cur.left],
                center: [...cur.center],
                right: [...cur.right],
              }
              const tmp = next[la][i]!
              next[la][i] = next[lb][j]!
              next[lb][j] = tmp
              const sim = simulateMatch(next, enemy, DEFAULT_SETTINGS)
              const sc = scoreKey(sim.ourFlags, sim.theirFlags)
              if (sc > curSc) {
                cur = next
                curSc = sc
                improved = true
                consider(evalAssign(`hillclimb#${iter}`, next, enemy))
              }
            }
          }
        }
      }
      if (!improved) break
    }
  }

  console.log('\n========== SUMMARY ==========')
  console.log(`Best found: ${best.ourFlags}:${best.theirFlags} (${best.outcome}) via ${best.label}`)
  console.log(`3:0 exists: ${found30 ? 'YES' : 'NO'}`)
  if (found30) {
    console.log('3:0 assignment lane totals:')
    console.log(fmtAssignment(found30.ours))
  } else {
    console.log('Best assignment lane totals:')
    console.log(fmtAssignment(best.ours))
  }

  const byScore = new Map<string, number>()
  for (const r of results) {
    const k = `${r.ourFlags}:${r.theirFlags}`
    byScore.set(k, (byScore.get(k) ?? 0) + 1)
  }
  console.log('\nScore frequency among evaluated:')
  for (const [k, v] of [...byScore.entries()].sort()) {
    console.log(`  ${k} x${v}`)
  }
}

main()
