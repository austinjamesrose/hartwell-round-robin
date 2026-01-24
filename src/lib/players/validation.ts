import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { loggers } from "@/lib/logger";

// Validation schema for creating a new player
export const newPlayerSchema = z.object({
  name: z
    .string()
    .min(1, "Player name is required")
    .transform((val) => sanitizePlayerName(val))
    .refine((val) => val.length > 0, "Player name cannot be empty after sanitization"),
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
 * Validate that a player name is not empty after sanitization
 * @param name - The player name to validate
 * @returns The sanitized name if valid, throws error if invalid
 */
export function validatePlayerName(name: string): string {
  const sanitized = sanitizePlayerName(name);
  if (sanitized.length === 0) {
    throw new Error("Player name cannot be empty");
  }
  return sanitized;
}

/**
 * Result of checking if a player can be removed from a season
 */
export interface PlayerRemovalCheck {
  canRemove: boolean;
  gameCount: number;
  message: string;
}

/**
 * Check if a player can be removed from a season based on game history.
 * A player cannot be removed if they have any recorded games in the season.
 *
 * @param gameCount - Number of games the player has in this season
 * @returns Object with canRemove flag, gameCount, and message
 */
export function checkPlayerRemoval(gameCount: number): PlayerRemovalCheck {
  if (gameCount > 0) {
    return {
      canRemove: false,
      gameCount,
      message: `Player has ${gameCount} game${gameCount !== 1 ? "s" : ""} recorded`,
    };
  }

  return {
    canRemove: true,
    gameCount: 0,
    message: "Player can be removed from this season",
  };
}

/**
 * Result of validating a player name for uniqueness.
 */
export type PlayerNameValidationResult = {
  valid: boolean;
  error?: string;
  existingPlayer?: { id: string; name: string };
};

/**
 * Sanitizes a player name for defense-in-depth security.
 * Strips HTML tags, control characters, and normalizes whitespace.
 *
 * @param name - The raw player name input
 * @returns The sanitized name
 */
export function sanitizePlayerName(name: string): string {
  return (
    name
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove control characters (ASCII 0-31 and 127, except whitespace)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize different types of whitespace to regular space
      .replace(/[\t\n\r\f\v]+/g, " ")
      // Collapse multiple spaces
      .replace(/\s+/g, " ")
      // Trim leading/trailing whitespace
      .trim()
  );
}

/**
 * Normalizes a player name by sanitizing and then applying standard normalization.
 * This provides consistent formatting across the application.
 *
 * @param name - The player name to normalize
 * @returns The normalized name
 */
export function normalizePlayerName(name: string): string {
  // Use sanitizePlayerName which handles all normalization
  return sanitizePlayerName(name);
}

/**
 * Validates that a player name is unique within the admin's player pool.
 * Uses case-insensitive comparison, trims whitespace, and collapses multiple spaces.
 *
 * @param name - The player name to validate
 * @param adminId - The admin's user ID to scope the check
 * @returns Promise with validation result including existing player info if found
 */
export async function validatePlayerNameForDuplicate(
  name: string,
  adminId: string
): Promise<PlayerNameValidationResult> {
  // Normalize the name: trim and collapse multiple spaces
  const normalizedName = normalizePlayerName(name);

  // Empty names are handled by the schema, but we check just in case
  if (!normalizedName) {
    return { valid: false, error: "Player name is required" };
  }

  const supabase = createClient();

  // Query for existing players with matching name (case-insensitive)
  // Using ilike for case-insensitive matching
  const { data: existingPlayers, error } = await supabase
    .from("players")
    .select("id, name")
    .eq("admin_id", adminId)
    .ilike("name", normalizedName);

  if (error) {
    // If there's a database error, we'll let the form proceed
    // and catch the duplicate at insert time
    loggers.validation.error("Error checking player name uniqueness", error, { adminId });
    return { valid: true };
  }

  // Check if any existing player has the same name (case-insensitive, with normalized spaces)
  const duplicate = existingPlayers?.find(
    (player) =>
      normalizePlayerName(player.name).toLowerCase() ===
      normalizedName.toLowerCase()
  );

  if (duplicate) {
    return {
      valid: false,
      error: "A player with this name already exists",
      existingPlayer: duplicate,
    };
  }

  return { valid: true };
}
