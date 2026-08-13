import type { Game } from './domain/game'

const STORAGE_KEY = 'faraway-scorekeeper:game:v1'

interface StoredGame {
  version: 1
  game: Game
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function storage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function saveGame(game: Game | null, target: StorageLike | null = storage()): void {
  const local = target
  if (!local) return
  if (game === null) {
    local.removeItem(STORAGE_KEY)
    return
  }
  local.setItem(STORAGE_KEY, JSON.stringify({ version: 1, game } satisfies StoredGame))
}

export function loadGame(target: StorageLike | null = storage()): Game | null {
  const local = target
  if (!local) return null
  try {
    const raw = local.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredGame
    if (stored.version !== 1 || !stored.game || !Array.isArray(stored.game.players)) return null
    return stored.game
  } catch {
    return null
  }
}

export function clearGame(target: StorageLike | null = storage()): void {
  saveGame(null, target)
}
