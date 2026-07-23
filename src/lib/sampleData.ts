import type { LaneAssignment, Player } from '../types'
import { createPlayer } from './parseRoster'

type Row = readonly [string, number]

function lane(rows: Row[]): Player[] {
  return rows.map(([nick, power]) => createPlayer(nick, power))
}

function cloneLane(players: Player[]): Player[] {
  return players.map((p) => createPlayer(p.nick, p.power))
}

export function cloneLanes(src: LaneAssignment): LaneAssignment {
  return {
    left: cloneLane(src.left),
    center: cloneLane(src.center),
    right: cloneLane(src.right),
  }
}

function flatten(src: LaneAssignment): Player[] {
  return [...src.left, ...src.center, ...src.right].map((p) =>
    createPlayer(p.nick, p.power),
  )
}

/**
 * Текущая расстановка REVI — со скринов «Сведения о расстановке на линиях»
 * (photo_4–5 левая, 9–10 центр, 13–14 правая).
 */
export const REVI_CURRENT: LaneAssignment = {
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

/**
 * Противник BDSM — со скринов боевых отчётов (#95[BDSM], photo_17–35).
 * Показывает, как они реально дерутся по линиям.
 */
export const BDSM_OPPONENT: LaneAssignment = {
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

export function makeBdsmEnemy(): LaneAssignment {
  return cloneLanes(BDSM_OPPONENT)
}

export function makeReviCurrentAssignment(): LaneAssignment {
  return cloneLanes(REVI_CURRENT)
}

export function makeReviRoster(): Player[] {
  return flatten(REVI_CURRENT)
}

export const DEMO_NOTE =
  'Демо: REVI — текущая расстановка со скринов линий. BDSM — состав со скринов боёв. Ниже — рекомендуемая перестановка, чтобы обыграть BDSM.'
