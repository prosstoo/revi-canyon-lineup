import type { LaneAssignment, Player } from '../types'
import { createPlayer } from './parseRoster'

type Row = readonly [string, number]

function lane(rows: Row[]): Player[] {
  return rows.map(([nick, power]) => createPlayer(nick, power))
}

function cloneLane(players: Player[]): Player[] {
  return players.map((p) => createPlayer(p.nick, p.power))
}

function cloneLanes(src: LaneAssignment): LaneAssignment {
  return {
    left: cloneLane(src.left),
    center: cloneLane(src.center),
    right: cloneLane(src.right),
  }
}

/**
 * BDSM со скринов БОЕВЫХ ОТЧЁТОВ (#95[BDSM] vs #87[LMB]).
 * photo_17–35 — это те ники, которые видно в бою.
 */
export const BDSM_FROM_BATTLES: LaneAssignment = {
  left: lane([
    ['r0yal666', 23331771],
    ['すぬお', 21493865],
    ['HОЧЬ', 21136415],
    ['Ermakiko', 20428754],
    ['SeliX', 20340657],
    ['Roza-Kass', 18908601],
    ['«ЗloDei»', 18215389],
    ['ゆうHO', 18191402],
    ['Котэн', 18044382],
    ['Alletta', 17434038],
    ['Тайрэ', 17085340],
    ['Morgwen', 16901192],
    ['ДокторХалк5264', 16703490],
    ['MAPA', 16321544],
    ['MenToR', 16196448],
  ]),
  center: lane([
    ['Veleoka', 15993335],
    ['DoctorDido', 15840511],
    ['DiMiDoGlu-777', 15809605],
    ['LoraApril', 15803988],
    ['ArasakeSabura', 15744224],
    ['SayaKGZ', 15639409],
    ['Горшок', 15350121],
    ['xLilith-LapaxX', 14920851],
    ['有馬公生', 14898723],
    ['xPanDeMoNiUmX', 14820470],
    ['Wervolf92', 14640989],
    ['CptChaos', 14562117],
    ['semlol', 14332031],
    ['Ragip', 13992468],
    ['душегуб', 13915118],
  ]),
  right: lane([
    ['Soldat76', 19720996],
    ['KOLXOZNIK', 19581134],
    ['Jester', 19300761],
    ['Глазнюк', 18739659],
    ['Atata', 17799237],
    ['БАРТЯК', 17613326],
    ['Dytel', 17595423],
    ['Амарачи', 17284794],
    ['Тучка', 16900087],
    ['Мия2777', 16801498],
    ['FlexLady', 16219776],
    ['DivinityV', 16123304],
  ]),
}

/**
 * Состав со скринов «Сведения о расстановке на линиях» (photo_4–5, 9–10, 13–14).
 */
export const BDSM_FROM_SETUP: LaneAssignment = {
  left: lane([
    ['SenjorTomato', 21345706],
    ['BOMBARDIER', 20207802],
    ['Аллегрова', 19669686],
    ['Layrouse', 19214805],
    ['★BipolarStar★', 18119101],
    ['Ałejanđrɵ', 16218911],
    ['BAGIGR', 15735894],
    ['Dze', 15638710],
    ['General-Alcohol', 15501675],
    ['MasoudEsm', 14974918],
    ['炊き込み御飯', 14789792],
    ['MixturA', 14627872],
    ['《Koschō》', 14157469],
    ['PolWilliam', 14087553],
    ['Tusker777', 14045796],
  ]),
  center: lane([
    ['PR0vokaTOR', 21465198],
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
  right: lane([
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

/** LMB со скринов боёв — расставлены по линиям как в отчётах */
export const LMB_FROM_BATTLES: LaneAssignment = {
  left: lane([
    ['Ash11134', 32422146],
    ['RichardBDraggin', 26222788],
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
  ]),
  center: lane([
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
  ]),
  right: lane([
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
  ]),
}

/** По умолчанию в планировщике — BDSM из боевых отчётов */
export function makeSampleEnemy(): LaneAssignment {
  return cloneLanes(BDSM_FROM_BATTLES)
}

export function makeSetupEnemy(): LaneAssignment {
  return cloneLanes(BDSM_FROM_SETUP)
}

/** Демо «наша» сторона = LMB с тех же скринов боёв (REVI на скринах нет) */
export function makeSampleReviRoster(): Player[] {
  const { left, center, right } = LMB_FROM_BATTLES
  return [...left, ...center, ...right].map((p) => createPlayer(p.nick, p.power))
}

export function makeDemoOurAssignment(): LaneAssignment {
  return cloneLanes(LMB_FROM_BATTLES)
}

export const DEMO_NOTE =
  'Демо: слева — состав LMB со скринов боёв (вместо REVI). Справа — BDSM со скринов (#95). Замените левую сторону своим CSV REVI.'
