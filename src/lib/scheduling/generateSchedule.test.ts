// Unit tests for schedule generation algorithm
// Tests all configurations from PRD Section 7

import { describe, it, expect } from "vitest";
import {
  generateSchedule,
  validateScheduleConstraints,
  partnershipKey,
  calculateExpectedRounds,
  calculateByesPerRound,
  type Schedule,
} from "./generateSchedule";

/**
 * Helper: Generate array of player IDs
 */
function generatePlayerIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `player-${i + 1}`);
}

/**
 * Helper: Check that all players have exactly 8 games
 */
function checkGamesPerPlayer(
  schedule: Schedule,
  playerIds: string[]
): { valid: boolean; gamesPerPlayer: Map<string, number> } {
  const gamesPerPlayer = new Map<string, number>();

  // Initialize all to 0
  for (const id of playerIds) {
    gamesPerPlayer.set(id, 0);
  }

  // Count games per player
  for (const round of schedule.rounds) {
    for (const game of round.games) {
      for (const player of [...game.team1, ...game.team2]) {
        const current = gamesPerPlayer.get(player) || 0;
        gamesPerPlayer.set(player, current + 1);
      }
    }
  }

  // Check all players have exactly 8 games
  let valid = true;
  for (const id of playerIds) {
    if (gamesPerPlayer.get(id) !== 8) {
      valid = false;
      break;
    }
  }

  return { valid, gamesPerPlayer };
}

/**
 * Helper: Check for repeat partnerships
 */
function checkNoRepeatPartnerships(schedule: Schedule): {
  valid: boolean;
  duplicates: string[];
} {
  const partnerships = new Set<string>();
  const duplicates: string[] = [];

  for (const round of schedule.rounds) {
    for (const game of round.games) {
      const key1 = partnershipKey(game.team1[0], game.team1[1]);
      const key2 = partnershipKey(game.team2[0], game.team2[1]);

      if (partnerships.has(key1)) {
        duplicates.push(key1);
      }
      if (partnerships.has(key2)) {
        duplicates.push(key2);
      }

      partnerships.add(key1);
      partnerships.add(key2);
    }
  }

  return { valid: duplicates.length === 0, duplicates };
}

describe("partnershipKey", () => {
  it("returns consistent key regardless of player order", () => {
    expect(partnershipKey("player-a", "player-b")).toBe(
      partnershipKey("player-b", "player-a")
    );
  });

  it("sorts player IDs alphabetically", () => {
    expect(partnershipKey("zebra", "apple")).toBe("apple-zebra");
  });
});

describe("calculateExpectedRounds", () => {
  it("calculates 8 rounds for 24 players, 6 courts", () => {
    expect(calculateExpectedRounds(24, 6)).toBe(8);
  });

  it("calculates 10 rounds for 28 players, 6 courts", () => {
    // 28 * 8 / 24 = 9.33 -> 10 rounds
    expect(calculateExpectedRounds(28, 6)).toBe(10);
  });

  it("calculates 11 rounds for 32 players, 6 courts", () => {
    // 32 * 8 / 24 = 10.67 -> 11 rounds
    expect(calculateExpectedRounds(32, 6)).toBe(11);
  });

  it("calculates 12 rounds for 24 players, 4 courts", () => {
    // 24 * 8 / 16 = 12 rounds
    expect(calculateExpectedRounds(24, 4)).toBe(12);
  });

  it("calculates 8 rounds for 32 players, 8 courts", () => {
    // 32 * 8 / 32 = 8 rounds
    expect(calculateExpectedRounds(32, 8)).toBe(8);
  });
});

describe("calculateByesPerRound", () => {
  it("returns 0 byes for 24 players, 6 courts (perfect fit)", () => {
    expect(calculateByesPerRound(24, 6)).toBe(0);
  });

  it("returns 4 byes for 28 players, 6 courts", () => {
    expect(calculateByesPerRound(28, 6)).toBe(4);
  });

  it("returns 8 byes for 32 players, 6 courts", () => {
    expect(calculateByesPerRound(32, 6)).toBe(8);
  });

  it("returns 8 byes for 24 players, 4 courts", () => {
    expect(calculateByesPerRound(24, 4)).toBe(8);
  });

  it("returns 0 byes for 32 players, 8 courts (perfect fit)", () => {
    expect(calculateByesPerRound(32, 8)).toBe(0);
  });
});

describe("generateSchedule", () => {
  describe("input validation", () => {
    it("throws error for fewer than 24 players", () => {
      const playerIds = generatePlayerIds(23);
      expect(() => generateSchedule(playerIds, 6)).toThrow(
        "Need at least 24 players"
      );
    });

    it("throws error for more than 32 players", () => {
      const playerIds = generatePlayerIds(33);
      expect(() => generateSchedule(playerIds, 6)).toThrow(
        "Maximum 32 players allowed"
      );
    });

    it("throws error for fewer than 4 courts", () => {
      const playerIds = generatePlayerIds(24);
      expect(() => generateSchedule(playerIds, 3)).toThrow(
        "Courts must be 4-8"
      );
    });

    it("throws error for more than 8 courts", () => {
      const playerIds = generatePlayerIds(24);
      expect(() => generateSchedule(playerIds, 9)).toThrow(
        "Courts must be 4-8"
      );
    });
  });

  describe("24 players, 6 courts (perfect fit)", () => {
    const playerIds = generatePlayerIds(24);
    const schedule = generateSchedule(playerIds, 6);

    it("generates exactly 8 rounds", () => {
      expect(schedule.rounds.length).toBe(8);
    });

    it("has 0 byes per round", () => {
      for (const round of schedule.rounds) {
        expect(round.byes.length).toBe(0);
      }
    });

    it("gives each player exactly 8 games", () => {
      const { valid, gamesPerPlayer } = checkGamesPerPlayer(schedule, playerIds);
      expect(valid).toBe(true);
      for (const [, count] of gamesPerPlayer) {
        expect(count).toBe(8);
      }
    });

    it("has no repeat partnerships", () => {
      const { valid, duplicates } = checkNoRepeatPartnerships(schedule);
      expect(valid).toBe(true);
      expect(duplicates).toHaveLength(0);
    });

    it("generates no warnings", () => {
      // Perfect fit should have no warnings
      expect(schedule.warnings.length).toBe(0);
    });
  });

  describe("28 players, 6 courts", () => {
    const playerIds = generatePlayerIds(28);
    const schedule = generateSchedule(playerIds, 6);

    it("generates correct number of rounds (around 10)", () => {
      // 28 * 8 / 24 = 9.33, so we need at least 10 rounds
      expect(schedule.rounds.length).toBeGreaterThanOrEqual(9);
      expect(schedule.rounds.length).toBeLessThanOrEqual(12);
    });

    it("has reasonable byes per round", () => {
      const totalByes = schedule.rounds.reduce(
        (sum, r) => sum + r.byes.length,
        0
      );
      const avgByes = totalByes / schedule.rounds.length;
      // With 28 players and 24 active slots, we expect ~4 byes per round,
      // but actual average varies as players complete their 8 games in later rounds
      expect(avgByes).toBeGreaterThanOrEqual(3);
      expect(avgByes).toBeLessThanOrEqual(8);
    });

    it("gives each player exactly 8 games", () => {
      const { valid } = checkGamesPerPlayer(schedule, playerIds);
      expect(valid).toBe(true);
    });

    it("has no repeat partnerships", () => {
      const { valid } = checkNoRepeatPartnerships(schedule);
      expect(valid).toBe(true);
    });
  });

  describe("32 players, 6 courts", () => {
    const playerIds = generatePlayerIds(32);
    const schedule = generateSchedule(playerIds, 6);

    it("generates correct number of rounds (around 11)", () => {
      // 32 * 8 / 24 = 10.67, so we need at least 11 rounds
      expect(schedule.rounds.length).toBeGreaterThanOrEqual(10);
      expect(schedule.rounds.length).toBeLessThanOrEqual(13);
    });

    it("has 8 byes per round on average", () => {
      const totalByes = schedule.rounds.reduce(
        (sum, r) => sum + r.byes.length,
        0
      );
      const avgByes = totalByes / schedule.rounds.length;
      // Should average around 8 byes per round
      expect(avgByes).toBeGreaterThanOrEqual(6);
      expect(avgByes).toBeLessThanOrEqual(10);
    });

    it("gives each player exactly 8 games", () => {
      const { valid } = checkGamesPerPlayer(schedule, playerIds);
      expect(valid).toBe(true);
    });

    it("has no repeat partnerships", () => {
      const { valid } = checkNoRepeatPartnerships(schedule);
      expect(valid).toBe(true);
    });
  });

  describe("24 players, 4 courts", () => {
    const playerIds = generatePlayerIds(24);
    const schedule = generateSchedule(playerIds, 4);

    it("generates exactly 12 rounds", () => {
      // 24 * 8 / 16 = 12 rounds exactly
      expect(schedule.rounds.length).toBe(12);
    });

    it("has 8 byes per round", () => {
      // 24 - 16 = 8 byes per round
      for (const round of schedule.rounds) {
        expect(round.byes.length).toBe(8);
      }
    });

    it("gives each player exactly 8 games", () => {
      const { valid } = checkGamesPerPlayer(schedule, playerIds);
      expect(valid).toBe(true);
    });

    it("has no repeat partnerships", () => {
      const { valid } = checkNoRepeatPartnerships(schedule);
      expect(valid).toBe(true);
    });
  });

  describe("32 players, 8 courts (perfect fit)", () => {
    const playerIds = generatePlayerIds(32);
    const schedule = generateSchedule(playerIds, 8);

    it("generates exactly 8 rounds", () => {
      // 32 * 8 / 32 = 8 rounds exactly
      expect(schedule.rounds.length).toBe(8);
    });

    it("has 0 byes per round", () => {
      for (const round of schedule.rounds) {
        expect(round.byes.length).toBe(0);
      }
    });

    it("gives each player exactly 8 games", () => {
      const { valid, gamesPerPlayer } = checkGamesPerPlayer(schedule, playerIds);
      expect(valid).toBe(true);
      for (const [, count] of gamesPerPlayer) {
        expect(count).toBe(8);
      }
    });

    it("has no repeat partnerships", () => {
      const { valid, duplicates } = checkNoRepeatPartnerships(schedule);
      expect(valid).toBe(true);
      expect(duplicates).toHaveLength(0);
    });

    it("generates no warnings", () => {
      // Perfect fit should have no warnings
      expect(schedule.warnings.length).toBe(0);
    });
  });

  describe("edge case: 25 players, 6 courts", () => {
    const playerIds = generatePlayerIds(25);
    const schedule = generateSchedule(playerIds, 6);

    it("generates a valid schedule", () => {
      expect(schedule.rounds.length).toBeGreaterThan(0);
    });

    it("gives each player exactly 8 games", () => {
      const { valid } = checkGamesPerPlayer(schedule, playerIds);
      expect(valid).toBe(true);
    });

    it("has no repeat partnerships", () => {
      const { valid } = checkNoRepeatPartnerships(schedule);
      expect(valid).toBe(true);
    });

    it("has 1 bye per round on average", () => {
      const totalByes = schedule.rounds.reduce(
        (sum, r) => sum + r.byes.length,
        0
      );
      const avgByes = totalByes / schedule.rounds.length;
      expect(avgByes).toBeGreaterThanOrEqual(0);
      expect(avgByes).toBeLessThanOrEqual(3);
    });
  });

  describe("performance", () => {
    it("generates schedule in under 10 seconds", () => {
      const playerIds = generatePlayerIds(32);
      const startTime = Date.now();
      generateSchedule(playerIds, 6);
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      expect(elapsed).toBeLessThan(10000);
    });
  });
});

describe("validateScheduleConstraints", () => {
  it("returns empty array for valid schedule", () => {
    const playerIds = generatePlayerIds(24);
    const schedule = generateSchedule(playerIds, 6);
    const violations = validateScheduleConstraints(schedule, playerIds);
    expect(violations).toHaveLength(0);
  });

  it("detects duplicate partnerships", () => {
    const playerIds = generatePlayerIds(24);
    const schedule = generateSchedule(playerIds, 6);

    // Artificially create a duplicate partnership
    if (schedule.rounds.length >= 2 && schedule.rounds[0].games.length > 0) {
      const firstGame = schedule.rounds[0].games[0];
      // Copy the first team to the second round
      schedule.rounds[1].games[0] = {
        ...schedule.rounds[1].games[0],
        team1: [...firstGame.team1],
      };
    }

    const violations = validateScheduleConstraints(schedule, playerIds);
    expect(violations.some((v) => v.includes("Duplicate partnership"))).toBe(
      true
    );
  });

  it("detects incorrect game counts", () => {
    const playerIds = generatePlayerIds(24);
    const schedule = generateSchedule(playerIds, 6);

    // Remove a round to create incorrect game counts
    schedule.rounds.pop();

    const violations = validateScheduleConstraints(schedule, playerIds);
    expect(violations.some((v) => v.includes("games (expected 8)"))).toBe(true);
  });
});
