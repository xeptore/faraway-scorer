import {
  BIOMES,
  RESOURCES,
  type Biome,
  type CountTarget,
  type FameQuest,
  type RegionCardDefinition,
  type RegionCardLookup,
  type Resource
} from './cards'
import type { RegionSequence, SanctuaryState } from './game'

export interface VisibleState {
  resources: Record<Resource, number>
  biomes: Record<Biome, number>
  clues: number
  nighttimeCards: number
}

export interface ResourceRequirementResult {
  resource: Resource
  required: number
  visible: number
  satisfied: boolean
}

export type PrerequisiteResult =
  | { type: 'none'; satisfied: true; requirements: readonly [] }
  | { type: 'resources'; satisfied: boolean; requirements: readonly ResourceRequirementResult[] }

export interface TargetMatch {
  target: CountTarget
  count: number
}

export type FameCalculation =
  | { type: 'fixed'; fame: number }
  | {
      type: 'perCount'
      famePerItem: number
      matches: readonly TargetMatch[]
      totalCount: number
      fame: number
    }
  | {
      type: 'completeSet'
      famePerSet: number
      setCount: number
      members: readonly TargetMatch[]
      fame: number
    }

export interface RegionScoreResult {
  regionId: number
  fame: number
  prerequisite: PrerequisiteResult
  calculation: FameCalculation
  visibleState: VisibleState
}

export interface SequenceScore {
  results: readonly (RegionScoreResult | null)[]
  regionFame: number
  sanctuaryFame: number
  totalFame: number
  scoredCount: number
  enteredCount: number
  complete: boolean
}

const zeroRecord = <T extends readonly string[]>(keys: T): Record<T[number], number> =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<T[number], number>

export function visibleStateFromSanctuary(sanctuary: SanctuaryState): VisibleState {
  return {
    resources: { ...zeroRecord(RESOURCES), ...sanctuary.resources },
    biomes: { ...zeroRecord(BIOMES), ...sanctuary.biomes },
    clues: sanctuary.clues,
    nighttimeCards: sanctuary.nighttimeCards
  }
}

export function addRegionToVisibleState(state: VisibleState, card: RegionCardDefinition): VisibleState {
  const resources = { ...state.resources }
  for (const resource of RESOURCES) resources[resource] += card.resources[resource] ?? 0

  return {
    resources,
    biomes: { ...state.biomes, [card.biome]: state.biomes[card.biome] + 1 },
    clues: state.clues + card.clues,
    nighttimeCards: state.nighttimeCards + (card.period === 'night' ? 1 : 0)
  }
}

export function checkPrerequisite(
  card: RegionCardDefinition,
  state: VisibleState
): PrerequisiteResult {
  if (!card.prerequisite || Object.keys(card.prerequisite).length === 0) {
    return { type: 'none', satisfied: true, requirements: [] }
  }

  const requirements = RESOURCES.flatMap((resource) => {
    const required = card.prerequisite?.[resource]
    if (required === undefined) return []
    const visible = state.resources[resource]
    return [{ resource, required, visible, satisfied: visible >= required }]
  })

  return {
    type: 'resources',
    satisfied: requirements.every((requirement) => requirement.satisfied),
    requirements
  }
}

export function countTarget(target: CountTarget, state: VisibleState): number {
  switch (target.kind) {
    case 'resource':
      return state.resources[target.resource]
    case 'biome':
      return state.biomes[target.biome]
    case 'clue':
      return state.clues
    case 'night':
      return state.nighttimeCards
  }
}

export function calculateQuest(quest: FameQuest, state: VisibleState): FameCalculation {
  switch (quest.type) {
    case 'fixed':
      return { type: 'fixed', fame: quest.fame }
    case 'perCount': {
      const matches = quest.targets.map((target) => ({ target, count: countTarget(target, state) }))
      const totalCount = matches.reduce((sum, match) => sum + match.count, 0)
      return {
        type: 'perCount',
        famePerItem: quest.famePerItem,
        matches,
        totalCount,
        fame: totalCount * quest.famePerItem
      }
    }
    case 'completeSet': {
      const members = quest.members.map((target) => ({ target, count: countTarget(target, state) }))
      const setCount = members.length === 0 ? 0 : Math.min(...members.map((member) => member.count))
      return {
        type: 'completeSet',
        famePerSet: quest.famePerSet,
        setCount,
        members,
        fame: setCount * quest.famePerSet
      }
    }
  }
}

export function scoreRegion(card: RegionCardDefinition, visibleState: VisibleState): RegionScoreResult {
  const prerequisite = checkPrerequisite(card, visibleState)
  const calculation = calculateQuest(card.quest, visibleState)
  return {
    regionId: card.id,
    fame: prerequisite.satisfied ? calculation.fame : 0,
    prerequisite,
    calculation,
    visibleState
  }
}

export function scoreRegionSequence(
  sanctuary: SanctuaryState,
  sequence: RegionSequence,
  cards: RegionCardLookup
): SequenceScore {
  let state = visibleStateFromSanctuary(sanctuary)
  const results: (RegionScoreResult | null)[] = Array(8).fill(null)
  let stopped = false

  for (let index = 0; index < sequence.length; index += 1) {
    const regionId = sequence[index]
    const card = regionId === null ? undefined : cards.get(regionId)
    if (stopped || !card) {
      stopped = true
      continue
    }

    state = addRegionToVisibleState(state, card)
    results[index] = scoreRegion(card, state)
  }

  const regionFame = results.reduce<number>((sum, result) => sum + (result?.fame ?? 0), 0)
  const scoredCount = results.filter(Boolean).length
  const enteredCount = sequence.filter((id) => id !== null).length
  return {
    results,
    regionFame,
    sanctuaryFame: sanctuary.fame,
    totalFame: regionFame + sanctuary.fame,
    scoredCount,
    enteredCount,
    complete: scoredCount === 8
  }
}
