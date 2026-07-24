import type { HeroColor, LaneAssignment, Player } from '../types'
import { createPlayer } from './parseRoster'

type Row = readonly [string, number, HeroColor[]?]

const MONO_RED: HeroColor[] = ['red', 'red', 'red', 'red', 'red']
const MONO_BLUE: HeroColor[] = ['blue', 'blue', 'blue', 'blue', 'blue']
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
 * REVI (#132) — актуальная расстановка со скринов «Сведения о расстановке»
 * 24.07 11:02. Топ-15 по порядку ходов + запас на линии.
 */
export const REVI_CURRENT: LaneAssignment = {
  left: lane([
    // бой 15→1
    ['IBlackFlint', 20753024, MONO_BLUE],
    ['devyy', 20278099, MONO_GREEN],
    ['BOMBARDIER', 20207802, ['blue', 'red', 'red', 'red', 'red']],
    ['Аллегрова', 19669686, MONO_GREEN],
    ['LAMPOCHKA', 19547186, MONO_GREEN],
    ['Layrouse', 19214805, MONO_BLUE],
    ['cdpkaktus', 18860653, MONO_RED],
    ['Maraniil', 18724594, MONO_GREEN],
    ['---КИС---', 17840010, MONO_BLUE],
    ['Solevar', 17238314, MONO_RED],
    ['VaRvArTTT', 16739611, MONO_RED],
    ['Plytofka', 16242228, MONO_GREEN],
    ['страх', 15412048, MONO_GREEN],
    ['炊き込み御飯', 14804836, MONO_BLUE],
    ['MixturA', 14679489, MONO_GREEN],
    // запас
    ['HexaS', 13731526],
    ['Пирожочек', 12704690],
    ['Yaa°Blue', 12678817],
    ['Domino777', 12109435],
    ['Arphira', 11620843],
    ['DoctorNins', 11469398],
    ['★きゃら★', 11414036],
    ['Lisa-Patrekeevna', 10310801],
    ['zOOm', 9694549],
    ['Mielczara', 9626899],
    ['ЧерТёНоКФкЕдАх', 9033251],
    ['변기에넣고서내려', 7930006],
    ['Yulie', 7404669],
    ['Daenerystargarye', 5862776],
    ['『Лиса』', 5586521],
    ['DreamerDoom', 3121915],
  ]),
  center: lane([
    // бой 15→1 (со скринов «Центральная» — IDARQ/Hkn/VishenkA в топ-15)
    ['◇ZloiPAPA◇', 21718663, MONO_BLUE],
    ['PR0vokaTOR', 21467061, MONO_BLUE],
    ['SenjorTomato', 21353445, MONO_BLUE],
    ['nevyy', 19752086, ['blue', 'red', 'red', 'red', 'red']],
    ['KKKe', 19482184, MONO_BLUE],
    ['Tim2', 19173567, MONO_BLUE],
    ['★BipolarStar★', 18119101, MONO_BLUE],
    ['DocSirena', 17703074, MONO_BLUE],
    ['Hitter', 17472698, MONO_RED],
    ['ДядяВова', 16674497, MONO_BLUE],
    ['Defa1000', 16588903, MONO_RED],
    ['KomstoK', 15800632, MONO_BLUE],
    ['IDARQ', 14825494, ['red', 'red', 'blue', 'red', 'red']],
    ['Hkn', 14761788, MONO_RED],
    ['VishenkA', 14413235, MONO_RED],
    // запас
    ['Dze', 15638710, MONO_BLUE],
    ['TaraKash', 14587000, MONO_BLUE],
    ['Solnce', 14438575, MONO_BLUE],
    ['Tusker777', 14164031],
    ['DziL', 13941066],
    ['friendWwW', 13715458],
    ['RamZz', 12786913],
    ['DzikAlfa', 12757437],
    ['Lovchaya', 12732160],
    ['TymkalA', 12315073],
    ['Marycl3', 11195611],
    ['SHAKAL', 10687085],
    ['DrEnchantress132', 10504793],
    ['brooze', 9462460],
    ['LeXa-', 8858361],
    ['BenBlast', 8031124],
    ['doraa', 7614296],
    ['아프라', 7398985],
    ['Puziko', 5576167],
  ]),
  right: lane([
    // правая — остальные со скринов (без дублей центра)
    ['Ałejanđrɵ', 16218911, MONO_RED],
    ['BAGIGR', 15735894, MONO_RED],
    ['General-Alcohol', 15501675, MONO_RED],
    ['MasoudEsm', 14974918, MONO_RED],
    ['Лемниската', 14197768, MONO_GREEN],
    ['《Koschō》', 14157469, MONO_BLUE],
    ['PolWilliam', 14087553, MONO_RED],
    ['AtAman', 14031840, MONO_RED],
    ['madnesss', 13286055, MONO_RED],
    ['88Алина88', 13175950],
    ['Casstiell', 12770552],
    ['YodasTR', 11793404],
    // запас
    ['~•Кнопка•~', 11746323],
    ['AZEeyyub', 11333658],
    ['•ДoбрАя•МaМкА•', 9612629],
    ['Napasorn', 8575360],
    ['BadGirl69', 8464467],
  ]),
}

/**
 * LMB (#87) — противник REVI, составы с боевых отчётов 24.07.
 */
export const LMB_OPPONENT: LaneAssignment = {
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

/** @deprecated — LMB как «наш» больше не демо-дефолт */
export const LMB_CURRENT = LMB_OPPONENT

export function makeLmbEnemy(): LaneAssignment {
  return cloneLanes(LMB_OPPONENT)
}

export function makeReviCurrentAssignment(): LaneAssignment {
  return cloneLanes(REVI_CURRENT)
}

export function makeLmbCurrentAssignment(): LaneAssignment {
  return makeLmbEnemy()
}

export function makeAsbiEnemy(): LaneAssignment {
  return makeLmbEnemy()
}

export function makeBdsmEnemy(): LaneAssignment {
  return makeLmbEnemy()
}

export function makeReviRoster(): Player[] {
  return flatten(REVI_CURRENT)
}

export const DEMO_NOTE =
  'Демо: REVI vs LMB. REVI — со скринов расстановки (IDARQ, Hkn, VishenkA — центр). LMB — с боевых отчётов. Линии: левая↔левая, центр↔центр, правая↔правая.'
