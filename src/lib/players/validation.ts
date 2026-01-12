import { z } from "zod";

// Validation schema for creating a new player
export const newPlayerSchema = z.object({
  name: z
    .string()
    .min(1, "Player name is required")
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, "Player name cannot be empty after trimming"),
});

export type NewPlayerFormValues = z.infer<typeof newPlayerSchema>;

// Validation schema for adding an existing player to a season
export const addPlayerToSeasonSchema = z.object({
  playerId: z.string().uuid("Please select a valid player"),
});

export type AddPlayerToSeasonFormValues = z.infer<typeof addPlayerToSeasonSchema>;

/**
 * Check if a player is already in a season roster
 * @param existingPlayerIds - Set of player IDs already in the season
 * @param playerId - Player ID to check
 * @returns true if player is already in the season
 */
export function isPlayerInSeason(
  existingPlayerIds: Set<string>,
  playerId: string
): boolean {
  return existingPlayerIds.has(playerId);
}

/**
 * Validate that a player name is not empty after trimming
 * @param name - The player name to validate
 * @returns The trimmed name if valid, throws error if invalid
 */
export function validatePlayerName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("Player name cannot be empty");
  }
  return trimmed;
}
