export type LaneId = 'left' | 'center' | 'right'

export const LANE_IDS: LaneId[] = ['left', 'center', 'right']

export const LANE_LABELS: Record<LaneId, string> = {
  left: 'Левая линия',
  center: 'Центральная линия',
  right: 'Правая линия',
}

export interface Player {
  id: string
  nick: string
  power: number
}

export type LaneAssignment = Record<LaneId, Player[]>

export interface BattleSettings {
  /** Макс. игроков на одну линию */
  maxPerLane: number
  /** Лимит боёв на отряд (2 — юнцы, 3 — элита+) */
  maxBattles: number
  /**
   * Коэффициент урона: остаток победителя = P_win - damageCoeff * P_lose.
   * 1 = полная «взаимная» модель по мощи.
   */
  damageCoeff: number
}

export const DEFAULT_SETTINGS: BattleSettings = {
  maxPerLane: 15,
  maxBattles: 3,
  damageCoeff: 1,
}

export type StrategyId =
  | 'balance'
  | 'mirror'
  | 'twoStrong'
  | 'pressureWeak'
  | 'counterRelay'
  | 'maximizeFlags'

export const STRATEGY_META: Record<
  StrategyId,
  { title: string; description: string }
> = {
  balance: {
    title: 'Баланс',
    description: 'Равномерно распределяет мощь по трём линиям.',
  },
  mirror: {
    title: 'Зеркало',
    description: 'Подгоняет суммы мощи линий под состав соперника.',
  },
  twoStrong: {
    title: '2 сильные + жертва',
    description: 'Усиливает две линии, третью оставляет слабой.',
  },
  pressureWeak: {
    title: 'Давление на слабую',
    description: 'Складывает топов против самой слабой линии врага.',
  },
  counterRelay: {
    title: 'Контр-эстафета',
    description:
      'Жадно ставит игроков так, чтобы слабые снимали чужих слабых, топы добивали.',
  },
  maximizeFlags: {
    title: 'Максимум флагов',
    description:
      'Перебирает назначения через симуляцию и ищет лучший прогноз по флагам.',
  },
}

export interface FightLogEntry {
  lane: LaneId
  oursNick: string
  oursPower: number
  theirsNick: string
  theirsPower: number
  winner: 'us' | 'them'
  residual: number
}

export interface LaneSimResult {
  lane: LaneId
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
