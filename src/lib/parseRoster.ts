import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { HeroColor, LaneId, Player } from '../types'
import { LANE_IDS } from '../types'
import { parseSquadColors } from './colors'

let idCounter = 0

export function createPlayer(
  nick: string,
  power: number,
  squad: HeroColor[] = [],
): Player {
  idCounter += 1
  return {
    id: `p-${idCounter}-${Date.now()}`,
    nick: nick.trim(),
    power,
    squad: squad.slice(0, 5),
  }
}

export function resetPlayerIds(): void {
  idCounter = 0
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '')
}

function pickNick(row: Record<string, string>): string | null {
  const keys = Object.keys(row)
  const nickKey = keys.find((k) => {
    const n = normalizeHeader(k)
    return (
      n === 'nick' ||
      n === 'ник' ||
      n === 'имя' ||
      n === 'name' ||
      n === 'игрок' ||
      n === 'player' ||
      n === 'участник' ||
      n === 'имяучастника'
    )
  })
  if (nickKey) return row[nickKey] ?? null
  // fallback: first column
  const first = keys[0]
  return first ? (row[first] ?? null) : null
}

function pickPower(row: Record<string, string>): number | null {
  const keys = Object.keys(row)
  const powerKey = keys.find((k) => {
    const n = normalizeHeader(k)
    return (
      n === 'power' ||
      n === 'мощь' ||
      n === 'сила' ||
      n === 'мощькоманды' ||
      n === 'мощьотряда' ||
      n === 'trooppower' ||
      n === 'cp'
    )
  })
  const raw = powerKey ? row[powerKey] : keys[1] ? row[keys[1]] : null
  if (raw == null || raw === '') return null
  const cleaned = String(raw).replace(/[\s\u00a0]/g, '').replace(',', '.')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

function pickLane(row: Record<string, string>): LaneId | null {
  const keys = Object.keys(row)
  const laneKey = keys.find((k) => {
    const n = normalizeHeader(k)
    return n === 'lane' || n === 'линия' || n === 'line' || n === 'команда'
  })
  if (!laneKey) return null
  const v = normalizeHeader(String(row[laneKey] ?? ''))
  if (['left', 'лево', 'левая', 'л', 'l'].includes(v)) return 'left'
  if (['center', 'центр', 'центральная', 'ц', 'c', 'm', 'mid'].includes(v)) return 'center'
  if (['right', 'право', 'правая', 'п', 'r'].includes(v)) return 'right'
  return null
}

function pickColors(row: Record<string, string>): HeroColor[] {
  const keys = Object.keys(row)
  const colorKey = keys.find((k) => {
    const n = normalizeHeader(k)
    return (
      n === 'colors' ||
      n === 'color' ||
      n === 'цвета' ||
      n === 'цвет' ||
      n === 'squad' ||
      n === 'состав' ||
      n === 'heroes' ||
      n === 'фракция'
    )
  })
  if (!colorKey) return []
  return parseSquadColors(row[colorKey])
}

export function parseRowsToPlayers(rows: Record<string, string>[]): Player[] {
  const players: Player[] = []
  for (const row of rows) {
    const nick = pickNick(row)
    const power = pickPower(row)
    if (!nick || power == null || power <= 0) continue
    players.push(createPlayer(nick, Math.round(power), pickColors(row)))
  }
  return players
}

export function parseCsvText(text: string): Player[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })
  return parseRowsToPlayers(parsed.data)
}

export async function parseRosterFile(file: File): Promise<Player[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = await file.text()
    return parseCsvText(text)
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]!]
    if (!sheet) return []
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
      defval: '',
      raw: false,
    })
    return parseRowsToPlayers(rows)
  }
  // try as csv
  const text = await file.text()
  return parseCsvText(text)
}

export async function parseOpponentFile(
  file: File,
): Promise<Partial<Record<LaneId, Player[]>>> {
  const name = file.name.toLowerCase()
  let rows: Record<string, string>[] = []

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]!]
    if (!sheet) return {}
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
  } else {
    const text = await file.text()
    rows = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    }).data
  }

  const byLane: Record<LaneId, Player[]> = {
    left: [],
    center: [],
    right: [],
  }
  let hasLaneCol = false

  for (const row of rows) {
    const lane = pickLane(row)
    const nick = pickNick(row)
    const power = pickPower(row)
    if (!nick || power == null || power <= 0) continue
    if (lane) {
      hasLaneCol = true
      byLane[lane].push(createPlayer(nick, Math.round(power), pickColors(row)))
    } else {
      byLane.left.push(createPlayer(nick, Math.round(power), pickColors(row)))
    }
  }

  if (!hasLaneCol) {
    // Без столбца линии — всё в left, пользователь разнесёт вручную
    return { left: byLane.left }
  }
  return byLane
}

export function playersToCsv(players: Player[], includeLane = false, lane?: LaneId): string {
  if (includeLane) {
    return Papa.unparse(
      players.map((p) => ({
        nick: p.nick,
        power: p.power,
        lane: lane ?? '',
        colors: p.squad.join(',') || '',
      })),
    )
  }
  return Papa.unparse(
    players.map((p) => ({
      nick: p.nick,
      power: p.power,
      colors: p.squad.join(',') || '',
    })),
  )
}

export function assignmentToCsv(
  assignment: Record<LaneId, Player[]>,
): string {
  const rows: { nick: string; power: number; lane: string; colors: string }[] = []
  for (const lane of LANE_IDS) {
    for (const p of assignment[lane]) {
      rows.push({
        nick: p.nick,
        power: p.power,
        lane,
        colors: p.squad.join(',') || '',
      })
    }
  }
  return Papa.unparse(rows)
}

export function formatPower(n: number): string {
  return n.toLocaleString('ru-RU')
}
