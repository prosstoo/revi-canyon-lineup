import type { HeroColor, LaneAssignment, Player } from '../types'
import { createPlayer } from './parseRoster'

type Row = readonly [string, number, HeroColor[]?]

const MONO_BLUE: HeroColor[] = ['blue', 'blue', 'blue', 'blue', 'blue']
const MONO_RED: HeroColor[] = ['red', 'red', 'red', 'red', 'red']
const MONO_GREEN: HeroColor[] = ['green', 'green', 'green', 'green', 'green']

function lane(rows: Row[]): Player[] {
  return rows.map(([nick, power, squad]) => createPlayer(nick, power, squad ?? []))
}

function cloneLane(players: Player[]): Player[] {
  return players.map((p) => createPlayer(p.nick, p.power, [...p.squad]))
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
    createPlayer(p.nick, p.power, [...p.squad]),
  )
}

/**
 * Текущая расстановка REVI — со скринов линий + цвета из боевых отчётов 24.07.
 * Цвета: синие=танк, красные=ракета, зелёные=авиа. Пустой squad = неизвестно.
 */
export const REVI_CURRENT: LaneAssignment = {
  left: lane([
    ['SenjorTomato', 21345706, MONO_BLUE],
    ['BOMBARDIER', 20207802, ['blue', 'red', 'red', 'red', 'red']],
    ['Аллегрова', 19669686, MONO_GREEN],
    ['Layrouse', 19214805, MONO_BLUE],
    ['★BipolarStar★', 18119101, MONO_BLUE],
    ['Ałejanđrɵ', 16218911, MONO_RED],
    ['BAGIGR', 15735894, MONO_RED],
    ['Dze', 15638710, MONO_BLUE],
    ['General-Alcohol', 15501675, MONO_RED],
    ['MasoudEsm', 14974918, MONO_RED],
    ['炊き込み御飯', 14789792, MONO_BLUE],
    ['MixturA', 14627872, MONO_GREEN],
    ['《Koschō》', 14157469, MONO_BLUE],
    ['PolWilliam', 14087553, MONO_RED],
    ['Tusker777', 14045796, MONO_RED],
  ]),
  center: lane([
    ['PR0vokaTOR', 21465198, MONO_BLUE],
    ['◇ZloiPAPA◇', 21443909, MONO_BLUE],
    ['devyy', 20278099, MONO_GREEN],
    ['KKKe', 19482184, MONO_BLUE],
    ['Hitter', 17472698, MONO_RED],
    ['DocSirena', 17209711, MONO_BLUE],
    ['Defa1000', 16588903, MONO_RED],
    ['страх', 16240979, MONO_GREEN],
    ['KomstoK', 15800632, MONO_BLUE],
    ['VishenkA', 14401600, MONO_RED],
    ['TaraKash', 14352983, MONO_BLUE],
    ['Hkn', 14257829, MONO_RED],
    ['Лемниската', 14197768, MONO_GREEN],
    ['DziL', 13824562, MONO_BLUE],
    ['friendWwW', 13635675, MONO_RED],
  ]),
  right: lane([
    ['IBlackFlint', 20753024, MONO_BLUE],
    ['nevyy', 19752086, ['blue', 'red', 'red', 'red', 'red']],
    ['LAMPOCHKA', 19547186, MONO_GREEN],
    ['Tim2', 19013083, MONO_BLUE],
    ['cdpkaktus', 18800876, MONO_RED],
    ['Maranill', 18724594, MONO_GREEN],
    ['---КИС---', 17840010, MONO_BLUE],
    ['Solevar', 17238314, MONO_RED],
    ['ДядяВова', 16630372, MONO_BLUE],
    ['VaRvArTTT', 16411480, MONO_RED],
    ['Plytofka', 16148736, MONO_GREEN],
    ['IDARQ', 14825494, ['red', 'red', 'blue', 'red', 'red']],
    ['Solnce', 14438575, MONO_BLUE],
    ['AtAman', 14031840, MONO_RED],
    ['madnesss', 13286055, MONO_RED],
  ]),
}

/**
 * Противник BDSM — боевые отчёты 24.07 + цвета составов со скринов.
 */
export const BDSM_OPPONENT: LaneAssignment = {
  left: lane([
    ['r0yal666', 23331771, MONO_BLUE],
    ['すぬお', 21493865, MONO_BLUE],
    ['HОЧЬ', 21136415, MONO_RED],
    ['Ermakiko', 20428754, ['blue', 'red', 'red', 'red', 'red']],
    ['SeliX', 20340657, MONO_BLUE],
    ['Roza-Kass', 18908601, MONO_GREEN],
    ['«ЗloDei»', 18215389, MONO_RED],
    ['ゆうHO', 18191402, MONO_BLUE],
    ['Котэн', 18044382, ['green', 'blue', 'red', 'green', 'red']],
    ['Alletta', 17434038, MONO_RED],
    ['Тайрэ', 17085340, MONO_BLUE],
    ['Morgwen', 16901192, ['red', 'blue', 'green', 'red', 'blue']],
    ['ДокторХалк5264', 16703490, MONO_RED],
    ['MAPA', 16321544, MONO_BLUE],
    ['MenToR', 16196448, MONO_RED],
  ]),
  center: lane([
    ['Veleoka', 15993335, MONO_RED],
    ['DoctorDido', 15840511, MONO_RED],
    ['DiMiDoGlu-777', 15809605, MONO_BLUE],
    ['LoraApril', 15803988, MONO_RED],
    ['ArasakeSabura', 15744224, MONO_GREEN],
    ['SayaKGZ', 15639409, MONO_RED],
    ['Горшок', 15350121, MONO_BLUE],
    ['xLilith-LapaxX', 14920851, MONO_RED],
    ['有馬公生', 14898723, MONO_RED],
    ['xPanDeMoNiUmX', 14820470, MONO_RED],
    ['Wervolf92', 14640989, MONO_BLUE],
    ['CptChaos', 14562117, MONO_RED],
    ['semlol', 14332031, MONO_GREEN],
    ['Ragip', 13992468, MONO_RED],
    ['душегуб', 13915118, MONO_BLUE],
  ]),
  right: lane([
    ['Soldat76', 19720996, MONO_BLUE],
    ['KOLXOZNIK', 19581134, MONO_RED],
    ['Jester', 19300761, MONO_GREEN],
    ['Глазнюк', 18739659, MONO_BLUE],
    ['Atata', 17799237, MONO_RED],
    ['БАРТЯК', 17613326, MONO_BLUE],
    ['Dytel', 17595423, MONO_RED],
    ['Амарачи', 17284794, MONO_GREEN],
    ['Тучка', 16900087, MONO_RED],
    ['Мия2777', 16801498, MONO_BLUE],
    ['FlexLady', 16219776, MONO_RED],
    ['DivinityV', 16123304, MONO_RED],
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
  'Демо 24.07: учтены цвета героев (С>К>З>С) и моно-бонус 5/5. Стратегия по умолчанию — 2 сильные + 1 слабая напротив самой жирной линии BDSM.'
