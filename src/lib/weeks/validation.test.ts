import { describe, it, expect } from "vitest";
import {
  canUnfinalizeWeek,
  countGamesWithScores,
  countGamesMissingScores,
  canMarkWeekComplete,
} from "./validation";

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

describe("countGamesMissingScores", () => {
  it("returns 0 for empty games array", () => {
    expect(countGamesMissingScores([])).toBe(0);
  });

  it("returns count of all games when no games have scores", () => {
    const games = [
      { team1_score: null, team2_score: null },
      { team1_score: null, team2_score: null },
      { team1_score: null, team2_score: null },
    ];
    expect(countGamesMissingScores(games)).toBe(3);
  });

  it("returns 0 when all games have scores", () => {
    const games = [
      { team1_score: 11, team2_score: 7 },
      { team1_score: 9, team2_score: 11 },
    ];
    expect(countGamesMissingScores(games)).toBe(0);
  });

  it("counts games missing scores correctly", () => {
    const games = [
      { team1_score: 11, team2_score: 7 },
      { team1_score: null, team2_score: null },
      { team1_score: 9, team2_score: 11 },
      { team1_score: null, team2_score: null },
    ];
    expect(countGamesMissingScores(games)).toBe(2);
  });

  it("includes games with only one score as missing (invalid state)", () => {
    const games = [
      { team1_score: 11, team2_score: null },
      { team1_score: null, team2_score: 7 },
    ];
    expect(countGamesMissingScores(games)).toBe(2);
  });
});

describe("canMarkWeekComplete", () => {
  it("blocks marking complete for draft weeks", () => {
    const result = canMarkWeekComplete("draft", 10, 0);
    expect(result.canMarkComplete).toBe(false);
    expect(result.errorMessage).toBe(
      "Cannot mark complete - week must be finalized first"
    );
  });

  it("blocks marking complete for already completed weeks", () => {
    const result = canMarkWeekComplete("completed", 10, 10);
    expect(result.canMarkComplete).toBe(false);
    expect(result.errorMessage).toBe("Week is already complete");
  });

  it("allows marking complete for finalized week with all scores", () => {
    const result = canMarkWeekComplete("finalized", 10, 10);
    expect(result.canMarkComplete).toBe(true);
    expect(result.hasMissingScores).toBe(false);
    expect(result.missingScoresCount).toBe(0);
    expect(result.errorMessage).toBeNull();
  });

  it("allows marking complete for finalized week with missing scores (with warning)", () => {
    const result = canMarkWeekComplete("finalized", 10, 7);
    expect(result.canMarkComplete).toBe(true);
    expect(result.hasMissingScores).toBe(true);
    expect(result.missingScoresCount).toBe(3);
    expect(result.errorMessage).toBeNull();
  });

  it("allows marking complete with zero scores entered (with warning)", () => {
    const result = canMarkWeekComplete("finalized", 10, 0);
    expect(result.canMarkComplete).toBe(true);
    expect(result.hasMissingScores).toBe(true);
    expect(result.missingScoresCount).toBe(10);
  });
});
