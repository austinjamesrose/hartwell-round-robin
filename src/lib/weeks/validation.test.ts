import { describe, it, expect } from "vitest";
import { canUnfinalizeWeek, countGamesWithScores } from "./validation";

describe("canUnfinalizeWeek", () => {
  it("allows unfinalize when no games have scores", () => {
    const result = canUnfinalizeWeek(0);
    expect(result.canUnfinalize).toBe(true);
    expect(result.errorMessage).toBeNull();
  });

  it("blocks unfinalize when one game has scores", () => {
    const result = canUnfinalizeWeek(1);
    expect(result.canUnfinalize).toBe(false);
    expect(result.errorMessage).toBe(
      "Cannot unfinalize - 1 score has already been recorded"
    );
  });

  it("blocks unfinalize when multiple games have scores", () => {
    const result = canUnfinalizeWeek(5);
    expect(result.canUnfinalize).toBe(false);
    expect(result.errorMessage).toBe(
      "Cannot unfinalize - 5 scores have already been recorded"
    );
  });

  it("uses plural form for 2+ scores", () => {
    const result = canUnfinalizeWeek(2);
    expect(result.errorMessage).toContain("scores have");
  });
});

describe("countGamesWithScores", () => {
  it("returns 0 for empty games array", () => {
    expect(countGamesWithScores([])).toBe(0);
  });

  it("returns 0 when no games have scores", () => {
    const games = [
      { team1_score: null, team2_score: null },
      { team1_score: null, team2_score: null },
      { team1_score: null, team2_score: null },
    ];
    expect(countGamesWithScores(games)).toBe(0);
  });

  it("counts games where both scores are set", () => {
    const games = [
      { team1_score: 11, team2_score: 7 },
      { team1_score: null, team2_score: null },
      { team1_score: 9, team2_score: 11 },
    ];
    expect(countGamesWithScores(games)).toBe(2);
  });

  it("ignores games with only one score set (invalid state)", () => {
    const games = [
      { team1_score: 11, team2_score: null },
      { team1_score: null, team2_score: 7 },
      { team1_score: 11, team2_score: 9 },
    ];
    // Only the last game has both scores
    expect(countGamesWithScores(games)).toBe(1);
  });

  it("counts all games when all have scores", () => {
    const games = [
      { team1_score: 11, team2_score: 5 },
      { team1_score: 8, team2_score: 11 },
      { team1_score: 0, team2_score: 11 },
    ];
    expect(countGamesWithScores(games)).toBe(3);
  });

  it("handles score of 0 correctly (0 is a valid score)", () => {
    const games = [
      { team1_score: 11, team2_score: 0 },
      { team1_score: 0, team2_score: 11 },
    ];
    expect(countGamesWithScores(games)).toBe(2);
  });
});
