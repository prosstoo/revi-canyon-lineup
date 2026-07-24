import type {
  BattleSettings,
  FightLogEntry,
  LaneId,
  LaneSimResult,
  MatchSimResult,
  Player,
} from '../types'
import { FACING_LANE, LANE_IDS } from '../types'
import { effectivePower, monoMultiplier, normalizeSquad } from './colors'

interface Fighter {
  nick: string
  power: number
  remaining: number
  battlesLeft: number
  player: Player
}

function toFighters(players: Player[], maxBattles: number): Fighter[] {
  return [...players]
    .sort((a, b) => a.power - b.power)
    .map((p) => ({
      nick: p.nick,
      power: p.power,
      remaining: p.power,
      battlesLeft: maxBattles,
      player: p,
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
 * Эффективный остаток с учётом цветов:
 * remaining * (effective(full)/power) ≈ remaining * mono * matchup.
 */
function effectiveRemaining(f: Fighter, foe: Fighter): number {
  if (f.power <= 0) return 0
  const fullEff = effectivePower(f.player, foe.player)
  return Math.max(0, Math.round((f.remaining / f.power) * fullEff))
}

/**
 * Эстафетный бой на одной линии.
 * Учитывает мощь, моно-бонус 5/5 и цветовой треугольник (С>К>З>С).
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

    const ourEffective = effectiveRemaining(a, b)
    const theirEffective = effectiveRemaining(b, a)

    if (ourEffective === theirEffective) {
      const ourShown = a.remaining
      const theirShown = b.remaining
      a.remaining = 0
      b.remaining = 0
      a.battlesLeft -= 1
      b.battlesLeft -= 1
      fights.push({
        lane,
        facingLane,
        oursNick: a.nick,
        oursPower: ourShown,
        theirsNick: b.nick,
        theirsPower: theirShown,
        oursEffective: ourEffective,
        theirsEffective: theirEffective,
        winner: 'us',
        residual: 0,
      })
      oi += 1
      ti += 1
      continue
    }

    if (ourEffective > theirEffective) {
      const residualEff = ourEffective - theirEffective
      // переводим остаток обратно в «сырую» мощь пропорционально
      const scale = a.power > 0 ? a.power / Math.max(1, effectivePower(a.player, b.player)) : 1
      a.remaining = Math.max(0, Math.round(residualEff * scale))
      a.battlesLeft -= 1
      b.remaining = 0
      b.battlesLeft -= 1
      fights.push({
        lane,
        facingLane,
        oursNick: a.nick,
        oursPower: a.power,
        theirsNick: b.nick,
        theirsPower: b.power,
        oursEffective: ourEffective,
        theirsEffective: theirEffective,
        winner: 'us',
        residual: a.remaining,
      })
      ti += 1
      if (a.remaining <= 0 || a.battlesLeft <= 0) oi += 1
    } else {
      const residualEff = theirEffective - ourEffective
      const scale = b.power > 0 ? b.power / Math.max(1, effectivePower(b.player, a.player)) : 1
      b.remaining = Math.max(0, Math.round(residualEff * scale))
      b.battlesLeft -= 1
      a.remaining = 0
      a.battlesLeft -= 1
      fights.push({
        lane,
        facingLane,
        oursNick: a.nick,
        oursPower: a.power,
        theirsNick: b.nick,
        theirsPower: b.power,
        oursEffective: ourEffective,
        theirsEffective: theirEffective,
        winner: 'them',
        residual: b.remaining,
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

export function simulateMatch(
  ours: Record<LaneId, Player[]>,
  theirs: Record<LaneId, Player[]>,
  settings: BattleSettings,
): MatchSimResult {
  const ourFight = fightingLanes(ours, settings.maxPerLane)
  const theirFight = fightingLanes(theirs, settings.maxPerLane)
  const lanes = {} as Record<LaneId, LaneSimResult>
  let ourFlags = 0
  let theirFlags = 0

  for (const lane of LANE_IDS) {
    const facing = FACING_LANE[lane]
    const result = simulateLane(
      lane,
      facing,
      ourFight[lane] ?? [],
      theirFight[facing] ?? [],
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

/** Мощь линии с моно-бонусом (без учёта матчапа — для оценки угрозы). */
export function laneThreat(players: Player[]): number {
  return players.reduce(
    (s, p) => s + Math.round(p.power * monoMultiplier(normalizeSquad(p.squad))),
    0,
  )
}

export function emptyLanes(): Record<LaneId, Player[]> {
  return { left: [], center: [], right: [] }
}

export function topFighters(players: Player[], maxPerLane: number): Player[] {
  return [...players].sort((a, b) => b.power - a.power).slice(0, maxPerLane)
}

export function fightingLanes(
  lanes: Record<LaneId, Player[]>,
  maxPerLane: number,
): Record<LaneId, Player[]> {
  return {
    left: topFighters(lanes.left ?? [], maxPerLane),
    center: topFighters(lanes.center ?? [], maxPerLane),
    right: topFighters(lanes.right ?? [], maxPerLane),
  }
}

export function flatPlayers(lanes: Record<LaneId, Player[]>): Player[] {
  return [...(lanes.left ?? []), ...(lanes.center ?? []), ...(lanes.right ?? [])]
}

export function sortForDisplay(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.power - a.power)
}

export function turnOrderNumber(indexFromStrong: number, total: number): number {
  if (indexFromStrong < 0) return 0
  return total - indexFromStrong
}
