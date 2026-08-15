import { BIOMES, RESOURCES, type Biome, type Resource } from './cards'

export const REGION_POSITIONS = [8, 7, 6, 5, 4, 3, 2, 1] as const
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 7

export type RegionSequence = [
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
]

export interface SanctuaryState {
  resources: Record<Resource, number>
  biomes: Record<Biome, number>
  clues: number
  nighttimeCards: number
  fame: number
}

export interface Player {
  id: string
  name: string
  sanctuary: SanctuaryState
  /** Scoring order: index 0 is the 8th Region played; index 7 is the 1st. */
  regions: RegionSequence
}

export interface Game {
  id: string
  players: Player[]
  activePlayerId: string | null
  screen: 'scoring' | 'results'
}

const zeroRecord = <T extends readonly string[]>(keys: T): Record<T[number], number> =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<T[number], number>

export function createSanctuaryState(): SanctuaryState {
  return {
    resources: zeroRecord(RESOURCES),
    biomes: zeroRecord(BIOMES),
    clues: 0,
    nighttimeCards: 0,
    fame: 0,
  }
}

export function createPlayer(name: string, id: string = createId()): Player {
  return {
    id,
    name: name.trim(),
    sanctuary: createSanctuaryState(),
    regions: [null, null, null, null, null, null, null, null],
  }
}

export function createGame(names: readonly string[], id: string = createId()): Game {
  const cleanedNames = names.map((name) => name.trim()).filter(Boolean)
  if (cleanedNames.length < MIN_PLAYERS || cleanedNames.length > MAX_PLAYERS) {
    throw new Error(`A game needs ${MIN_PLAYERS} to ${MAX_PLAYERS} players.`)
  }
  if (new Set(cleanedNames.map((name) => name.toLocaleLowerCase())).size !== cleanedNames.length) {
    throw new Error('Player names must be unique.')
  }

  const players = cleanedNames.map((name) => createPlayer(name))
  return {
    id,
    players,
    activePlayerId: players[0]?.id ?? null,
    screen: 'scoring',
  }
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
