/**
 * Filter utilities for game lists (score entry, schedule viewing)
 * Used to filter games by round or court for easier score entry workflow.
 */

import type { Database } from "@/types/database";

type Game = Database["public"]["Tables"]["games"]["Row"];

// Filter type for selecting between round and court filtering
export type FilterType = "round" | "court";

// Filter state to track current filter selection
export interface GameFilterState {
  filterType: FilterType;
  selectedValue: number; // round_number or court_number depending on filterType
}

/**
 * Get all unique round numbers from a list of games, sorted ascending.
 */
export function getUniqueRounds(games: Game[]): number[] {
  const rounds = new Set<number>();
  for (const game of games) {
    rounds.add(game.round_number);
  }
  return Array.from(rounds).sort((a, b) => a - b);
}

/**
 * Get all unique court numbers from a list of games, sorted ascending.
 */
export function getUniqueCourts(games: Game[]): number[] {
  const courts = new Set<number>();
  for (const game of games) {
    courts.add(game.court_number);
  }
  return Array.from(courts).sort((a, b) => a - b);
}

/**
 * Filter games by round number.
 * Returns only games from the specified round, sorted by court_number.
 */
export function filterGamesByRound(games: Game[], roundNumber: number): Game[] {
  return games
    .filter((game) => game.round_number === roundNumber)
    .sort((a, b) => a.court_number - b.court_number);
}

/**
 * Filter games by court number.
 * Returns only games from the specified court, sorted by round_number.
 */
export function filterGamesByCourt(games: Game[], courtNumber: number): Game[] {
  return games
    .filter((game) => game.court_number === courtNumber)
    .sort((a, b) => a.round_number - b.round_number);
}

/**
 * Apply filter based on current filter state.
 * Returns filtered games based on filterType and selectedValue.
 */
export function applyGameFilter(
  games: Game[],
  filterState: GameFilterState
): Game[] {
  if (filterState.filterType === "round") {
    return filterGamesByRound(games, filterState.selectedValue);
  }
  return filterGamesByCourt(games, filterState.selectedValue);
}

/**
 * Count completed games in a list.
 * A game is complete when both team1_score and team2_score are not null.
 */
export function countCompletedGames(games: Game[]): number {
  return games.filter(
    (game) => game.team1_score !== null && game.team2_score !== null
  ).length;
}

/**
 * Get filter summary text for display.
 * Returns text like "Showing 6 games | 3 of 6 completed"
 */
export function getFilterSummary(games: Game[]): string {
  const total = games.length;
  const completed = countCompletedGames(games);
  return `Showing ${total} games | ${completed} of ${total} completed`;
}

/**
 * Get default filter state for a list of games.
 * Defaults to "By Round" with Round 1 selected.
 */
export function getDefaultFilterState(games: Game[]): GameFilterState {
  const rounds = getUniqueRounds(games);
  return {
    filterType: "round",
    selectedValue: rounds[0] ?? 1,
  };
}
