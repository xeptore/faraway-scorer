import { describe, expect, it } from 'vitest'
import { createRegionLookup, type RegionCardDefinition } from './cards'
import { createSanctuaryState, type RegionSequence } from './game'
import {
  addRegionToVisibleState,
  calculateQuest,
  checkPrerequisite,
  scoreRegion,
  scoreRegionSequence,
  visibleStateFromSanctuary,
} from './scoring'

const fixtures = [
  {
    id: 27,
    biome: 'forest',
    period: 'day',
    clues: 1,
    resources: { uddu: 1 },
    quest: { type: 'perCount', famePerItem: 2, targets: [{ kind: 'resource', resource: 'uddu' }] },
  },
  {
    id: 44,
    biome: 'city',
    period: 'night',
    clues: 0,
    resources: { okiko: 1 },
    prerequisite: { uddu: 1 },
    quest: { type: 'perCount', famePerItem: 3, targets: [{ kind: 'night' }] },
  },
  {
    id: 9,
    biome: 'mysticalHaven',
    period: 'night',
    clues: 1,
    resources: { goldlog: 1 },
    quest: {
      type: 'completeSet',
      famePerSet: 7,
      members: [
        { kind: 'resource', resource: 'uddu' },
        { kind: 'resource', resource: 'okiko' },
        { kind: 'resource', resource: 'goldlog' },
      ],
    },
  },
] satisfies readonly RegionCardDefinition[]

const lookup = createRegionLookup(fixtures)

describe('visible state', () => {
  it('starts from every Sanctuary contribution', () => {
    const sanctuary = createSanctuaryState()
    sanctuary.resources.uddu = 2
    sanctuary.biomes.river = 1
    sanctuary.clues = 3
    sanctuary.nighttimeCards = 2
    expect(visibleStateFromSanctuary(sanctuary)).toMatchObject({
      resources: { uddu: 2 },
      biomes: { river: 1 },
      clues: 3,
      nighttimeCards: 2,
    })
  })

  it('adds the current Region before it scores and keeps prior Regions visible', () => {
    let state = visibleStateFromSanctuary(createSanctuaryState())
    state = addRegionToVisibleState(state, fixtures[0])
    expect(scoreRegion(fixtures[0], state).fame).toBe(2)
    state = addRegionToVisibleState(state, fixtures[1])
    expect(state).toMatchObject({
      resources: { uddu: 1, okiko: 1 },
      biomes: { forest: 1, city: 1 },
      clues: 1,
      nighttimeCards: 1,
    })
  })
})

describe('prerequisites', () => {
  it('succeeds with no prerequisite and with an exact resource match', () => {
    const empty = visibleStateFromSanctuary(createSanctuaryState())
    expect(checkPrerequisite(fixtures[0], empty).satisfied).toBe(true)
    expect(
      checkPrerequisite(fixtures[1], { ...empty, resources: { ...empty.resources, uddu: 1 } })
        .satisfied,
    ).toBe(true)
  })

  it('reports every requirement and does not consume resources', () => {
    const card: RegionCardDefinition = {
      ...fixtures[0],
      prerequisite: { uddu: 2, goldlog: 1 },
    }
    const state = visibleStateFromSanctuary(createSanctuaryState())
    state.resources.uddu = 2
    const result = checkPrerequisite(card, state)
    expect(result.satisfied).toBe(false)
    expect(result.requirements).toEqual([
      { resource: 'uddu', required: 2, visible: 2, satisfied: true },
      { resource: 'goldlog', required: 1, visible: 0, satisfied: false },
    ])
    expect(state.resources.uddu).toBe(2)
    expect(checkPrerequisite(card, state).requirements[0].visible).toBe(2)
  })
})

describe('quest calculations', () => {
  const state = {
    resources: { uddu: 3, okiko: 2, goldlog: 1 },
    biomes: { desert: 1, forest: 2, river: 0, city: 2, mysticalHaven: 3 },
    clues: 4,
    nighttimeCards: 5,
  }

  it('calculates fixed Fame and returns zero when its prerequisite fails', () => {
    expect(calculateQuest({ type: 'fixed', fame: 12 }, state).fame).toBe(12)
    const card: RegionCardDefinition = {
      ...fixtures[0],
      prerequisite: { goldlog: 2 },
      quest: { type: 'fixed', fame: 12 },
    }
    expect(scoreRegion(card, state).fame).toBe(0)
  })

  it.each([
    [{ kind: 'resource', resource: 'okiko' } as const, 2],
    [{ kind: 'clue' } as const, 4],
    [{ kind: 'night' } as const, 5],
    [{ kind: 'biome', biome: 'forest' } as const, 2],
    [{ kind: 'biome', biome: 'mysticalHaven' } as const, 3],
  ])('counts %o', (target, count) => {
    const result = calculateQuest({ type: 'perCount', famePerItem: 3, targets: [target] }, state)
    expect(result.fame).toBe(count * 3)
  })

  it('sums multiple target biomes', () => {
    const result = calculateQuest(
      {
        type: 'perCount',
        famePerItem: 2,
        targets: [
          { kind: 'biome', biome: 'city' },
          { kind: 'biome', biome: 'desert' },
        ],
      },
      state,
    )
    expect(result.fame).toBe(6)
  })

  it('scores one and multiple complete resource sets', () => {
    const quest = fixtures[2].quest
    expect(calculateQuest(quest, state)).toMatchObject({ setCount: 1, fame: 7 })
    const twoSetState = { ...state, resources: { uddu: 3, okiko: 2, goldlog: 2 } }
    expect(calculateQuest(quest, twoSetState)).toMatchObject({ setCount: 2, fame: 14 })
  })
})

describe('incremental sequence scoring', () => {
  it('treats input one as the 8th played and input eight as the 1st', () => {
    const sequence: RegionSequence = [27, 44, 9, null, null, null, null, null]
    const score = scoreRegionSequence(createSanctuaryState(), sequence, lookup)
    expect(score.results.slice(0, 3).map((result) => result?.regionId)).toEqual([27, 44, 9])
    expect(score.results[1]?.visibleState.resources.uddu).toBe(1)
    expect(score.results[2]?.visibleState.resources.okiko).toBe(1)
    expect(score.results[2]?.fame).toBe(7)
  })

  it('stops at a missing or undefined position', () => {
    const gap: RegionSequence = [27, null, 9, null, null, null, null, null]
    expect(scoreRegionSequence(createSanctuaryState(), gap, lookup).scoredCount).toBe(1)
    const invalid: RegionSequence = [27, 999, 9, null, null, null, null, null]
    expect(scoreRegionSequence(createSanctuaryState(), invalid, lookup).scoredCount).toBe(1)
  })

  it('recomputes later cards when an earlier Region changes', () => {
    const before: RegionSequence = [27, 44, 9, null, null, null, null, null]
    const after: RegionSequence = [44, 27, 9, null, null, null, null, null]
    const first = scoreRegionSequence(createSanctuaryState(), before, lookup)
    const corrected = scoreRegionSequence(createSanctuaryState(), after, lookup)
    expect(first.results[0]?.fame).toBe(2)
    expect(corrected.results[0]?.fame).toBe(0)
    expect(corrected.totalFame).not.toBe(first.totalFame)
  })
})
