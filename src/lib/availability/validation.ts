// Availability validation helpers
// These functions handle validation logic for player availability

/**
 * Minimum number of players required to generate a valid schedule
 * With 6 courts and 4 players per court, we need at least 24 players
 */
export const MIN_AVAILABLE_PLAYERS = 24;

/**
 * Maximum number of players that can be scheduled
 * More than 32 players makes scheduling with 8 games per player difficult
 */
export const MAX_AVAILABLE_PLAYERS = 32;

/**
 * Checks if the number of available players is within the valid range
 * @param count - Number of available players
 * @returns Object with validation result and message
 */
export function validateAvailableCount(count: number): {
  isValid: boolean;
  status: "valid" | "too_few" | "too_many";
  message: string;
} {
  if (count < MIN_AVAILABLE_PLAYERS) {
    return {
      isValid: false,
      status: "too_few",
      message: `Need at least ${MIN_AVAILABLE_PLAYERS} available players (currently ${count})`,
    };
  }

  if (count > MAX_AVAILABLE_PLAYERS) {
    return {
      isValid: false,
      status: "too_many",
      message: `Maximum ${MAX_AVAILABLE_PLAYERS} available players allowed (currently ${count})`,
    };
  }

  return {
    isValid: true,
    status: "valid",
    message: `${count} players available`,
  };
}

/**
 * Checks if the count is exactly at the boundary (for warning states)
 * @param count - Number of available players
 * @returns True if count is at the boundary (24 or 32)
 */
export function isAtBoundary(count: number): boolean {
  return count === MIN_AVAILABLE_PLAYERS || count === MAX_AVAILABLE_PLAYERS;
}

/**
 * Gets a warning message if the count is close to the boundary
 * @param count - Number of available players
 * @returns Warning message or null if no warning needed
 */
export function getAvailabilityWarning(count: number): string | null {
  if (count >= MIN_AVAILABLE_PLAYERS && count <= MIN_AVAILABLE_PLAYERS + 2) {
    return `Close to minimum (${MIN_AVAILABLE_PLAYERS}). Consider having backups.`;
  }

  if (count >= MAX_AVAILABLE_PLAYERS - 2 && count <= MAX_AVAILABLE_PLAYERS) {
    return `Close to maximum (${MAX_AVAILABLE_PLAYERS}). Some players may get extra byes.`;
  }

  return null;
}
