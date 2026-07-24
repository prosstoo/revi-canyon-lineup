import type { HeroColor, LaneAssignment, Player } from '../types'
import { createPlayer } from './parseRoster'

type Row = readonly [string, number, HeroColor[]?]

const MONO_RED: HeroColor[] = ['red', 'red', 'red', 'red', 'red']
const MONO_BLUE: HeroColor[] = ['blue', 'blue', 'blue', 'blue', 'blue']

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
 * LMB (#87) — боевые отчёты 24.07 vs ASBI (photo_22–41).
 * Линия = вкладка отчёта (левая↔левая).
 */
export const LMB_CURRENT: LaneAssignment = {
  left: lane([
    ['stague', 19082930, MONO_RED],
    ['MeLiH', 18762462, ['red', 'red', 'blue', 'red', 'blue']],
    ['M-V-P--Jay', 18490093, MONO_RED],
    ['Crazypills', 18111846, MONO_RED],
    ['Ir0nGhosT', 18060645, MONO_BLUE],
    ['Kleee', 17333666, MONO_RED],
    ['OffBeatFox', 17278055, MONO_RED],
    ['Morso', 17043965, MONO_BLUE],
    ['Banana×Monkey', 17031384, MONO_RED],
    ['Bianca92', 16549021, MONO_RED],
  ]),
  center: lane([
    ['Sontaro', 18775029, MONO_RED],
    ['Qdeviant', 18269609, MONO_BLUE],
    ['filthycasual', 17837126, MONO_RED],
    ['BigDaddy14', 15058060, MONO_RED],
    ['ΔRoshyΔ', 14743896, MONO_BLUE],
    ['RockFarm', 14719393, MONO_RED],
    ['Sorrytiger', 14645305, MONO_RED],
    ['iRoniC', 14422940, MONO_BLUE],
    ['Bungholio', 14400058, MONO_RED],
    ['D0CTOR3', 14364466, MONO_RED],
    ['•Melody•', 14345560, MONO_BLUE],
    ['☆☆VividDreamer☆☆', 13979123, MONO_RED],
    ['JakeSv', 13723408, ['red', 'blue', 'red', 'blue', 'red']],
    ['Manezin82', 13360092, ['red', 'red', 'blue', 'blue', 'red']],
    ['PRIVATE', 12676793, MONO_RED],
  ]),
  right: lane([
    ['偽陽性', 22326951, MONO_BLUE],
    ["Lil'Wolfie", 18164321, MONO_RED],
    ['ETSoul38', 17401071, MONO_RED],
    ['Szymon83', 17234005, MONO_BLUE],
    ['K4ttluvrr7777', 16732267, MONO_RED],
    ["'Eternal'", 16210576, MONO_RED],
    ['Shōkyaku', 16054076, MONO_BLUE],
    ['LadyCrazyPills', 15260084, MONO_RED],
    ['KenzoSeekhem', 15183109, MONO_RED],
    ['OdRaCiR', 15090103, MONO_BLUE],
    ['GarceGarce', 14964700, MONO_RED],
    ['Ferlight', 14813572, MONO_RED],
    ['Lilitxxx1', 13621782, MONO_BLUE],
    ['Undertaker10', 13471689, MONO_RED],
  ]),
}

/**
 * ASBI (#122) — противник LMB, те же вкладки отчётов.
 */
export const ASBI_OPPONENT: LaneAssignment = {
  left: lane([
    ['Busgosu', 17896232, MONO_RED],
    ['☆ Karmen ☆', 17763305, MONO_RED],
    ['Solvas', 16170167, MONO_RED],
    ['Firebladerr97', 16049749, MONO_BLUE],
    ['haposai', 15416542, MONO_RED],
    ['САЛАМАНДРА', 15206419, MONO_RED],
    ['Zubr56', 15114759, MONO_BLUE],
    ['Baiamut', 14629766, MONO_RED],
    ['Smetan', 14094805, MONO_RED],
    ['Ебушкиворобушки', 13570260, MONO_RED],
    ['SallySaffron', 13110981, MONO_BLUE],
    ['Жене4каааа', 12565495, MONO_RED],
    ['Zaura04', 12024673, MONO_RED],
    ['ЗасланнаяP', 11956919, MONO_BLUE],
    ['VиKtoRиЯ', 11878410, MONO_RED],
  ]),
  center: lane([
    ['LordKreton', 20276489, MONO_BLUE],
    ['Dejmill', 17860932, MONO_RED],
    ['Kalesí', 17656435, MONO_RED],
    ['Spartキツネ', 16326289, MONO_BLUE],
    ['RemboBezTrysov', 16256490, MONO_RED],
    ['XxMORTIZxX', 15699025, MONO_RED],
    ['Люциферрр', 14731401, MONO_BLUE],
    ['Selene78', 14519038, MONO_RED],
    ['SkuldGallaecia', 13897210, MONO_RED],
    ['Mashulya69Rus', 13823626, MONO_BLUE],
    ['SERIBAN', 13174260, MONO_RED],
    ['МерлинМонро', 12931251, MONO_RED],
    ['CRELOR', 12257530, MONO_RED],
    ['Xhamara', 11951213, MONO_BLUE],
  ]),
  right: lane([
    ['DrQuijote', 20057945, MONO_BLUE],
    ['Габигаби', 18562592, MONO_RED],
    ['kukylot', 16837871, MONO_RED],
    ['Unblooder', 16727270, MONO_BLUE],
    ['Galahan17', 15857818, MONO_RED],
    ['QueenShadows', 15721263, MONO_RED],
    ['samaru', 15580200, MONO_BLUE],
    ['анестезиолог', 15332440, MONO_RED],
    ['ELROND', 14643810, MONO_RED],
    ['MaстерицA', 14335942, MONO_BLUE],
    ['Vl4dislav', 13941262, MONO_RED],
    ['MrTuberculo', 13668349, MONO_RED],
    ['•Bambolina•', 13363721, MONO_BLUE],
    ['Stas707', 12663327, MONO_RED],
    ['Swetlana17247', 12243511, MONO_RED],
  ]),
}

/** @deprecated alias — старое имя, теперь LMB */
export const REVI_CURRENT = LMB_CURRENT
/** @deprecated alias — старое имя, теперь ASBI */
export const BDSM_OPPONENT = ASBI_OPPONENT

export function makeAsbiEnemy(): LaneAssignment {
  return cloneLanes(ASBI_OPPONENT)
}

export function makeLmbCurrentAssignment(): LaneAssignment {
  return cloneLanes(LMB_CURRENT)
}

export function makeBdsmEnemy(): LaneAssignment {
  return makeAsbiEnemy()
}

export function makeReviCurrentAssignment(): LaneAssignment {
  return makeLmbCurrentAssignment()
}

export function makeReviRoster(): Player[] {
  return flatten(LMB_CURRENT)
}

export const DEMO_NOTE =
  'Демо 24.07: LMB vs ASBI со скринов боёв. Линии бьются прямо: левая↔левая, центр↔центр, правая↔правая.'
