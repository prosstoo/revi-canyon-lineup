import type { LaneAssignment, Player } from '../types'
import { createPlayer } from './parseRoster'
import { emptyLanes } from './simulate'

type NickPower = readonly [string, number]

function toPlayers(rows: NickPower[]): Player[] {
  return rows.map(([nick, power]) => createPlayer(nick, power))
}

/**
 * Состав BDSM по линиям — со скринов расстановки (photo_4–5, 9–10, 13–14).
 * Только реальные ники и мощь команды.
 */
export const BDSM_LINEUPS: LaneAssignment = {
  left: toPlayers([
    ['SenjorTomato', 21345706],
    ['BOMBARDIER', 20207802],
    ['Аллегрова', 19669686],
    ['Layrouse', 19214805],
    ['★BipolarStar★', 18119101],
    ['Алексей©', 16218911],
    ['BAGIIGR', 15735894],
    ['Dze', 15638710],
    ['General-Alcohol', 15501675],
    ['MasoudEsm', 14974918],
    ['炊き込み御飯', 14789792],
    ['MixturA', 14627872],
    ['《Kochö》', 14157469],
    ['PolWilliam', 14087553],
    ['Tusker777', 14045796],
  ]),
  center: toPlayers([
    ['PROvokaTOR', 21465198],
    ['◇ZloiPAPA◇', 21443909],
    ['devyy', 20278099],
    ['KKKe', 19482184],
    ['Hitter', 17472698],
    ['DocSirena', 17209711],
    ['Defa1000', 16588903],
    ['страх', 16240979],
    ['KomstoK', 15800632],
    ['VishenkA', 14401600],
    ['TaraKash', 14352983],
    ['Hkn', 14257829],
    ['Лемниската', 14197768],
    ['DziL', 13824562],
    ['friendWwW', 13635675],
  ]),
  right: toPlayers([
    ['IBlackFlint', 20753024],
    ['nevyy', 19752086],
    ['LAMPOCHKA', 19547186],
    ['Tim2', 19013083],
    ['cdpkaktus', 18800876],
    ['Maranill', 18724594],
    ['---КИС---', 17840010],
    ['Solevar', 17238314],
    ['ДядяВова', 16630372],
    ['VaRvArTTT', 16411480],
    ['Plytofka', 16148736],
    ['IDARQ', 14825494],
    ['Solnce', 14438575],
    ['AtAman', 14031840],
    ['madnesss', 13286055],
  ]),
}

/**
 * Состав LMB со скринов боевых отчётов того же матча (#87).
 * В демо подставляется как «наш» ростер, т.к. REVI на скринах нет —
 * замените своим CSV альянса REVI.
 */
export const LMB_DEMO_ROSTER: Player[] = toPlayers([
  // left
  ['Ash11134', 32422146],
  ['RichardBRaggin', 26222788],
  ['hsj', 20978002],
  ['jtsbrucey', 20253545],
  ['Netael', 19977846],
  ['Gladiatedragon', 19780495],
  ['stague', 18909359],
  ['MeLiH', 18762462],
  ['M-V-P-Jay', 18490093],
  ['Crazypills', 18111846],
  ['Ir0nGhosT', 18060645],
  ['Kleee', 17333666],
  ['OffBeatFox', 17278055],
  ['Morso', 17043965],
  ['BananaxMonkey', 17031384],
  // center
  ['Qdeviant', 18269609],
  ['filthycasual', 17837126],
  ['BigDaddy14', 15058060],
  ['ΔRoshyΔ', 14743896],
  ['RockFarm', 14719393],
  ['Sorrytiger', 14645305],
  ['Bungholio', 14400058],
  ['DOCTOR3', 14364466],
  ['-Melody-', 14345560],
  ['iRoNiC', 14237498],
  ['✩✩VividDreamer✩✩', 13979123],
  ['JakeSv', 13723408],
  ['Manezin82', 13360092],
  ['PRIVATE', 12663382],
  // right
  ['偽陽性', 20248116],
  ["Lil'Wolfie", 22186711],
  ['ETSoul38', 17375006],
  ['Szymon83', 17139280],
  ['K4ttluvrr7777', 16732267],
  ["'Eternal'", 16210576],
  ['Shōkyaku', 16054076],
  ['LadyCrazyPills', 15260084],
  ['KenzoSeekhem', 15183109],
  ['OdRaCiR', 15090103],
  ['GarceGarce', 14964700],
  ['Ferlight', 14813572],
  ['Lilitxxx1', 13621782],
  ['Undertaker10', 13471689],
  ['BjornIRonside', 13049085],
])

export function makeSampleEnemy(): LaneAssignment {
  const lanes = emptyLanes()
  for (const key of ['left', 'center', 'right'] as const) {
    lanes[key] = BDSM_LINEUPS[key].map((p) => createPlayer(p.nick, p.power))
  }
  return lanes
}

export function makeSampleReviRoster(): Player[] {
  return LMB_DEMO_ROSTER.map((p) => createPlayer(p.nick, p.power))
}

export const DEMO_NOTE =
  'Демо: противник — BDSM со скринов расстановки. «Наш» ростер временно из LMB того же матча (REVI на скринах нет) — загрузите свой CSV REVI.'
