// Leaderboard ranking logic
// Calculates player standings from game data

/**
 * Raw player stats from aggregated game data
 */
export interface PlayerStats {
  playerId: string;
  playerName: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
}

/**
 * Player entry with calculated ranking info
 */
export interface RankedPlayer {
  playerId: string;
  playerName: string;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  winPercentage: number;
  rank: number;
  isTied: boolean;
}

/**
 * Calculate win percentage from wins and games played
 * Returns 0 if no games played (avoids division by zero)
 */
export function calculateWinPercentage(wins: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0;
  return (wins / gamesPlayed) * 100;
}

/**
 * Compare two players for ranking purposes
 * Primary sort: Total Points (descending)
 * Tiebreaker: Win Percentage (descending)
 * Returns negative if a should rank higher, positive if b should rank higher
 */
export function comparePlayersForRanking(a: PlayerStats, b: PlayerStats): number {
  // Primary: Total points (higher is better)
  if (a.totalPoints !== b.totalPoints) {
    return b.totalPoints - a.totalPoints;
  }

  // Tiebreaker: Win percentage (higher is better)
  const aWinPct = calculateWinPercentage(a.wins, a.gamesPlayed);
  const bWinPct = calculateWinPercentage(b.wins, b.gamesPlayed);

  return bWinPct - aWinPct;
}

/**
 * Check if two players are tied (same points and win percentage)
 */
export function arePlayersTied(a: PlayerStats, b: PlayerStats): boolean {
  if (a.totalPoints !== b.totalPoints) return false;

  const aWinPct = calculateWinPercentage(a.wins, a.gamesPlayed);
  const bWinPct = calculateWinPercentage(b.wins, b.gamesPlayed);

  // Consider tied if win percentages are equal (within floating point tolerance)
  return Math.abs(aWinPct - bWinPct) < 0.0001;
}

/**
 * Calculate rankings from player stats
 * Sorts by total points (primary), then win percentage (tiebreaker)
 * Tied players receive the same rank with isTied=true
 */
export function calculateRankings(players: PlayerStats[]): RankedPlayer[] {
  if (players.length === 0) return [];

  // Sort players by ranking criteria
  const sorted = [...players].sort(comparePlayersForRanking);

  const ranked: RankedPlayer[] = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    const winPercentage = calculateWinPercentage(player.wins, player.gamesPlayed);

    // Check if tied with previous player
    const isTiedWithPrevious = i > 0 && arePlayersTied(player, sorted[i - 1]);

    // Check if tied with next player
    const isTiedWithNext = i < sorted.length - 1 && arePlayersTied(player, sorted[i + 1]);

    const isTied = isTiedWithPrevious || isTiedWithNext;

    // If tied with previous, use same rank; otherwise use current position
    const rank = isTiedWithPrevious ? ranked[i - 1].rank : currentRank;

    ranked.push({
      playerId: player.playerId,
      playerName: player.playerName,
      totalPoints: player.totalPoints,
      gamesPlayed: player.gamesPlayed,
      wins: player.wins,
      winPercentage,
      rank,
      isTied,
    });

    // Update current rank for next iteration (skip tied positions)
    currentRank = i + 2; // Next position is always i+2 (1-indexed)
  }

  return ranked;
}

/**
 * Format rank for display with "T" prefix for ties
 * e.g., 3 -> "3", tied 3 -> "T3"
 */
export function formatRank(rank: number, isTied: boolean): string {
  return isTied ? `T${rank}` : String(rank);
}

/**
 * Format win percentage for display
 * e.g., 75.5 -> "75.5%", 100 -> "100%"
 */
export function formatWinPercentage(winPercentage: number): string {
  // Show 1 decimal place, but trim trailing zero for whole numbers
  const formatted = winPercentage.toFixed(1);
  return formatted.endsWith('.0')
    ? `${Math.round(winPercentage)}%`
    : `${formatted}%`;
}
