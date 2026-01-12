/**
 * Validation logic for week operations
 */

/**
 * Checks if a week can be unfinalized
 * A week cannot be unfinalized if any games have scores recorded
 *
 * @param gamesWithScoresCount - Number of games that have scores entered
 * @returns Object with canUnfinalize boolean and optional error message
 */
export function canUnfinalizeWeek(gamesWithScoresCount: number): {
  canUnfinalize: boolean;
  errorMessage: string | null;
} {
  if (gamesWithScoresCount > 0) {
    return {
      canUnfinalize: false,
      errorMessage: `Cannot unfinalize - ${gamesWithScoresCount} ${
        gamesWithScoresCount === 1 ? "score has" : "scores have"
      } already been recorded`,
    };
  }

  return {
    canUnfinalize: true,
    errorMessage: null,
  };
}

/**
 * Counts how many games have scores recorded
 * A game has a score if both team1_score and team2_score are not null
 *
 * @param games - Array of games with score fields
 * @returns Number of games with scores
 */
export function countGamesWithScores(
  games: { team1_score: number | null; team2_score: number | null }[]
): number {
  return games.filter(
    (game) => game.team1_score !== null && game.team2_score !== null
  ).length;
}
