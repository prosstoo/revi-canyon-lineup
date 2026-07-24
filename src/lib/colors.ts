import type { HeroColor, Player } from '../types'

/** Треугольник: синие бьют красных, красные — зелёных, зелёные — синих. */
export const COLOR_BEATS: Record<HeroColor, HeroColor> = {
  blue: 'red',
  red: 'green',
  green: 'blue',
}

export const COLOR_LABELS: Record<HeroColor, string> = {
  blue: 'Синие (танк)',
  red: 'Красные (ракета)',
  green: 'Зелёные (авиа)',
}

export const COLOR_SHORT: Record<HeroColor, string> = {
  blue: 'С',
  red: 'К',
  green: 'З',
}

/** Бонус урона за 5 героев одного цвета (по наблюдениям с боёв 24.07). */
export const MONO_BONUS = 1.15

/** Множитель при цветовом преимуществе (синие пометки на скринах). */
export const COLOR_ADVANTAGE = 1.2

/** Множитель при цветовом проигрыше (красные пометки). */
export const COLOR_DISADVANTAGE = 0.85

export function normalizeSquad(squad?: HeroColor[] | null): HeroColor[] {
  if (!squad?.length) return []
  return squad.filter(Boolean).slice(0, 5)
}

export function isMono(squad: HeroColor[]): boolean {
  const s = normalizeSquad(squad)
  return s.length === 5 && s.every((c) => c === s[0])
}

export function dominantColor(squad: HeroColor[]): HeroColor | null {
  const s = normalizeSquad(squad)
  if (s.length === 0) return null
  const counts: Record<HeroColor, number> = { blue: 0, red: 0, green: 0 }
  for (const c of s) counts[c] += 1
  let best: HeroColor = s[0]!
  let bestN = -1
  for (const c of ['blue', 'red', 'green'] as HeroColor[]) {
    if (counts[c] > bestN) {
      bestN = counts[c]
      best = c
    }
  }
  return best
}

/** Во сколько раз цвет A сильнее бьёт по цвету B. */
export function colorMatchup(attacker: HeroColor | null, defender: HeroColor | null): number {
  if (!attacker || !defender) return 1
  if (attacker === defender) return 1
  if (COLOR_BEATS[attacker] === defender) return COLOR_ADVANTAGE
  if (COLOR_BEATS[defender] === attacker) return COLOR_DISADVANTAGE
  return 1
}

export function monoMultiplier(squad: HeroColor[]): number {
  return isMono(squad) ? MONO_BONUS : 1
}

/**
 * Эффективная мощь атакующего против конкретного защитника:
 * мощь × моно-бонус × цветовой матчап.
 */
export function effectivePower(attacker: Player, defender: Player): number {
  const atkSquad = normalizeSquad(attacker.squad)
  const defSquad = normalizeSquad(defender.squad)
  const atkDom = dominantColor(atkSquad)
  const defDom = dominantColor(defSquad)
  return Math.round(
    attacker.power * monoMultiplier(atkSquad) * colorMatchup(atkDom, defDom),
  )
}

/** Средняя эффективная мощь игрока против набора соперников на линии. */
export function effectiveVsLane(player: Player, foes: Player[]): number {
  if (foes.length === 0) {
    return Math.round(player.power * monoMultiplier(normalizeSquad(player.squad)))
  }
  let sum = 0
  for (const f of foes) sum += effectivePower(player, f)
  return Math.round(sum / foes.length)
}

export function laneEffectiveThreat(players: Player[]): number {
  return players.reduce(
    (s, p) => s + Math.round(p.power * monoMultiplier(normalizeSquad(p.squad))),
    0,
  )
}

/** Контр-цвет к доминирующему цвету врага. */
export function counterColor(enemy: HeroColor | null): HeroColor | null {
  if (!enemy) return null
  for (const c of ['blue', 'red', 'green'] as HeroColor[]) {
    if (COLOR_BEATS[c] === enemy) return c
  }
  return null
}

export function parseColorToken(raw: string): HeroColor | null {
  const v = raw.trim().toLowerCase()
  if (!v) return null
  if (['b', 'blue', 'с', 'син', 'синий', 'синие', 'tank', 'танк', 'т'].includes(v)) {
    return 'blue'
  }
  if (['r', 'red', 'к', 'крас', 'красный', 'красные', 'missile', 'ракета', 'рак'].includes(v)) {
    return 'red'
  }
  if (
    ['g', 'green', 'з', 'зел', 'зелёный', 'зеленый', 'зелёные', 'зеленые', 'air', 'авиа', 'а'].includes(
      v,
    )
  ) {
    return 'green'
  }
  return null
}

/** Парсит "BBBBB", "blue,red,green,blue,red", "танк", "синие" → до 5 цветов. */
export function parseSquadColors(raw: string | null | undefined): HeroColor[] {
  if (raw == null || !String(raw).trim()) return []
  const s = String(raw).trim()
  const mono = parseColorToken(s)
  if (mono && !/[,\s]/.test(s) && s.length > 1 && !/^[brgскз]+$/i.test(s)) {
    return [mono, mono, mono, mono, mono]
  }
  // compact BBBBB / СКЗСК
  if (/^[brgскзBRGСКЗ]{1,5}$/.test(s)) {
    const out: HeroColor[] = []
    for (const ch of s) {
      const c = parseColorToken(ch)
      if (c) out.push(c)
    }
    return out.slice(0, 5)
  }
  const parts = s.split(/[,;|\s]+/).filter(Boolean)
  const out: HeroColor[] = []
  for (const p of parts) {
    const c = parseColorToken(p)
    if (c) out.push(c)
  }
  return out.slice(0, 5)
}

export function squadToShort(squad: HeroColor[]): string {
  const s = normalizeSquad(squad)
  if (s.length === 0) return '—'
  if (isMono(s)) return `${COLOR_SHORT[s[0]!]}×5`
  return s.map((c) => COLOR_SHORT[c]).join('')
}
