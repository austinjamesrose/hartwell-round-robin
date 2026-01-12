import { normalizePlayerName } from "./validation";

/**
 * Parses a text input containing player names into an array of normalized names.
 * Splits on both newlines and commas, trims whitespace, and filters empty entries.
 *
 * @param input - Raw text input with player names (newline or comma separated)
 * @returns Array of normalized player names
 */
export function parsePlayerNames(input: string): string[] {
  // Split on newlines and commas
  const rawNames = input.split(/[\n,]+/);

  // Normalize each name (trim and collapse multiple spaces), filter empty
  const names = rawNames
    .map((name) => normalizePlayerName(name))
    .filter((name) => name.length > 0);

  return names;
}

/**
 * Represents an existing player with their ID and name.
 */
export interface ExistingPlayer {
  id: string;
  name: string;
}

/**
 * Result of checking for duplicate player names.
 */
export interface DuplicateCheckResult {
  /** Names that already exist in the player pool */
  duplicates: string[];
  /** Names that are new (don't exist in the player pool) */
  newNames: string[];
}

/**
 * Finds which names from a list already exist in the player pool.
 * Uses case-insensitive comparison with normalized names.
 *
 * @param names - Array of player names to check
 * @param existingPlayers - Array of existing players to check against
 * @returns Object with arrays of duplicate and new names
 */
export function findDuplicates(
  names: string[],
  existingPlayers: ExistingPlayer[]
): DuplicateCheckResult {
  // Create a Set of normalized existing player names (lowercase) for O(1) lookup
  const existingNamesSet = new Set(
    existingPlayers.map((p) => normalizePlayerName(p.name).toLowerCase())
  );

  const duplicates: string[] = [];
  const newNames: string[] = [];

  for (const name of names) {
    const normalizedLower = normalizePlayerName(name).toLowerCase();
    if (existingNamesSet.has(normalizedLower)) {
      duplicates.push(name);
    } else {
      newNames.push(name);
    }
  }

  return { duplicates, newNames };
}

/**
 * Gets the existing player record that matches a given name (case-insensitive).
 *
 * @param name - Name to find
 * @param existingPlayers - Array of existing players to search
 * @returns The matching player or undefined
 */
export function findExistingPlayer(
  name: string,
  existingPlayers: ExistingPlayer[]
): ExistingPlayer | undefined {
  const normalizedLower = normalizePlayerName(name).toLowerCase();
  return existingPlayers.find(
    (p) => normalizePlayerName(p.name).toLowerCase() === normalizedLower
  );
}

/**
 * Generates a preview summary for the bulk import.
 *
 * @param totalNames - Total number of names parsed
 * @param duplicateCount - Number of duplicates found
 * @returns Human-readable summary string
 */
export function getImportPreviewSummary(
  totalNames: number,
  duplicateCount: number
): string {
  const newCount = totalNames - duplicateCount;

  if (totalNames === 0) {
    return "No player names found";
  }

  if (duplicateCount === 0) {
    return `${totalNames} player${totalNames !== 1 ? "s" : ""} will be added`;
  }

  if (newCount === 0) {
    return `All ${duplicateCount} player${duplicateCount !== 1 ? "s" : ""} already exist`;
  }

  return `${newCount} new player${newCount !== 1 ? "s" : ""} will be added, ${duplicateCount} already exist`;
}
