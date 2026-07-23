import type { LaneAssignment, Player } from '../types'
import { createPlayer } from './parseRoster'
import { emptyLanes } from './simulate'

/** Пример состава BDSM (левая линия со скринов) — для демо */
export const SAMPLE_BDSM_LEFT: Player[] = [
  ['SenjorTomato', 21345706],
  ['BOMBARDIER', 20207802],
  ['Аллергова', 19669686],
  ['Layrouse', 19214805],
  ['★BipolarStar★', 18119101],
  ['Александ®', 16218911],
  ['BAGIGR', 15735894],
  ['Dze', 15638710],
  ['General-Alcohol', 15501675],
  ['MasoudEsm', 14974918],
  ['炊き込み御飯', 14789792],
  ['MixturA', 14627872],
  ['《Kochö》', 14157469],
  ['PolWilliam', 14087553],
  ['Tusker777', 14045796],
].map(([n, p]) => createPlayer(n as string, p as number))

/** Синтетический ростер REVI для демо (45 игроков) */
export function makeSampleReviRoster(): Player[] {
  const names = [
    'REVI_Alpha', 'REVI_Beta', 'REVI_Gamma', 'REVI_Delta', 'REVI_Echo',
    'REVI_Fox', 'REVI_Ghost', 'REVI_Hawk', 'REVI_Iris', 'REVI_Jade',
    'REVI_Knight', 'REVI_Lion', 'REVI_Mist', 'REVI_Nova', 'REVI_Orb',
    'REVI_Pike', 'REVI_Quark', 'REVI_Raven', 'REVI_Storm', 'REVI_Tide',
    'REVI_Ultra', 'REVI_Vega', 'REVI_Wolf', 'REVI_Xeno', 'REVI_Yarn',
    'REVI_Zephyr', 'REVI_Ash', 'REVI_Blade', 'REVI_Core', 'REVI_Drake',
    'REVI_Ember', 'REVI_Frost', 'REVI_Glen', 'REVI_Hex', 'REVI_Ivy',
    'REVI_Jet', 'REVI_Kane', 'REVI_Lux', 'REVI_Moss', 'REVI_Nyx',
    'REVI_Onyx', 'REVI_Prime', 'REVI_Quinn', 'REVI_Rune', 'REVI_Sage',
  ]
  // мощности вокруг типичного диапазона 12–22M
  return names.map((nick, i) => {
    const power = Math.round(22_000_000 - i * 220_000 - (i % 3) * 50_000)
    return createPlayer(nick, power)
  })
}

export function makeSampleEnemy(): LaneAssignment {
  const lanes = emptyLanes()
  lanes.left = SAMPLE_BDSM_LEFT.map((p) => createPlayer(p.nick, p.power))
  // Примерные центр/право — чуть слабее/сильнее для демо стратегий
  const centerBase = [
    ['BDSM_C1', 20500000],
    ['BDSM_C2', 19800000],
    ['BDSM_C3', 18500000],
    ['BDSM_C4', 17200000],
    ['BDSM_C5', 16000000],
    ['BDSM_C6', 15500000],
    ['BDSM_C7', 14800000],
    ['BDSM_C8', 14200000],
    ['BDSM_C9', 13800000],
    ['BDSM_C10', 13500000],
    ['BDSM_C11', 13200000],
    ['BDSM_C12', 12800000],
  ] as const
  const rightBase = [
    ['BDSM_R1', 21000000],
    ['BDSM_R2', 20100000],
    ['BDSM_R3', 19000000],
    ['BDSM_R4', 17800000],
    ['BDSM_R5', 16900000],
    ['BDSM_R6', 15800000],
    ['BDSM_R7', 15100000],
    ['BDSM_R8', 14500000],
    ['BDSM_R9', 14000000],
    ['BDSM_R10', 13600000],
    ['BDSM_R11', 13100000],
    ['BDSM_R12', 12500000],
    ['BDSM_R13', 12000000],
  ] as const
  lanes.center = centerBase.map(([n, p]) => createPlayer(n, p))
  lanes.right = rightBase.map(([n, p]) => createPlayer(n, p))
  return lanes
}
