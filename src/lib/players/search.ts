/**
 * Player search utilities
 *
 * Contains pure functions for filtering/searching players by name.
 * These are extracted for easy unit testing.
 */

import type { Database } from "@/types/database";

type Player = Database["public"]["Tables"]["players"]["Row"];

/**
 * Filters an array of players by name using case-insensitive partial matching.
 *
 * @param players - Array of player objects to filter
 * @param searchQuery - Search string to match against player names
 * @returns Filtered array of players whose names contain the search query (case-insensitive)
 *
 * @example
 * filterPlayers([{ name: "John Doe" }, { name: "Jane Smith" }], "john")
 * // Returns [{ name: "John Doe" }]
 */
export function filterPlayers(players: Player[], searchQuery: string): Player[] {
  // Return all players if search query is empty
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) {
    return players;
  }

  // Case-insensitive partial match using toLowerCase().includes()
  const lowerQuery = trimmedQuery.toLowerCase();
  return players.filter((player) =>
    player.name.toLowerCase().includes(lowerQuery)
  );
}
