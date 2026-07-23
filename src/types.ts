export type LaneId = 'left' | 'center' | 'right'

export const LANE_IDS: LaneId[] = ['left', 'center', 'right']

export const LANE_LABELS: Record<LaneId, string> = {
  left: 'Левая линия',
  center: 'Центральная линия',
  right: 'Правая линия',
}

/** Наша линия → линия противника напротив (лево↔право, центр↔центр) */
export const FACING_LANE: Record<LaneId, LaneId> = {
  left: 'right',
  center: 'center',
  right: 'left',
}

export interface Player {
  id: string
  nick: string
  power: number
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
    description: 'Равномерно распределяет мощь по трём линиям.',
  },
  twoStrong: {
    title: '2 сильные + жертва',
    description: 'Усиливает две линии, третью оставляет слабой.',
  },
  maximizeFlags: {
    title: 'Максимум флагов',
    description: 'Ищет расстановку с лучшим прогнозом по флагам (с учётом зеркала линий).',
  },
}

export interface FightLogEntry {
  lane: LaneId
  facingLane: LaneId
  oursNick: string
  oursPower: number
  theirsNick: string
  theirsPower: number
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
