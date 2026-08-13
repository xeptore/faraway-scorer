import type { RegionCardDefinition } from '../domain/cards'

/**
 * Production Region dataset.
 *
 * Enter the official cards manually here. The app deliberately ships without
 * official card data. `satisfies` keeps every entry fully type-checked while
 * preserving useful literal types and compact object syntax.
 *
 * Supported quest shapes:
 *
 * { type: 'fixed', fame: 8 }
 *
 * { type: 'perCount', famePerItem: 3, targets: [
 *   { kind: 'resource', resource: 'uddu' },
 *   { kind: 'biome', biome: 'mysticalHaven' },
 *   { kind: 'clue' },
 *   { kind: 'night' }
 * ] }
 *
 * { type: 'completeSet', famePerSet: 7, members: [
 *   { kind: 'resource', resource: 'uddu' },
 *   { kind: 'resource', resource: 'okiko' },
 *   { kind: 'resource', resource: 'goldlog' }
 * ] }
 *
 * A full card example:
 *
 * {
 *   id: 42,
 *   biome: 'forest',
 *   period: 'night',
 *   clues: 0,
 *   resources: { uddu: 1 },
 *   prerequisite: { uddu: 2, goldlog: 1 },
 *   quest: {
 *     type: 'perCount',
 *     famePerItem: 4,
 *     targets: [{ kind: 'resource', resource: 'okiko' }]
 *   }
 * }
 */
export const REGION_CARDS = [] satisfies readonly RegionCardDefinition[]
