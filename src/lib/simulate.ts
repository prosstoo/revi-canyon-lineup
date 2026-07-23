import type {
  BattleSettings,
  FightLogEntry,
  LaneId,
  LaneSimResult,
  MatchSimResult,
  Player,
} from '../types'
import { FACING_LANE, LANE_IDS } from '../types'

interface Fighter {
  nick: string
  power: number
  remaining: number
  battlesLeft: number
}

function toFighters(players: Player[], maxBattles: number): Fighter[] {
  return [...players]
    .sort((a, b) => a.power - b.power)
    .map((p) => ({
      nick: p.nick,
      power: p.power,
      remaining: p.power,
      battlesLeft: maxBattles,
    }))
}

function countSurvivors(queue: Fighter[], startIndex: number): number {
  let n = 0
  for (let i = startIndex; i < queue.length; i++) {
    const f = queue[i]!
    if (f.remaining > 0 && f.battlesLeft > 0) n += 1
  }
  return n
}

/**
 * Эстафетный бой на одной линии.
 * Бой идёт от слабых к сильным; в списках UI показываем от сильных (N) к слабым (1).
 */
export function simulateLane(
  lane: LaneId,
  facingLane: LaneId,
  ours: Player[],
  theirs: Player[],
  settings: BattleSettings,
): LaneSimResult {
  const ourQ = toFighters(ours, settings.maxBattles)
  const theirQ = toFighters(theirs, settings.maxBattles)
  const fights: FightLogEntry[] = []

  let oi = 0
  let ti = 0

  while (oi < ourQ.length && ti < theirQ.length) {
    const a = ourQ[oi]!
    const b = theirQ[ti]!

    if (a.battlesLeft <= 0 || a.remaining <= 0) {
      oi += 1
      continue
    }
    if (b.battlesLeft <= 0 || b.remaining <= 0) {
      ti += 1
      continue
    }

    const ourEffective = a.remaining
    const theirEffective = b.remaining

    if (ourEffective === theirEffective) {
      a.remaining = 0
      b.remaining = 0
      a.battlesLeft -= 1
      b.battlesLeft -= 1
      fights.push({
        lane,
        facingLane,
        oursNick: a.nick,
        oursPower: ourEffective,
        theirsNick: b.nick,
        theirsPower: theirEffective,
        winner: 'us',
        residual: 0,
      })
      oi += 1
      ti += 1
      continue
    }

    if (ourEffective > theirEffective) {
      const residual = Math.max(0, ourEffective - theirEffective)
      a.remaining = residual
      a.battlesLeft -= 1
      b.remaining = 0
      b.battlesLeft -= 1
      fights.push({
        lane,
        facingLane,
        oursNick: a.nick,
        oursPower: ourEffective,
        theirsNick: b.nick,
        theirsPower: theirEffective,
        winner: 'us',
        residual,
      })
      ti += 1
      if (a.remaining <= 0 || a.battlesLeft <= 0) oi += 1
    } else {
      const residual = Math.max(0, theirEffective - ourEffective)
      b.remaining = residual
      b.battlesLeft -= 1
      a.remaining = 0
      a.battlesLeft -= 1
      fights.push({
        lane,
        facingLane,
        oursNick: a.nick,
        oursPower: ourEffective,
        theirsNick: b.nick,
        theirsPower: theirEffective,
        winner: 'them',
        residual,
      })
      oi += 1
      if (b.remaining <= 0 || b.battlesLeft <= 0) ti += 1
    }
  }

  const ourSurvivors = countSurvivors(ourQ, oi)
  const theirSurvivors = countSurvivors(theirQ, ti)

  let winner: 'us' | 'them' | 'draw'
  if (ours.length === 0 && theirs.length === 0) winner = 'draw'
  else if (ours.length === 0) winner = 'them'
  else if (theirs.length === 0) winner = 'us'
  else if (ourSurvivors > 0 && theirSurvivors === 0) winner = 'us'
  else if (theirSurvivors > 0 && ourSurvivors === 0) winner = 'them'
  else if (ourSurvivors === 0 && theirSurvivors === 0) {
    const last = fights[fights.length - 1]
    winner = last?.winner ?? 'draw'
  } else {
    winner = 'draw'
  }

  return { lane, facingLane, winner, ourSurvivors, theirSurvivors, fights }
}

/** Наша левая бьётся с их правой, наша правая — с их левой, центр — с центром */
export function simulateMatch(
  ours: Record<LaneId, Player[]>,
  theirs: Record<LaneId, Player[]>,
  settings: BattleSettings,
): MatchSimResult {
  const lanes = {} as Record<LaneId, LaneSimResult>
  let ourFlags = 0
  let theirFlags = 0

  for (const lane of LANE_IDS) {
    const facing = FACING_LANE[lane]
    const result = simulateLane(
      lane,
      facing,
      ours[lane] ?? [],
      theirs[facing] ?? [],
      settings,
    )
    lanes[lane] = result
    if (result.winner === 'us') ourFlags += 1
    else if (result.winner === 'them') theirFlags += 1
  }

  let outcome: 'win' | 'lose' | 'draw'
  if (ourFlags > theirFlags) outcome = 'win'
  else if (ourFlags < theirFlags) outcome = 'lose'
  else outcome = 'draw'

  return { lanes, ourFlags, theirFlags, outcome }
}

export function lanePower(players: Player[]): number {
  return players.reduce((s, p) => s + p.power, 0)
}

export function emptyLanes(): Record<LaneId, Player[]> {
  return { left: [], center: [], right: [] }
}

/** Сортировка для списков: сильные сверху, номер хода N…1 */
export function sortForDisplay(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.power - a.power)
}

export function turnOrderNumber(indexFromStrong: number, total: number): number {
  return total - indexFromStrong
}
