/**
 * Progress calculation utilities for score entry.
 * Used to show how many games have been completed in a week/session.
 */

import type { Database } from "@/types/database";

type Game = Database["public"]["Tables"]["games"]["Row"];

// Progress summary data
export interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

/**
 * Check if a game is complete.
 * A game is complete when both team1_score and team2_score are entered (not null).
 */
export function isGameComplete(game: Game): boolean {
  return game.team1_score !== null && game.team2_score !== null;
}

/**
 * Calculate progress statistics for a list of games.
 * Returns completed count, total count, and percentage (0-100).
 */
export function calculateProgress(games: Game[]): ProgressData {
  const total = games.length;

  // Handle empty games array
  if (total === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const completed = games.filter(isGameComplete).length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}
