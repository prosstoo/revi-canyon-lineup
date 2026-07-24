/**
 * Quick verify maximizeFlags finds 3:0 on demo.
 */
import { DEFAULT_SETTINGS } from '../src/types'
import { applyStrategy } from '../src/lib/strategies'
import { makeLmbEnemy, makeReviCurrentAssignment } from '../src/lib/sampleData'
import { flatPlayers, lanePower, simulateMatch } from '../src/lib/simulate'
import { LANE_IDS } from '../src/types'

const t0 = Date.now()
const enemy = makeLmbEnemy()
const revi = makeReviCurrentAssignment()
const pool = flatPlayers(revi)
const next = applyStrategy('maximizeFlags', pool, enemy, DEFAULT_SETTINGS)
const sim = simulateMatch(next, enemy, DEFAULT_SETTINGS)
const ms = Date.now() - t0
console.log(`score ${sim.ourFlags}:${sim.theirFlags} outcome=${sim.outcome} in ${ms}ms`)
for (const lane of LANE_IDS) {
  const lr = sim.lanes[lane]
  console.log(
    `  our ${lane} n=${next[lane].length} sum=${lanePower(next[lane])} vs their ${lane} winner=${lr.winner} survivors=${lr.ourSurvivors}/${lr.theirSurvivors}`,
  )
}
if (sim.ourFlags !== 3 || sim.theirFlags !== 0) {
  console.error('FAIL: expected 3:0')
  process.exit(2)
}
console.log('OK 3:0')
