// Swap validation and logic for manual schedule adjustments
// Allows admin to swap players within the same round

import { partnershipKey } from "./generateSchedule";

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a player's position in the schedule for a given round
 */
export interface PlayerPosition {
  playerId: string;
  location:
    | { type: "game"; gameId: string; team: 1 | 2; position: 1 | 2 }
    | { type: "bye" };
}

/**
 * Represents a game in the schedule (simplified for swap operations)
 */
export interface SwapGame {
  id: string;
  roundNumber: number;
  team1Player1Id: string;
  team1Player2Id: string;
  team2Player1Id: string;
  team2Player2Id: string;
}

/**
 * Result of validating a swap
 */
export interface SwapValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Result of performing a swap (with updated data)
 */
export interface SwapResult {
  success: boolean;
  error?: string;
  // Updated game data (if swap involved games)
  updatedGames?: {
    gameId: string;
    team1Player1Id: string;
    team1Player2Id: string;
    team2Player1Id: string;
    team2Player2Id: string;
  }[];
  // Updated bye data (player IDs for byes in this round)
  updatedByes?: string[];
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates that a swap can be performed between two players in the same round.
 *
 * Rules:
 * - Both players must be in the same round
 * - Players cannot be in the same team (swapping partners is meaningless)
 * - Swapping creates valid game assignments
 *
 * @param player1 - First player's position
 * @param player2 - Second player's position
 * @returns Validation result with any error message
 */
export function validateSwap(
  player1: PlayerPosition,
  player2: PlayerPosition
): SwapValidationResult {
  // Can't swap the same player with themselves
  if (player1.playerId === player2.playerId) {
    return { valid: false, error: "Cannot swap a player with themselves" };
  }

  // Both must be defined
  if (!player1.location || !player2.location) {
    return { valid: false, error: "Invalid player positions" };
  }

  // Check if both are in games and on the same team
  if (player1.location.type === "game" && player2.location.type === "game") {
    const loc1 = player1.location;
    const loc2 = player2.location;

    // If same game and same team, swap is meaningless (just reordering partners)
    if (loc1.gameId === loc2.gameId && loc1.team === loc2.team) {
      return {
        valid: false,
        error: "Cannot swap players on the same team in the same game",
      };
    }
  }

  return { valid: true };
}

/**
 * Finds a player's position within a round (in a game or on bye)
 *
 * @param playerId - The player to find
 * @param games - All games in the round
 * @param byes - Player IDs on bye in this round
 * @returns The player's position, or null if not found
 */
export function findPlayerPosition(
  playerId: string,
  games: SwapGame[],
  byes: string[]
): PlayerPosition | null {
  // Check if player is on bye
  if (byes.includes(playerId)) {
    return { playerId, location: { type: "bye" } };
  }

  // Check each game for the player
  for (const game of games) {
    if (game.team1Player1Id === playerId) {
      return {
        playerId,
        location: { type: "game", gameId: game.id, team: 1, position: 1 },
      };
    }
    if (game.team1Player2Id === playerId) {
      return {
        playerId,
        location: { type: "game", gameId: game.id, team: 1, position: 2 },
      };
    }
    if (game.team2Player1Id === playerId) {
      return {
        playerId,
        location: { type: "game", gameId: game.id, team: 2, position: 1 },
      };
    }
    if (game.team2Player2Id === playerId) {
      return {
        playerId,
        location: { type: "game", gameId: game.id, team: 2, position: 2 },
      };
    }
  }

  return null;
}

/**
 * Performs a swap between two players and returns the updated game/bye data.
 *
 * This function creates new data structures - it doesn't mutate the inputs.
 *
 * @param player1 - First player's position
 * @param player2 - Second player's position
 * @param games - All games in the round (will be cloned, not mutated)
 * @param byes - Player IDs on bye (will be cloned, not mutated)
 * @returns Result with updated games and byes
 */
export function performSwap(
  player1: PlayerPosition,
  player2: PlayerPosition,
  games: SwapGame[],
  byes: string[]
): SwapResult {
  // Validate first
  const validation = validateSwap(player1, player2);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Clone the data
  const updatedGames = games.map((g) => ({
    gameId: g.id,
    team1Player1Id: g.team1Player1Id,
    team1Player2Id: g.team1Player2Id,
    team2Player1Id: g.team2Player1Id,
    team2Player2Id: g.team2Player2Id,
  }));
  const updatedByes = [...byes];

  // Helper to update a player in the games/byes structure
  function setPlayerAt(pos: PlayerPosition, newPlayerId: string) {
    const loc = pos.location;
    if (loc.type === "bye") {
      const idx = updatedByes.indexOf(pos.playerId);
      if (idx !== -1) {
        updatedByes[idx] = newPlayerId;
      }
    } else {
      const game = updatedGames.find((g) => g.gameId === loc.gameId);
      if (game) {
        if (loc.team === 1 && loc.position === 1) {
          game.team1Player1Id = newPlayerId;
        } else if (loc.team === 1 && loc.position === 2) {
          game.team1Player2Id = newPlayerId;
        } else if (loc.team === 2 && loc.position === 1) {
          game.team2Player1Id = newPlayerId;
        } else if (loc.team === 2 && loc.position === 2) {
          game.team2Player2Id = newPlayerId;
        }
      }
    }
  }

  // Perform the swap: put player2's ID where player1 was, and vice versa
  setPlayerAt(player1, player2.playerId);
  setPlayerAt(player2, player1.playerId);

  return {
    success: true,
    updatedGames,
    updatedByes,
  };
}

/**
 * Gets all valid swap targets for a selected player in a given round.
 * Valid targets are players in the same round who are not:
 * - The selected player themselves
 * - A teammate on the same team in the same game
 *
 * @param selectedPlayerId - The ID of the currently selected player
 * @param roundGames - All games in the round
 * @param roundByes - Player IDs on bye in the round
 * @returns Array of player IDs that are valid swap targets
 */
export function getValidSwapTargets(
  selectedPlayerId: string,
  roundGames: SwapGame[],
  roundByes: string[]
): string[] {
  const validTargets: string[] = [];

  // Find the selected player's position to check for teammate exclusion
  const selectedPosition = findPlayerPosition(selectedPlayerId, roundGames, roundByes);

  // Players on bye are always valid targets (unless they are the selected player)
  for (const byePlayerId of roundByes) {
    if (byePlayerId !== selectedPlayerId) {
      validTargets.push(byePlayerId);
    }
  }

  // Check all players in games
  for (const game of roundGames) {
    const positions = [
      { playerId: game.team1Player1Id, team: 1, position: 1 },
      { playerId: game.team1Player2Id, team: 1, position: 2 },
      { playerId: game.team2Player1Id, team: 2, position: 1 },
      { playerId: game.team2Player2Id, team: 2, position: 2 },
    ];

    for (const pos of positions) {
      // Skip the selected player
      if (pos.playerId === selectedPlayerId) continue;

      // If selected player is in a game, check if this is their teammate
      if (
        selectedPosition?.location.type === "game" &&
        selectedPosition.location.gameId === game.id &&
        selectedPosition.location.team === pos.team
      ) {
        // Same game, same team = teammate, not a valid target
        continue;
      }

      validTargets.push(pos.playerId);
    }
  }

  return validTargets;
}

/**
 * Checks for constraint violations after a swap.
 * Returns warnings for any issues found.
 *
 * @param allGames - All games across all rounds in the week
 * @param playerIds - All player IDs in the schedule
 * @param playerNames - Map of player ID to name (for readable warnings)
 * @returns Array of warning messages
 */
export function checkSwapViolations(
  allGames: SwapGame[],
  playerIds: string[],
  playerNames: Map<string, string>
): string[] {
  const warnings: string[] = [];
  const partnerships = new Map<string, number>(); // partnership key -> count
  const gamesPerPlayer = new Map<string, number>();

  // Initialize game counts
  for (const id of playerIds) {
    gamesPerPlayer.set(id, 0);
  }

  // Analyze all games
  for (const game of allGames) {
    const players = [
      game.team1Player1Id,
      game.team1Player2Id,
      game.team2Player1Id,
      game.team2Player2Id,
    ];

    // Count games per player
    for (const playerId of players) {
      const current = gamesPerPlayer.get(playerId) || 0;
      gamesPerPlayer.set(playerId, current + 1);
    }

    // Track partnerships
    const key1 = partnershipKey(game.team1Player1Id, game.team1Player2Id);
    const key2 = partnershipKey(game.team2Player1Id, game.team2Player2Id);

    partnerships.set(key1, (partnerships.get(key1) || 0) + 1);
    partnerships.set(key2, (partnerships.get(key2) || 0) + 1);
  }

  // Check for repeat partnerships
  for (const [key, count] of partnerships) {
    if (count > 1) {
      const [p1, p2] = key.split("-");
      const name1 = playerNames.get(p1) || p1;
      const name2 = playerNames.get(p2) || p2;
      warnings.push(`${name1} and ${name2} are partnered ${count} times`);
    }
  }

  // Check game count violations
  for (const [playerId, count] of gamesPerPlayer) {
    if (count !== 8) {
      const name = playerNames.get(playerId) || playerId;
      warnings.push(`${name} has ${count} games (expected 8)`);
    }
  }

  return warnings;
}
