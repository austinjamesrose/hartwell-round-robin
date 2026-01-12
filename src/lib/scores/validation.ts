// Score validation for pickleball games
// Valid scores: exactly one team must score 11, the other team must score 0-10

/**
 * Represents a score validation result
 */
export interface ScoreValidationResult {
  valid: boolean;
  error: string | null;
}

/**
 * Minimum winning score in pickleball
 */
export const WINNING_SCORE = 11;

/**
 * Maximum losing score (must be strictly less than winning score)
 */
export const MAX_LOSING_SCORE = 10;

/**
 * Validates a pickleball game score
 *
 * Rules:
 * - Both scores are required
 * - Exactly one team must score 11 (winning score)
 * - The other team must score 0-10
 *
 * @param team1Score - Score for team 1
 * @param team2Score - Score for team 2
 * @returns Validation result with valid flag and optional error message
 */
export function validateScore(
  team1Score: number | null | undefined,
  team2Score: number | null | undefined
): ScoreValidationResult {
  // Check both scores are provided
  if (team1Score === null || team1Score === undefined) {
    return { valid: false, error: "Team 1 score is required" };
  }
  if (team2Score === null || team2Score === undefined) {
    return { valid: false, error: "Team 2 score is required" };
  }

  // Check scores are non-negative integers
  if (!Number.isInteger(team1Score) || team1Score < 0) {
    return { valid: false, error: "Team 1 score must be a non-negative integer" };
  }
  if (!Number.isInteger(team2Score) || team2Score < 0) {
    return { valid: false, error: "Team 2 score must be a non-negative integer" };
  }

  // Check for scores exceeding the maximum
  if (team1Score > WINNING_SCORE || team2Score > WINNING_SCORE) {
    return { valid: false, error: "Scores cannot exceed 11" };
  }

  // Special case: both teams scored 11 (invalid - only one winner allowed)
  if (team1Score === WINNING_SCORE && team2Score === WINNING_SCORE) {
    return { valid: false, error: "Both teams cannot score 11" };
  }

  // Check for valid pickleball score combinations
  // One team must score exactly 11, the other must score 0-10
  const team1Won = team1Score === WINNING_SCORE && team2Score <= MAX_LOSING_SCORE;
  const team2Won = team2Score === WINNING_SCORE && team1Score <= MAX_LOSING_SCORE;

  // Exactly one team must win
  if (!team1Won && !team2Won) {
    return { valid: false, error: "Exactly one team must score 11" };
  }

  return { valid: true, error: null };
}

/**
 * Determines the winning team based on scores
 *
 * @param team1Score - Score for team 1
 * @param team2Score - Score for team 2
 * @returns 1 if team 1 won, 2 if team 2 won, null if scores are invalid
 */
export function getWinningTeam(
  team1Score: number | null | undefined,
  team2Score: number | null | undefined
): 1 | 2 | null {
  const validation = validateScore(team1Score, team2Score);
  if (!validation.valid) {
    return null;
  }

  // At this point we know scores are valid - exactly one team has 11
  return team1Score === WINNING_SCORE ? 1 : 2;
}

/**
 * Parses a score string input to a number
 * Returns null if the input is empty or invalid
 *
 * @param input - String input from score field
 * @returns Parsed number or null
 */
export function parseScoreInput(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") {
    return null;
  }

  const parsed = parseInt(trimmed, 10);
  if (isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}
