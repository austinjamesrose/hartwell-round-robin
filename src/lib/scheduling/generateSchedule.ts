// Schedule Generation Algorithm
// Generates weekly round robin schedules for pickleball games
// Based on PRD Section 7 specification

import {
  MIN_AVAILABLE_PLAYERS,
  MAX_AVAILABLE_PLAYERS,
} from "../availability/validation";

// ============================================================================
// Types
// ============================================================================

/**
 * A game assignment with court, two teams of two players each
 */
export interface Game {
  court: number;
  team1: [string, string]; // player IDs
  team2: [string, string]; // player IDs
}

/**
 * A single round of games with byes
 */
export interface Round {
  roundNumber: number;
  games: Game[];
  byes: string[]; // player IDs sitting out this round
}

/**
 * Complete generated schedule
 */
export interface Schedule {
  rounds: Round[];
  warnings: string[]; // constraint violations/relaxations
}

/**
 * Internal state tracking during schedule generation
 */
interface ScheduleState {
  partnerships: Set<string>; // "playerA-playerB" sorted keys
  gamesPlayed: Map<string, number>; // playerId -> count (target: 8)
  byeCount: Map<string, number>; // playerId -> count
  opponents: Map<string, Set<string>>; // playerId -> set of opponent IDs
  rounds: Round[];
}

/**
 * Result of a single generation attempt
 */
interface GenerationResult {
  success: boolean;
  state: ScheduleState;
  constraintsRelaxed: string[];
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_GAMES_PER_PLAYER = 8; // Default: exactly 8 games per player
const MAX_ATTEMPTS = 100; // Number of shuffle/retry attempts

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a consistent partnership key by sorting player IDs
 * This ensures "a|b" and "b|a" map to the same key
 * Uses "|" as delimiter since UUIDs contain hyphens
 */
export function partnershipKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

/**
 * Fisher-Yates shuffle for arrays
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Initializes empty state for schedule generation
 */
function initializeState(playerIds: string[]): ScheduleState {
  const state: ScheduleState = {
    partnerships: new Set(),
    gamesPlayed: new Map(),
    byeCount: new Map(),
    opponents: new Map(),
    rounds: [],
  };

  // Initialize all players with zero counts
  for (const id of playerIds) {
    state.gamesPlayed.set(id, 0);
    state.byeCount.set(id, 0);
    state.opponents.set(id, new Set());
  }

  return state;
}

/**
 * Selects which players will be active in this round
 * Prioritizes players who need more games and have fewer byes
 *
 * @param playerIds - All player IDs
 * @param state - Current schedule state
 * @param activeCount - Number of players to select as active
 * @param maxGamesPerPlayer - Maximum games per player (null = no limit, use for fixed rounds)
 */
function selectActivePlayers(
  playerIds: string[],
  state: ScheduleState,
  activeCount: number,
  maxGamesPerPlayer: number | null = DEFAULT_GAMES_PER_PLAYER
): { active: string[]; byes: string[] } {
  // Sort players by: games played (ascending), then bye count (ascending)
  // This prioritizes players with fewer games
  const sortedPlayers = [...playerIds].sort((a, b) => {
    const gamesA = state.gamesPlayed.get(a) || 0;
    const gamesB = state.gamesPlayed.get(b) || 0;

    // First: prioritize players who have played fewer games
    if (gamesA !== gamesB) {
      return gamesA - gamesB;
    }

    // Second: prioritize players with fewer byes (they've sat out less)
    const byesA = state.byeCount.get(a) || 0;
    const byesB = state.byeCount.get(b) || 0;
    return byesA - byesB;
  });

  // Filter out players who already have max games (when limit is set)
  const eligiblePlayers = maxGamesPerPlayer !== null
    ? sortedPlayers.filter((p) => {
        const games = state.gamesPlayed.get(p) || 0;
        return games < maxGamesPerPlayer;
      })
    : sortedPlayers;

  // Take top players as active, rest are byes
  const active = eligiblePlayers.slice(0, Math.min(activeCount, eligiblePlayers.length));
  const byes = playerIds.filter((p) => !active.includes(p));

  return { active, byes };
}

/**
 * Result of team formation attempt
 */
interface FormTeamsResult {
  teams: [string, string][];
  repeatPartnerships: string[]; // List of partnerships that were repeated (if relaxed)
}

/**
 * Attempts to form teams from available players
 * Each player can only partner with someone they haven't partnered with before
 *
 * @param players - Available player IDs
 * @param partnerships - Set of existing partnership keys
 * @param allowRepeatPartnerships - If true, allow repeat partnerships when no other option
 * @returns teams and any repeat partnerships used, or null if can't form teams
 */
function formTeams(
  players: string[],
  partnerships: Set<string>,
  allowRepeatPartnerships: boolean = false
): FormTeamsResult | null {
  const available = shuffle([...players]); // Randomize for variety
  const teams: [string, string][] = [];
  const repeatPartnerships: string[] = [];

  while (available.length >= 2) {
    const player1 = available.shift()!;

    // Find a valid partner (someone player1 hasn't partnered with)
    let partnerIdx = available.findIndex(
      (p) => !partnerships.has(partnershipKey(player1, p))
    );

    if (partnerIdx === -1) {
      if (allowRepeatPartnerships && available.length > 0) {
        // Relaxed mode: allow repeat partnership
        partnerIdx = 0; // Take the first available player
        const key = partnershipKey(player1, available[0]);
        repeatPartnerships.push(key);
      } else {
        // Strict mode: no valid partner found - this attempt failed
        return null;
      }
    }

    const player2 = available.splice(partnerIdx, 1)[0];
    teams.push([player1, player2]);
  }

  return { teams, repeatPartnerships };
}

/**
 * Matches teams into games, trying to vary opponents
 * Returns games with court assignments
 */
function matchTeams(
  teams: [string, string][],
  opponents: Map<string, Set<string>>,
  numCourts: number
): Game[] {
  const games: Game[] = [];
  const availableTeams = shuffle([...teams]); // Randomize

  let court = 1;
  while (availableTeams.length >= 2 && games.length < numCourts) {
    const team1 = availableTeams.shift()!;

    // Try to find an opponent team that minimizes repeat matchups
    // Score each potential opponent by how many new opponents it provides
    let bestIdx = 0;
    let bestScore = -1;

    for (let i = 0; i < availableTeams.length; i++) {
      const team2 = availableTeams[i];
      let score = 0;

      // Count how many opponent pairs would be new
      for (const p1 of team1) {
        const p1Opponents = opponents.get(p1) || new Set();
        for (const p2 of team2) {
          if (!p1Opponents.has(p2)) {
            score++;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const team2 = availableTeams.splice(bestIdx, 1)[0];
    games.push({
      court,
      team1,
      team2,
    });
    court++;
  }

  return games;
}

/**
 * Updates state after a round is scheduled
 */
function updateState(
  state: ScheduleState,
  games: Game[],
  byes: string[],
  roundNumber: number
): void {
  // Add the round
  state.rounds.push({
    roundNumber,
    games,
    byes,
  });

  // Update game counts and partnerships for each game
  for (const game of games) {
    const allPlayers = [...game.team1, ...game.team2];

    // Update games played
    for (const player of allPlayers) {
      const current = state.gamesPlayed.get(player) || 0;
      state.gamesPlayed.set(player, current + 1);
    }

    // Record partnerships (team1 and team2)
    state.partnerships.add(partnershipKey(game.team1[0], game.team1[1]));
    state.partnerships.add(partnershipKey(game.team2[0], game.team2[1]));

    // Record opponents
    for (const p1 of game.team1) {
      const opps = state.opponents.get(p1) || new Set();
      for (const p2 of game.team2) {
        opps.add(p2);
      }
      state.opponents.set(p1, opps);
    }
    for (const p2 of game.team2) {
      const opps = state.opponents.get(p2) || new Set();
      for (const p1 of game.team1) {
        opps.add(p1);
      }
      state.opponents.set(p2, opps);
    }
  }

  // Update bye counts
  for (const player of byes) {
    const current = state.byeCount.get(player) || 0;
    state.byeCount.set(player, current + 1);
  }
}

/**
 * Validates that the schedule meets hard constraints
 *
 * @param state - Current schedule state
 * @param playerIds - All player IDs
 * @param targetGamesPerPlayer - Target games per player (null = skip game count validation)
 */
function validateSchedule(
  state: ScheduleState,
  playerIds: string[],
  targetGamesPerPlayer: number | null = DEFAULT_GAMES_PER_PLAYER
): boolean {
  // When using fixed rounds, we don't require exact game counts
  if (targetGamesPerPlayer === null) {
    return true;
  }

  // Check that all players have exactly the target number of games
  for (const playerId of playerIds) {
    const games = state.gamesPlayed.get(playerId) || 0;
    if (games !== targetGamesPerPlayer) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates statistics about bye distribution
 */
function getByeStats(state: ScheduleState): { min: number; max: number; variance: number } {
  const counts = Array.from(state.byeCount.values());
  if (counts.length === 0) {
    return { min: 0, max: 0, variance: 0 };
  }

  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance =
    counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;

  return { min, max, variance };
}

/**
 * Attempts to generate a schedule with all constraints
 *
 * @param playerIds - All player IDs
 * @param numCourts - Number of courts available
 * @param allowRepeatPartnerships - If true, allow repeat partnerships as last resort
 * @param targetRounds - Fixed number of rounds (if provided, overrides auto-calculation)
 */
function attemptGeneration(
  playerIds: string[],
  numCourts: number,
  allowRepeatPartnerships: boolean = false,
  targetRounds?: number
): GenerationResult {
  const playersPerRound = numCourts * 4;
  // Use targetRounds if provided, otherwise calculate based on 8 games per player
  const numRounds = targetRounds ?? Math.ceil((playerIds.length * DEFAULT_GAMES_PER_PLAYER) / playersPerRound);
  // When using fixed rounds, don't cap games at 8 per player
  const maxGamesPerPlayer = targetRounds !== undefined ? null : DEFAULT_GAMES_PER_PLAYER;

  const state = initializeState(playerIds);
  const constraintsRelaxed: string[] = [];
  const allRepeatPartnerships: string[] = [];

  for (let round = 1; round <= numRounds; round++) {
    // Select which players play this round
    const { active } = selectActivePlayers(playerIds, state, playersPerRound, maxGamesPerPlayer);

    // If we don't have enough players to fill courts, adjust
    if (active.length < 4) {
      // Not enough players left who need games
      break;
    }

    // Form teams from active players
    const teamsResult = formTeams(active, state.partnerships, allowRepeatPartnerships);

    if (teamsResult === null) {
      // Couldn't form valid teams - constraint violation
      return { success: false, state, constraintsRelaxed };
    }

    // Track any repeat partnerships used
    if (teamsResult.repeatPartnerships.length > 0) {
      allRepeatPartnerships.push(...teamsResult.repeatPartnerships);
    }

    // Match teams into games
    const games = matchTeams(teamsResult.teams, state.opponents, numCourts);

    // Players who were active but didn't get into a game (odd team count) become byes
    const playersInGames = new Set(
      games.flatMap((g) => [...g.team1, ...g.team2])
    );
    const finalByes = playerIds.filter((p) => !playersInGames.has(p));

    // Update state
    updateState(state, games, finalByes, round);
  }

  // Add warnings for repeat partnerships
  if (allRepeatPartnerships.length > 0) {
    constraintsRelaxed.push(
      `Some players are paired with the same partner more than once (${allRepeatPartnerships.length} repeat partnership${allRepeatPartnerships.length > 1 ? "s" : ""})`
    );
  }

  // When using fixed rounds, validation always passes (we accept variable games per player)
  const success = validateSchedule(state, playerIds, targetRounds !== undefined ? null : DEFAULT_GAMES_PER_PLAYER);
  return { success, state, constraintsRelaxed };
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generates a weekly schedule for the given players and courts
 *
 * The algorithm uses a two-phase approach:
 * 1. Phase 1 (Strict): Try to generate a schedule with no repeat partnerships
 * 2. Phase 2 (Relaxed): If strict mode fails, allow repeat partnerships with warnings
 *
 * @param playerIds - Array of player IDs (must be 24-32 players)
 * @param numCourts - Number of courts available (4-8)
 * @param targetRounds - Optional fixed number of rounds (overrides auto-calculation for 8 games/player)
 * @returns Schedule with rounds and any warnings
 * @throws Error if player count is out of valid range
 */
export function generateSchedule(
  playerIds: string[],
  numCourts: number,
  targetRounds?: number
): Schedule {
  // Validate inputs
  if (playerIds.length < MIN_AVAILABLE_PLAYERS) {
    throw new Error(
      `Need at least ${MIN_AVAILABLE_PLAYERS} players, got ${playerIds.length}`
    );
  }
  if (playerIds.length > MAX_AVAILABLE_PLAYERS) {
    throw new Error(
      `Maximum ${MAX_AVAILABLE_PLAYERS} players allowed, got ${playerIds.length}`
    );
  }
  if (numCourts < 4 || numCourts > 8) {
    throw new Error(`Courts must be 4-8, got ${numCourts}`);
  }

  // Phase 1: Try strict mode (no repeat partnerships)
  const strictResult = tryGenerateWithMode(playerIds, numCourts, false, targetRounds);
  if (strictResult) {
    return strictResult;
  }

  // Phase 2: Try relaxed mode (allow repeat partnerships)
  const relaxedResult = tryGenerateWithMode(playerIds, numCourts, true, targetRounds);
  if (relaxedResult) {
    return relaxedResult;
  }

  // Should never get here, but return empty schedule with error
  return {
    rounds: [],
    warnings: ["Failed to generate any schedule after maximum attempts"],
  };
}

/**
 * Attempts to generate a schedule with the given constraint mode
 *
 * @param playerIds - All player IDs
 * @param numCourts - Number of courts
 * @param allowRepeatPartnerships - Whether to allow repeat partnerships
 * @param targetRounds - Optional fixed number of rounds
 * @returns Schedule if successful, null if all attempts failed
 */
function tryGenerateWithMode(
  playerIds: string[],
  numCourts: number,
  allowRepeatPartnerships: boolean,
  targetRounds?: number
): Schedule | null {
  const warnings: string[] = [];
  let bestState: ScheduleState | null = null;
  let bestGamesVariance = Infinity;
  let bestConstraintsRelaxed: string[] = [];
  const isFixedRounds = targetRounds !== undefined;

  // Try up to MAX_ATTEMPTS with different shuffles
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = attemptGeneration(playerIds, numCourts, allowRepeatPartnerships, targetRounds);

    if (result.success) {
      // Found a valid schedule
      const byeStats = getByeStats(result.state);

      // Track the best one (lowest bye variance)
      if (byeStats.variance < bestGamesVariance) {
        bestGamesVariance = byeStats.variance;
        bestState = result.state;
        bestConstraintsRelaxed = result.constraintsRelaxed;
      }

      // If bye distribution is reasonably even, use this one
      if (byeStats.max - byeStats.min <= 2) {
        return {
          rounds: result.state.rounds,
          warnings: result.constraintsRelaxed,
        };
      }
    } else if (bestState === null || result.state.rounds.length > bestState.rounds.length) {
      // Track best partial result
      bestState = result.state;
      bestConstraintsRelaxed = result.constraintsRelaxed;
    }
  }

  // If we found at least one valid schedule, use the best one
  // For fixed rounds, validation always passes so we can use any result
  const targetGamesValidation = isFixedRounds ? null : DEFAULT_GAMES_PER_PLAYER;
  if (bestState && validateSchedule(bestState, playerIds, targetGamesValidation)) {
    const byeStats = getByeStats(bestState);
    if (byeStats.max - byeStats.min > 2) {
      warnings.push(
        `Bye distribution is uneven (${byeStats.min}-${byeStats.max} byes per player)`
      );
    }

    // For fixed rounds, add a warning about games per player range
    if (isFixedRounds) {
      const gamesDistribution: number[] = [];
      for (const playerId of playerIds) {
        gamesDistribution.push(bestState.gamesPlayed.get(playerId) || 0);
      }
      const minGames = Math.min(...gamesDistribution);
      const maxGames = Math.max(...gamesDistribution);
      if (minGames !== maxGames) {
        warnings.push(`Games per player: ${minGames}-${maxGames}`);
      }
    }

    // Include any constraint relaxation warnings
    warnings.push(...bestConstraintsRelaxed);
    return { rounds: bestState.rounds, warnings };
  }

  // In relaxed mode, even if we couldn't get everyone to exactly 8 games,
  // return the best effort with appropriate warnings
  if (allowRepeatPartnerships && bestState) {
    const gamesDistribution: number[] = [];
    for (const playerId of playerIds) {
      gamesDistribution.push(bestState.gamesPlayed.get(playerId) || 0);
    }
    const minGames = Math.min(...gamesDistribution);
    const maxGames = Math.max(...gamesDistribution);

    if (!isFixedRounds && (minGames !== DEFAULT_GAMES_PER_PLAYER || maxGames !== DEFAULT_GAMES_PER_PLAYER)) {
      warnings.push(
        `Could not achieve exactly 8 games per player (range: ${minGames}-${maxGames} games)`
      );
    } else if (isFixedRounds && minGames !== maxGames) {
      warnings.push(`Games per player: ${minGames}-${maxGames}`);
    }

    // Include any constraint relaxation warnings
    warnings.push(...bestConstraintsRelaxed);

    const byeStats = getByeStats(bestState);
    if (byeStats.max - byeStats.min > 2) {
      warnings.push(
        `Bye distribution is uneven (${byeStats.min}-${byeStats.max} byes per player)`
      );
    }

    return { rounds: bestState.rounds, warnings };
  }

  // Could not generate a valid schedule with this mode
  return null;
}

/**
 * Validates a schedule for constraint violations
 * Useful for checking schedules after manual edits
 *
 * @param schedule - The schedule to validate
 * @param playerIds - All player IDs in the season roster
 * @param expectedGames - Expected games range { min, max } or null to skip game count validation
 * @returns Array of violation messages (empty if valid)
 */
export function validateScheduleConstraints(
  schedule: Schedule,
  playerIds: string[],
  expectedGames: { min: number; max: number } | null = { min: DEFAULT_GAMES_PER_PLAYER, max: DEFAULT_GAMES_PER_PLAYER }
): string[] {
  const violations: string[] = [];
  const partnerships = new Set<string>();
  const gamesPlayed = new Map<string, number>();

  // Initialize game counts
  for (const id of playerIds) {
    gamesPlayed.set(id, 0);
  }

  // Check each round
  for (const round of schedule.rounds) {
    for (const game of round.games) {
      const allPlayers = [...game.team1, ...game.team2];

      // Check for duplicate partnerships
      const key1 = partnershipKey(game.team1[0], game.team1[1]);
      const key2 = partnershipKey(game.team2[0], game.team2[1]);

      if (partnerships.has(key1)) {
        violations.push(
          `Duplicate partnership in round ${round.roundNumber}: ${game.team1[0]} and ${game.team1[1]}`
        );
      }
      if (partnerships.has(key2)) {
        violations.push(
          `Duplicate partnership in round ${round.roundNumber}: ${game.team2[0]} and ${game.team2[1]}`
        );
      }

      partnerships.add(key1);
      partnerships.add(key2);

      // Update game counts
      for (const player of allPlayers) {
        const current = gamesPlayed.get(player) || 0;
        gamesPlayed.set(player, current + 1);
      }
    }
  }

  // Check game counts (if validation is enabled)
  if (expectedGames !== null) {
    for (const playerId of playerIds) {
      const games = gamesPlayed.get(playerId) || 0;
      if (games < expectedGames.min || games > expectedGames.max) {
        const expectedStr = expectedGames.min === expectedGames.max
          ? `${expectedGames.min}`
          : `${expectedGames.min}-${expectedGames.max}`;
        violations.push(
          `Player ${playerId} has ${games} games (expected ${expectedStr})`
        );
      }
    }
  }

  return violations;
}

/**
 * Calculate expected rounds for a given player and court configuration
 *
 * @param numPlayers - Number of players
 * @param numCourts - Number of courts
 * @param targetRounds - Optional fixed rounds (returned as-is if provided)
 */
export function calculateExpectedRounds(
  numPlayers: number,
  numCourts: number,
  targetRounds?: number
): number {
  if (targetRounds !== undefined) {
    return targetRounds;
  }
  const playersPerRound = numCourts * 4;
  return Math.ceil((numPlayers * DEFAULT_GAMES_PER_PLAYER) / playersPerRound);
}

/**
 * Calculate expected byes per round
 */
export function calculateByesPerRound(
  numPlayers: number,
  numCourts: number
): number {
  const playersPerRound = numCourts * 4;
  return Math.max(0, numPlayers - playersPerRound);
}

/**
 * Calculate expected games per player for a given configuration
 *
 * @param numPlayers - Number of players
 * @param numCourts - Number of courts
 * @param targetRounds - Optional fixed rounds (if provided, calculates based on rounds)
 * @returns Expected games as { min, max } range
 */
export function calculateExpectedGamesPerPlayer(
  numPlayers: number,
  numCourts: number,
  targetRounds?: number
): { min: number; max: number } {
  if (targetRounds === undefined) {
    // Auto-mode: target exactly 8 games per player
    return { min: DEFAULT_GAMES_PER_PLAYER, max: DEFAULT_GAMES_PER_PLAYER };
  }

  // Fixed rounds mode: calculate expected range
  const playersPerRound = numCourts * 4;
  const totalGameSlots = targetRounds * playersPerRound;
  const gamesPerPlayer = totalGameSlots / numPlayers;

  // Players get floor or ceil of the average
  const minGames = Math.floor(gamesPerPlayer);
  const maxGames = Math.ceil(gamesPerPlayer);

  return { min: minGames, max: maxGames };
}
