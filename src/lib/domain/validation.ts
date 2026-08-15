import type { RegionCardLookup } from './cards'
import type { Game } from './game'

export type RegionValidationError =
  | { type: 'notNumeric'; message: string }
  | { type: 'undefined'; regionId: number; message: string }
  | { type: 'duplicate'; regionId: number; ownerName: string; message: string }
  | { type: 'gap'; message: string }

export type RegionValidationMap = ReadonlyMap<string, RegionValidationError>

export function regionFieldKey(playerId: string, position: number): string {
  return `${playerId}:${position}`
}

export function parseRegionInput(value: string): number | null | 'notNumeric' {
  const trimmed = value.trim()
  if (trimmed === '') return null
  if (!/^\d+$/.test(trimmed)) return 'notNumeric'
  const parsed = Number(trimmed)
  return Number.isSafeInteger(parsed) ? parsed : 'notNumeric'
}

export function validateGameRegions(game: Game, cards: RegionCardLookup): RegionValidationMap {
  const errors = new Map<string, RegionValidationError>()
  const occurrences = new Map<number, { playerId: string; position: number; ownerName: string }[]>()

  for (const player of game.players) {
    let foundGap = false
    player.regions.forEach((regionId, position) => {
      const key = regionFieldKey(player.id, position)
      if (regionId === null) {
        foundGap = true
        return
      }

      const entries = occurrences.get(regionId) ?? []
      entries.push({ playerId: player.id, position, ownerName: player.name })
      occurrences.set(regionId, entries)

      if (!cards.has(regionId)) {
        errors.set(key, {
          type: 'undefined',
          regionId,
          message: `Region #${regionId} is not defined in the card dataset.`,
        })
      } else if (foundGap) {
        errors.set(key, {
          type: 'gap',
          message: 'Complete the earlier journey position first.',
        })
      }
    })
  }

  for (const [regionId, entries] of occurrences) {
    if (entries.length < 2) continue
    for (const entry of entries) {
      const other = entries.find(
        (candidate) =>
          candidate.playerId !== entry.playerId || candidate.position !== entry.position,
      )!
      errors.set(regionFieldKey(entry.playerId, entry.position), {
        type: 'duplicate',
        regionId,
        ownerName: other.ownerName,
        message:
          other.playerId === entry.playerId
            ? `Region #${regionId} is already in ${entry.ownerName}'s journey.`
            : `Already entered for ${other.ownerName}.`,
      })
    }
  }

  return errors
}
