import { describe, expect, it } from "vitest";
import { calculateProgress, isGameComplete, type ProgressData } from "./progress";
import type { Database } from "@/types/database";

type Game = Database["public"]["Tables"]["games"]["Row"];

// Helper to create mock games
function createMockGame(overrides: Partial<Game>): Game {
  return {
    id: crypto.randomUUID(),
    week_id: "week-1",
    round_number: 1,
    court_number: 1,
    team1_player1_id: "p1",
    team1_player2_id: "p2",
    team2_player1_id: "p3",
    team2_player2_id: "p4",
    team1_score: null,
    team2_score: null,
    status: "scheduled",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("isGameComplete", () => {
  it("returns true when both scores are entered", () => {
    const game = createMockGame({
      team1_score: 11,
      team2_score: 9,
    });

    expect(isGameComplete(game)).toBe(true);
  });

  it("returns false when only team1_score is entered", () => {
    const game = createMockGame({
      team1_score: 11,
      team2_score: null,
    });

    expect(isGameComplete(game)).toBe(false);
  });

  it("returns false when only team2_score is entered", () => {
    const game = createMockGame({
      team1_score: null,
      team2_score: 9,
    });

    expect(isGameComplete(game)).toBe(false);
  });

  it("returns false when neither score is entered", () => {
    const game = createMockGame({
      team1_score: null,
      team2_score: null,
    });

    expect(isGameComplete(game)).toBe(false);
  });

  it("returns true when scores are 0 (valid pickleball score)", () => {
    const game = createMockGame({
      team1_score: 11,
      team2_score: 0,
    });

    expect(isGameComplete(game)).toBe(true);
  });
});

describe("calculateProgress", () => {
  it("returns correct progress for partially completed games", () => {
    const games = [
      createMockGame({ team1_score: 11, team2_score: 9 }),
      createMockGame({ team1_score: 11, team2_score: 7 }),
      createMockGame({ team1_score: 8, team2_score: 11 }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: 11, team2_score: 5 }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: 11, team2_score: 10 }),
      createMockGame({ team1_score: null, team2_score: null }),
    ];

    const result = calculateProgress(games);

    expect(result).toEqual<ProgressData>({
      completed: 5,
      total: 10,
      percentage: 50,
    });
  });

  it("returns 100% when all games have scores", () => {
    const games = [
      createMockGame({ team1_score: 11, team2_score: 9 }),
      createMockGame({ team1_score: 11, team2_score: 7 }),
      createMockGame({ team1_score: 8, team2_score: 11 }),
    ];

    const result = calculateProgress(games);

    expect(result).toEqual<ProgressData>({
      completed: 3,
      total: 3,
      percentage: 100,
    });
  });

  it("returns 0% when no games have scores", () => {
    const games = [
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: null, team2_score: null }),
    ];

    const result = calculateProgress(games);

    expect(result).toEqual<ProgressData>({
      completed: 0,
      total: 3,
      percentage: 0,
    });
  });

  it("returns 0 for all values when games array is empty", () => {
    const result = calculateProgress([]);

    expect(result).toEqual<ProgressData>({
      completed: 0,
      total: 0,
      percentage: 0,
    });
  });

  it("rounds percentage to nearest integer", () => {
    // 1 of 3 = 33.333...% -> rounds to 33%
    const games = [
      createMockGame({ team1_score: 11, team2_score: 9 }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: null, team2_score: null }),
    ];

    const result = calculateProgress(games);

    expect(result.percentage).toBe(33);
  });

  it("handles 2 of 3 completed (67%)", () => {
    // 2 of 3 = 66.666...% -> rounds to 67%
    const games = [
      createMockGame({ team1_score: 11, team2_score: 9 }),
      createMockGame({ team1_score: 11, team2_score: 8 }),
      createMockGame({ team1_score: null, team2_score: null }),
    ];

    const result = calculateProgress(games);

    expect(result.percentage).toBe(67);
  });

  it("handles games with 0 scores as complete", () => {
    // A score of 0 is valid (11-0 shutout)
    const games = [
      createMockGame({ team1_score: 11, team2_score: 0 }),
      createMockGame({ team1_score: 0, team2_score: 11 }),
    ];

    const result = calculateProgress(games);

    expect(result).toEqual<ProgressData>({
      completed: 2,
      total: 2,
      percentage: 100,
    });
  });
});
