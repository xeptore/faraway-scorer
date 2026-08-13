import type { Biome, CountTarget, Resource } from './cards'

export const RESOURCE_LABELS: Record<Resource, string> = {
  uddu: 'Uddu',
  okiko: 'Okiko',
  goldlog: 'Goldlog'
}

export const BIOME_LABELS: Record<Biome, string> = {
  desert: 'Desert',
  forest: 'Forest',
  river: 'River',
  city: 'City',
  mysticalHaven: 'Mystical Haven'
}

export function targetLabel(target: CountTarget): string {
  switch (target.kind) {
    case 'resource':
      return RESOURCE_LABELS[target.resource]
    case 'biome':
      return BIOME_LABELS[target.biome]
    case 'clue':
      return 'Clue'
    case 'night':
      return 'Nighttime card'
  }
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural
}
