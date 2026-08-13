export const RESOURCES = ['uddu', 'okiko', 'goldlog'] as const
export type Resource = (typeof RESOURCES)[number]

export const BIOMES = ['desert', 'forest', 'river', 'city', 'mysticalHaven'] as const
export type Biome = (typeof BIOMES)[number]

export type ExplorationPeriod = 'day' | 'night'
export type ResourcePrerequisite = Partial<Record<Resource, number>>

export type CountTarget =
  | { kind: 'resource'; resource: Resource }
  | { kind: 'biome'; biome: Biome }
  | { kind: 'clue' }
  | { kind: 'night' }

export type FameQuest =
  | { type: 'fixed'; fame: number }
  | { type: 'perCount'; famePerItem: number; targets: readonly CountTarget[] }
  | { type: 'completeSet'; famePerSet: number; members: readonly CountTarget[] }

export interface RegionCardDefinition {
  /** Exploration Duration printed on the Region; this is also its unique card number. */
  id: number
  biome: Biome
  period: ExplorationPeriod
  clues: number
  resources: Partial<Record<Resource, number>>
  prerequisite?: ResourcePrerequisite
  quest: FameQuest
}

export type RegionCardLookup = ReadonlyMap<number, RegionCardDefinition>

export function createRegionLookup(cards: readonly RegionCardDefinition[]): RegionCardLookup {
  return new Map(cards.map((card) => [card.id, card]))
}
