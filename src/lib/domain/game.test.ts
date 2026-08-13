import { beforeEach, describe, expect, it } from 'vitest'
import { createRegionLookup, type RegionCardDefinition } from './cards'
import { createGame } from './game'
import { rankPlayers } from './ranking'
import { parseRegionInput, regionFieldKey, validateGameRegions } from './validation'
import { scoreRegionSequence } from './scoring'
import { loadGame, saveGame, type StorageLike } from '../persistence'

const cards = createRegionLookup([
  { id: 1, biome: 'forest', period: 'day', clues: 0, resources: {}, quest: { type: 'fixed', fame: 1 } },
  { id: 2, biome: 'city', period: 'night', clues: 0, resources: {}, quest: { type: 'fixed', fame: 2 } }
] satisfies readonly RegionCardDefinition[])

describe('game-wide Region validation', () => {
  it('rejects undefined cards and duplicates across players', () => {
    const game = createGame(['Alice', 'Bob'], 'game')
    game.players[0].regions[0] = 1
    game.players[1].regions[0] = 1
    game.players[1].regions[1] = 99
    const errors = validateGameRegions(game, cards)
    expect(errors.get(regionFieldKey(game.players[0].id, 0))?.type).toBe('duplicate')
    expect(errors.get(regionFieldKey(game.players[1].id, 0))?.type).toBe('duplicate')
    expect(errors.get(regionFieldKey(game.players[1].id, 1))?.type).toBe('undefined')
  })

  it('flags entries after a sequence gap', () => {
    const game = createGame(['Alice', 'Bob'], 'game')
    game.players[0].regions[1] = 2
    expect(validateGameRegions(game, cards).get(regionFieldKey(game.players[0].id, 1))?.type).toBe('gap')
  })

  it('rejects duplicates within one player and non-numeric input', () => {
    const game = createGame(['Alice', 'Bob'], 'game')
    game.players[0].regions[0] = 2
    game.players[0].regions[1] = 2
    const errors = validateGameRegions(game, cards)
    expect(errors.get(regionFieldKey(game.players[0].id, 0))?.type).toBe('duplicate')
    expect(errors.get(regionFieldKey(game.players[0].id, 1))?.type).toBe('duplicate')
    expect(parseRegionInput('two')).toBe('notNumeric')
    expect(parseRegionInput('')).toBe(null)
  })
})

describe('ranking', () => {
  it('sorts by Fame, then lower total Exploration Duration, and preserves exact ties', () => {
    const game = createGame(['Alice', 'Bob', 'Charlie'], 'game')
    game.players[0].regions[0] = 2
    game.players[1].regions[0] = 1
    game.players[2].regions[0] = 1
    const fame = new Map(game.players.map((player) => [player.id, 20]))
    const ranking = rankPlayers(game.players, fame)
    expect(ranking.map((entry) => entry.player.name)).toEqual(['Bob', 'Charlie', 'Alice'])
    expect(ranking.map((entry) => entry.rank)).toEqual([1, 1, 3])
    expect(ranking[0].tied).toBe(true)
  })

  it('always prioritizes higher Fame', () => {
    const game = createGame(['Alice', 'Bob'], 'game')
    const ranking = rankPlayers(game.players, new Map([[game.players[0].id, 12], [game.players[1].id, 15]]))
    expect(ranking[0].player.name).toBe('Bob')
  })
})

describe('persistence', () => {
  let memory: Map<string, string>
  let storage: StorageLike

  beforeEach(() => {
    memory = new Map()
    storage = {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => { memory.set(key, value) },
      removeItem: (key) => { memory.delete(key) }
    }
  })

  it('serializes and restores authoritative game state', () => {
    const game = createGame(['Alice', 'Bob'], 'game')
    game.players[0].sanctuary.fame = 7
    game.players[0].regions[0] = 1
    saveGame(game, storage)
    const restored = loadGame(storage)!
    expect(restored).toEqual(game)
    expect(scoreRegionSequence(restored.players[0].sanctuary, restored.players[0].regions, cards)).toMatchObject({
      regionFame: 1,
      sanctuaryFame: 7,
      totalFame: 8
    })
  })
})
