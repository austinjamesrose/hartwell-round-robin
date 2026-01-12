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

/**
 * Counts how many games are missing scores
 * A game is missing a score if team1_score or team2_score is null
 *
 * @param games - Array of games with score fields
 * @returns Number of games missing scores
 */
export function countGamesMissingScores(
  games: { team1_score: number | null; team2_score: number | null }[]
): number {
  return games.filter(
    (game) => game.team1_score === null || game.team2_score === null
  ).length;
}

/**
 * Checks if a week can be marked as complete
 * A week can be marked complete if it is finalized (not draft)
 *
 * @param weekStatus - Current status of the week
 * @param totalGames - Total number of games in the week
 * @param gamesWithScoresCount - Number of games that have scores entered
 * @returns Object with canMarkComplete boolean, hasMissingScores flag, and counts
 */
export function canMarkWeekComplete(
  weekStatus: "draft" | "finalized" | "completed",
  totalGames: number,
  gamesWithScoresCount: number
): {
  canMarkComplete: boolean;
  hasMissingScores: boolean;
  missingScoresCount: number;
  errorMessage: string | null;
} {
  // Can only mark complete if week is finalized
  if (weekStatus === "draft") {
    return {
      canMarkComplete: false,
      hasMissingScores: false,
      missingScoresCount: 0,
      errorMessage: "Cannot mark complete - week must be finalized first",
    };
  }

  if (weekStatus === "completed") {
    return {
      canMarkComplete: false,
      hasMissingScores: false,
      missingScoresCount: 0,
      errorMessage: "Week is already complete",
    };
  }

  const missingScoresCount = totalGames - gamesWithScoresCount;
  const hasMissingScores = missingScoresCount > 0;

  // Week can be marked complete even with missing scores (just show warning)
  return {
    canMarkComplete: true,
    hasMissingScores,
    missingScoresCount,
    errorMessage: null,
  };
}
