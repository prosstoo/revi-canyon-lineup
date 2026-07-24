export type LaneId = 'left' | 'center' | 'right'

export const LANE_IDS: LaneId[] = ['left', 'center', 'right']

export const LANE_LABELS: Record<LaneId, string> = {
  left: 'Левая линия',
  center: 'Центральная линия',
  right: 'Правая линия',
}

/** Наша линия → линия противника: левая↔левая, центр↔центр, правая↔правая (по боевым отчётам). */
export const FACING_LANE: Record<LaneId, LaneId> = {
  left: 'left',
  center: 'center',
  right: 'right',
}

/** Цвет/фракция героя: синие (танк), красные (ракета), зелёные (авиа) */
export type HeroColor = 'blue' | 'red' | 'green'

export interface Player {
  id: string
  nick: string
  power: number
  /** До 5 цветов героев в составе. Пусто = цвет неизвестен. */
  squad: HeroColor[]
}

export type LaneAssignment = Record<LaneId, Player[]>

export interface BattleSettings {
  maxPerLane: number
  maxBattles: number
}

export const DEFAULT_SETTINGS: BattleSettings = {
  maxPerLane: 15,
  maxBattles: 3,
}

export type StrategyId = 'balance' | 'twoStrong' | 'maximizeFlags'

export const STRATEGY_META: Record<StrategyId, { title: string; description: string }> = {
  balance: {
    title: 'Баланс',
    description: 'Равномерно распределяет мощь по трём линиям (без жертвы).',
  },
  twoStrong: {
    title: '2 сильные + 1 слабая',
    description:
      'Две сильные линии (топ-30) и жертва напротив самой опасной линии врага (следующий топ-15, не дно ростера). Учитывает цвета и моно 5/5.',
  },
  maximizeFlags: {
    title: 'Максимум флагов (2+1)',
    description:
      'Перебирает варианты «2 сильные + жертва» с учётом цветов и выбирает лучший прогноз по флагам.',
  },
}

export interface FightLogEntry {
  lane: LaneId
  facingLane: LaneId
  oursNick: string
  oursPower: number
  theirsNick: string
  theirsPower: number
  oursEffective: number
  theirsEffective: number
  winner: 'us' | 'them'
  residual: number
}

export interface LaneSimResult {
  lane: LaneId
  facingLane: LaneId
  winner: 'us' | 'them' | 'draw'
  ourSurvivors: number
  theirSurvivors: number
  fights: FightLogEntry[]
}

export interface MatchSimResult {
  lanes: Record<LaneId, LaneSimResult>
  ourFlags: number
  theirFlags: number
  outcome: 'win' | 'lose' | 'draw'
}
