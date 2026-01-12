import { describe, it, expect } from "vitest";
import {
  calculateWinPercentage,
  comparePlayersForRanking,
  arePlayersTied,
  calculateRankings,
  formatRank,
  formatWinPercentage,
  type PlayerStats,
} from "./ranking";

describe("calculateWinPercentage", () => {
  it("returns 0 for no games played", () => {
    expect(calculateWinPercentage(0, 0)).toBe(0);
  });

  it("calculates 100% for all wins", () => {
    expect(calculateWinPercentage(8, 8)).toBe(100);
  });

  it("calculates 0% for no wins", () => {
    expect(calculateWinPercentage(0, 8)).toBe(0);
  });

  it("calculates 50% for half wins", () => {
    expect(calculateWinPercentage(4, 8)).toBe(50);
  });

  it("calculates 75% correctly", () => {
    expect(calculateWinPercentage(6, 8)).toBe(75);
  });

  it("calculates fractional percentages", () => {
    expect(calculateWinPercentage(5, 8)).toBe(62.5);
  });
});

describe("comparePlayersForRanking", () => {
  it("ranks higher points first", () => {
    const a: PlayerStats = { playerId: "1", playerName: "A", totalPoints: 100, gamesPlayed: 8, wins: 6 };
    const b: PlayerStats = { playerId: "2", playerName: "B", totalPoints: 80, gamesPlayed: 8, wins: 8 };
    expect(comparePlayersForRanking(a, b)).toBeLessThan(0); // a ranks higher
  });

  it("uses win percentage as tiebreaker", () => {
    const a: PlayerStats = { playerId: "1", playerName: "A", totalPoints: 80, gamesPlayed: 8, wins: 4 };
    const b: PlayerStats = { playerId: "2", playerName: "B", totalPoints: 80, gamesPlayed: 8, wins: 6 };
    expect(comparePlayersForRanking(a, b)).toBeGreaterThan(0); // b ranks higher due to better win %
  });

  it("returns 0 for identical stats", () => {
    const a: PlayerStats = { playerId: "1", playerName: "A", totalPoints: 80, gamesPlayed: 8, wins: 6 };
    const b: PlayerStats = { playerId: "2", playerName: "B", totalPoints: 80, gamesPlayed: 8, wins: 6 };
    expect(comparePlayersForRanking(a, b)).toBe(0);
  });
});

describe("arePlayersTied", () => {
  it("returns true for same points and win percentage", () => {
    const a: PlayerStats = { playerId: "1", playerName: "A", totalPoints: 80, gamesPlayed: 8, wins: 6 };
    const b: PlayerStats = { playerId: "2", playerName: "B", totalPoints: 80, gamesPlayed: 8, wins: 6 };
    expect(arePlayersTied(a, b)).toBe(true);
  });

  it("returns false for different points", () => {
    const a: PlayerStats = { playerId: "1", playerName: "A", totalPoints: 80, gamesPlayed: 8, wins: 6 };
    const b: PlayerStats = { playerId: "2", playerName: "B", totalPoints: 70, gamesPlayed: 8, wins: 6 };
    expect(arePlayersTied(a, b)).toBe(false);
  });

  it("returns false for same points but different win percentage", () => {
    const a: PlayerStats = { playerId: "1", playerName: "A", totalPoints: 80, gamesPlayed: 8, wins: 4 };
    const b: PlayerStats = { playerId: "2", playerName: "B", totalPoints: 80, gamesPlayed: 8, wins: 6 };
    expect(arePlayersTied(a, b)).toBe(false);
  });

  it("returns true for equivalent win percentages with different games played", () => {
    // 3/4 = 75% and 6/8 = 75%
    const a: PlayerStats = { playerId: "1", playerName: "A", totalPoints: 80, gamesPlayed: 4, wins: 3 };
    const b: PlayerStats = { playerId: "2", playerName: "B", totalPoints: 80, gamesPlayed: 8, wins: 6 };
    expect(arePlayersTied(a, b)).toBe(true);
  });
});

describe("calculateRankings", () => {
  it("returns empty array for no players", () => {
    expect(calculateRankings([])).toEqual([]);
  });

  it("ranks a single player as rank 1", () => {
    const players: PlayerStats[] = [
      { playerId: "1", playerName: "Alice", totalPoints: 80, gamesPlayed: 8, wins: 6 },
    ];
    const ranked = calculateRankings(players);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].isTied).toBe(false);
  });

  it("ranks players by total points descending", () => {
    const players: PlayerStats[] = [
      { playerId: "1", playerName: "Alice", totalPoints: 60, gamesPlayed: 8, wins: 4 },
      { playerId: "2", playerName: "Bob", totalPoints: 80, gamesPlayed: 8, wins: 6 },
      { playerId: "3", playerName: "Carol", totalPoints: 70, gamesPlayed: 8, wins: 5 },
    ];
    const ranked = calculateRankings(players);
    expect(ranked[0].playerName).toBe("Bob");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].playerName).toBe("Carol");
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].playerName).toBe("Alice");
    expect(ranked[2].rank).toBe(3);
  });

  it("uses win percentage as tiebreaker when points are equal", () => {
    const players: PlayerStats[] = [
      { playerId: "1", playerName: "Alice", totalPoints: 80, gamesPlayed: 8, wins: 4 }, // 50%
      { playerId: "2", playerName: "Bob", totalPoints: 80, gamesPlayed: 8, wins: 7 }, // 87.5%
    ];
    const ranked = calculateRankings(players);
    expect(ranked[0].playerName).toBe("Bob");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].playerName).toBe("Alice");
    expect(ranked[1].rank).toBe(2);
  });

  it("marks tied players with same rank and isTied=true", () => {
    const players: PlayerStats[] = [
      { playerId: "1", playerName: "Alice", totalPoints: 80, gamesPlayed: 8, wins: 6 },
      { playerId: "2", playerName: "Bob", totalPoints: 80, gamesPlayed: 8, wins: 6 },
    ];
    const ranked = calculateRankings(players);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].isTied).toBe(true);
    expect(ranked[1].rank).toBe(1);
    expect(ranked[1].isTied).toBe(true);
  });

  it("skips ranks after ties (T3, T3, then 5)", () => {
    const players: PlayerStats[] = [
      { playerId: "1", playerName: "1st", totalPoints: 100, gamesPlayed: 8, wins: 8 },
      { playerId: "2", playerName: "2nd", totalPoints: 90, gamesPlayed: 8, wins: 7 },
      { playerId: "3", playerName: "T3a", totalPoints: 80, gamesPlayed: 8, wins: 6 },
      { playerId: "4", playerName: "T3b", totalPoints: 80, gamesPlayed: 8, wins: 6 },
      { playerId: "5", playerName: "5th", totalPoints: 70, gamesPlayed: 8, wins: 5 },
    ];
    const ranked = calculateRankings(players);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].isTied).toBe(false);
    expect(ranked[1].rank).toBe(2);
    expect(ranked[1].isTied).toBe(false);
    expect(ranked[2].rank).toBe(3);
    expect(ranked[2].isTied).toBe(true);
    expect(ranked[3].rank).toBe(3);
    expect(ranked[3].isTied).toBe(true);
    expect(ranked[4].rank).toBe(5);
    expect(ranked[4].isTied).toBe(false);
  });

  it("handles three-way tie correctly", () => {
    const players: PlayerStats[] = [
      { playerId: "1", playerName: "A", totalPoints: 80, gamesPlayed: 8, wins: 6 },
      { playerId: "2", playerName: "B", totalPoints: 80, gamesPlayed: 8, wins: 6 },
      { playerId: "3", playerName: "C", totalPoints: 80, gamesPlayed: 8, wins: 6 },
    ];
    const ranked = calculateRankings(players);
    expect(ranked.every(p => p.rank === 1)).toBe(true);
    expect(ranked.every(p => p.isTied === true)).toBe(true);
  });

  it("calculates win percentage correctly in output", () => {
    const players: PlayerStats[] = [
      { playerId: "1", playerName: "Alice", totalPoints: 80, gamesPlayed: 8, wins: 6 },
    ];
    const ranked = calculateRankings(players);
    expect(ranked[0].winPercentage).toBe(75);
  });

  it("handles players with zero games played", () => {
    const players: PlayerStats[] = [
      { playerId: "1", playerName: "Active", totalPoints: 80, gamesPlayed: 8, wins: 6 },
      { playerId: "2", playerName: "New", totalPoints: 0, gamesPlayed: 0, wins: 0 },
    ];
    const ranked = calculateRankings(players);
    expect(ranked[0].playerName).toBe("Active");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].playerName).toBe("New");
    expect(ranked[1].rank).toBe(2);
    expect(ranked[1].winPercentage).toBe(0);
  });
});

describe("formatRank", () => {
  it("formats non-tied rank without prefix", () => {
    expect(formatRank(1, false)).toBe("1");
    expect(formatRank(10, false)).toBe("10");
  });

  it("formats tied rank with T prefix", () => {
    expect(formatRank(1, true)).toBe("T1");
    expect(formatRank(3, true)).toBe("T3");
    expect(formatRank(10, true)).toBe("T10");
  });
});

describe("formatWinPercentage", () => {
  it("formats whole percentages without decimal", () => {
    expect(formatWinPercentage(100)).toBe("100%");
    expect(formatWinPercentage(50)).toBe("50%");
    expect(formatWinPercentage(0)).toBe("0%");
  });

  it("formats fractional percentages with one decimal", () => {
    expect(formatWinPercentage(75.5)).toBe("75.5%");
    expect(formatWinPercentage(62.5)).toBe("62.5%");
  });

  it("handles very small decimals", () => {
    expect(formatWinPercentage(33.3)).toBe("33.3%");
  });
});
