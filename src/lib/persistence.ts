import { BIOMES, RESOURCES, type Biome, type Resource } from './domain/cards'
import { MAX_PLAYERS, MIN_PLAYERS, REGION_POSITIONS, type Game, type Player } from './domain/game'

export const GAME_STORAGE_KEY = 'faraway-scorekeeper:game:v1'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

type UnknownRecord = Record<string, unknown>

interface StoredGame {
  version: 1
  game: Game
}

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isCounterRecord<Key extends string>(
  value: unknown,
  keys: readonly Key[],
): value is Record<Key, number> {
  return isRecord(value) && keys.every((key) => isNonNegativeInteger(value[key]))
}

function isStoredPlayer(value: unknown): value is Player {
  if (!isRecord(value) || !isRecord(value.sanctuary)) return false

  const sanctuary = value.sanctuary
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isCounterRecord<Resource>(sanctuary.resources, RESOURCES) &&
    isCounterRecord<Biome>(sanctuary.biomes, BIOMES) &&
    isNonNegativeInteger(sanctuary.clues) &&
    isNonNegativeInteger(sanctuary.nighttimeCards) &&
    isNonNegativeInteger(sanctuary.fame) &&
    Array.isArray(value.regions) &&
    value.regions.length === REGION_POSITIONS.length &&
    value.regions.every((regionId) => regionId === null || isNonNegativeInteger(regionId))
  )
}

function isStoredGame(value: unknown): value is Game {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !Array.isArray(value.players) ||
    value.players.length < MIN_PLAYERS ||
    value.players.length > MAX_PLAYERS ||
    !value.players.every(isStoredPlayer) ||
    (value.screen !== 'scoring' && value.screen !== 'results')
  ) {
    return false
  }

  const playerIds = value.players.map((player) => player.id)
  return (
    new Set(playerIds).size === playerIds.length &&
    typeof value.activePlayerId === 'string' &&
    playerIds.includes(value.activePlayerId)
  )
}

function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function saveGame(game: Game, storage: StorageLike | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(GAME_STORAGE_KEY, JSON.stringify({ version: 1, game } satisfies StoredGame))
    return true
  } catch {
    return false
  }
}

export function loadGame(storage: StorageLike | null = browserStorage()): Game | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(GAME_STORAGE_KEY)
    if (!raw) return null

    const stored: unknown = JSON.parse(raw)
    if (!isRecord(stored) || stored.version !== 1 || !isStoredGame(stored.game)) return null
    return stored.game
  } catch {
    return null
  }
}

export function clearGame(storage: StorageLike | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.removeItem(GAME_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
