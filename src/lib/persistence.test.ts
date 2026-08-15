import { describe, expect, it } from 'vitest'
import { createGame, type Game } from './domain/game'
import { clearGame, GAME_STORAGE_KEY, loadGame, saveGame, type StorageLike } from './persistence'

class MemoryStorage implements StorageLike {
  protected values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

class ThrowingStorage extends MemoryStorage {
  constructor(private operation: 'get' | 'set' | 'remove') {
    super()
  }

  override getItem(key: string): string | null {
    if (this.operation === 'get') throw new DOMException('Storage blocked')
    return super.getItem(key)
  }

  override setItem(key: string, value: string): void {
    if (this.operation === 'set') throw new DOMException('Quota exceeded')
    super.setItem(key, value)
  }

  override removeItem(key: string): void {
    if (this.operation === 'remove') throw new DOMException('Storage blocked')
    super.removeItem(key)
  }
}

function validGame(): Game {
  const game = createGame(['Ada', 'Grace'], 'game')
  game.players[0].sanctuary.fame = 7
  game.players[0].regions[0] = 1
  return game
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function storeValue(storage: StorageLike, value: unknown): void {
  storage.setItem(GAME_STORAGE_KEY, JSON.stringify({ version: 1, game: value }))
}

describe('game persistence', () => {
  it('round-trips and clears a valid game', () => {
    const storage = new MemoryStorage()
    const game = validGame()

    expect(saveGame(game, storage)).toBe(true)
    expect(loadGame(storage)).toEqual(game)
    expect(clearGame(storage)).toBe(true)
    expect(loadGame(storage)).toBeNull()
  })

  it.each([
    ['get', () => loadGame(new ThrowingStorage('get'))],
    ['set', () => saveGame(validGame(), new ThrowingStorage('set'))],
    ['remove', () => clearGame(new ThrowingStorage('remove'))],
  ] as const)('handles failed %s operations without throwing', (_operation, run) => {
    expect(run()).toBeFalsy()
  })

  it.each<[string, (game: Record<string, unknown>) => void]>([
    ['an invalid screen', (game) => (game.screen = 'setup')],
    ['a missing active player', (game) => (game.activePlayerId = 'missing')],
    ['too few players', (game) => (game.players = [])],
    [
      'duplicate player IDs',
      (game) => {
        const players = game.players as Record<string, unknown>[]
        players[1].id = players[0].id
      },
    ],
  ])('rejects a game with %s', (_label, mutate) => {
    const storage = new MemoryStorage()
    const candidate = clone(validGame()) as unknown as Record<string, unknown>
    mutate(candidate)
    storeValue(storage, candidate)

    expect(loadGame(storage)).toBeNull()
  })

  it.each<[string, (player: Record<string, unknown>) => void]>([
    ['a blank name', (player) => (player.name = ' ')],
    [
      'an invalid Sanctuary counter',
      (player) => ((player.sanctuary as Record<string, unknown>).fame = -1),
    ],
    ['a malformed Region sequence', (player) => (player.regions = [1, null])],
  ])('rejects a player with %s', (_label, mutate) => {
    const storage = new MemoryStorage()
    const candidate = clone(validGame()) as unknown as Record<string, unknown>
    mutate((candidate.players as Record<string, unknown>[])[0])
    storeValue(storage, candidate)

    expect(loadGame(storage)).toBeNull()
  })

  it('rejects malformed JSON and unknown storage versions', () => {
    const storage = new MemoryStorage()
    storage.setItem(GAME_STORAGE_KEY, '{not json')
    expect(loadGame(storage)).toBeNull()

    storage.setItem(GAME_STORAGE_KEY, JSON.stringify({ version: 2, game: validGame() }))
    expect(loadGame(storage)).toBeNull()
  })
})
