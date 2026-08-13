import type { Player } from './game'

export interface RankedPlayer {
  player: Player
  fame: number
  explorationDuration: number
  rank: number
  tied: boolean
}

export function explorationDuration(player: Player): number {
  return player.regions.reduce<number>((sum, id) => sum + (id ?? 0), 0)
}

/** Official tie-break: lowest total Exploration Duration among tied players. */
export function rankPlayers(
  players: readonly Player[],
  fameByPlayer: ReadonlyMap<string, number>
): RankedPlayer[] {
  const sorted = players
    .map((player) => ({
      player,
      fame: fameByPlayer.get(player.id) ?? 0,
      explorationDuration: explorationDuration(player)
    }))
    .sort((a, b) => b.fame - a.fame || a.explorationDuration - b.explorationDuration)

  return sorted.map((entry, index) => {
    const previous = sorted[index - 1]
    const sameAsPrevious =
      previous !== undefined &&
      previous.fame === entry.fame &&
      previous.explorationDuration === entry.explorationDuration
    const firstMatchingIndex = sorted.findIndex(
      (candidate) =>
        candidate.fame === entry.fame && candidate.explorationDuration === entry.explorationDuration
    )
    const tied = sorted.some(
      (candidate, candidateIndex) =>
        candidateIndex !== index &&
        candidate.fame === entry.fame &&
        candidate.explorationDuration === entry.explorationDuration
    )
    return {
      ...entry,
      rank: sameAsPrevious ? firstMatchingIndex + 1 : index + 1,
      tied
    }
  })
}
