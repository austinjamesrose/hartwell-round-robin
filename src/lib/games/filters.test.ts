import { describe, expect, it } from "vitest";
import {
  filterGamesByRound,
  filterGamesByCourt,
  getUniqueRounds,
  getUniqueCourts,
  applyGameFilter,
  countCompletedGames,
  getFilterSummary,
  getDefaultFilterState,
  type GameFilterState,
} from "./filters";
import type { Database } from "@/types/database";

type Game = Database["public"]["Tables"]["games"]["Row"];

// Helper to create mock games with required fields
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

describe("getUniqueRounds", () => {
  it("returns unique round numbers sorted ascending", () => {
    const games = [
      createMockGame({ round_number: 3 }),
      createMockGame({ round_number: 1 }),
      createMockGame({ round_number: 2 }),
      createMockGame({ round_number: 1 }), // duplicate
    ];

    const rounds = getUniqueRounds(games);

    expect(rounds).toEqual([1, 2, 3]);
  });

  it("returns empty array for empty games list", () => {
    expect(getUniqueRounds([])).toEqual([]);
  });
});

describe("getUniqueCourts", () => {
  it("returns unique court numbers sorted ascending", () => {
    const games = [
      createMockGame({ court_number: 4 }),
      createMockGame({ court_number: 2 }),
      createMockGame({ court_number: 1 }),
      createMockGame({ court_number: 2 }), // duplicate
    ];

    const courts = getUniqueCourts(games);

    expect(courts).toEqual([1, 2, 4]);
  });

  it("returns empty array for empty games list", () => {
    expect(getUniqueCourts([])).toEqual([]);
  });
});

describe("filterGamesByRound", () => {
  it("returns only round 2 games", () => {
    const games = [
      createMockGame({ id: "g1", round_number: 1, court_number: 1 }),
      createMockGame({ id: "g2", round_number: 2, court_number: 1 }),
      createMockGame({ id: "g3", round_number: 2, court_number: 2 }),
      createMockGame({ id: "g4", round_number: 3, court_number: 1 }),
    ];

    const filtered = filterGamesByRound(games, 2);

    expect(filtered.length).toBe(2);
    expect(filtered.every((g) => g.round_number === 2)).toBe(true);
    expect(filtered.map((g) => g.id)).toEqual(["g2", "g3"]);
  });

  it("sorts results by court_number ascending", () => {
    const games = [
      createMockGame({ id: "g1", round_number: 1, court_number: 3 }),
      createMockGame({ id: "g2", round_number: 1, court_number: 1 }),
      createMockGame({ id: "g3", round_number: 1, court_number: 2 }),
    ];

    const filtered = filterGamesByRound(games, 1);

    expect(filtered.map((g) => g.court_number)).toEqual([1, 2, 3]);
  });

  it("returns empty array when no games match", () => {
    const games = [
      createMockGame({ round_number: 1 }),
      createMockGame({ round_number: 3 }),
    ];

    const filtered = filterGamesByRound(games, 2);

    expect(filtered).toEqual([]);
  });
});

describe("filterGamesByCourt", () => {
  it("returns only court 3 games, sorted by round", () => {
    const games = [
      createMockGame({ id: "g1", round_number: 2, court_number: 3 }),
      createMockGame({ id: "g2", round_number: 1, court_number: 3 }),
      createMockGame({ id: "g3", round_number: 1, court_number: 1 }),
      createMockGame({ id: "g4", round_number: 3, court_number: 3 }),
    ];

    const filtered = filterGamesByCourt(games, 3);

    expect(filtered.length).toBe(3);
    expect(filtered.every((g) => g.court_number === 3)).toBe(true);
    // Should be sorted by round_number
    expect(filtered.map((g) => g.round_number)).toEqual([1, 2, 3]);
  });

  it("returns empty array when no games match", () => {
    const games = [
      createMockGame({ court_number: 1 }),
      createMockGame({ court_number: 2 }),
    ];

    const filtered = filterGamesByCourt(games, 5);

    expect(filtered).toEqual([]);
  });
});

describe("applyGameFilter", () => {
  const games = [
    createMockGame({ id: "r1c1", round_number: 1, court_number: 1 }),
    createMockGame({ id: "r1c2", round_number: 1, court_number: 2 }),
    createMockGame({ id: "r2c1", round_number: 2, court_number: 1 }),
    createMockGame({ id: "r2c2", round_number: 2, court_number: 2 }),
  ];

  it("filters by round when filterType is 'round'", () => {
    const filterState: GameFilterState = {
      filterType: "round",
      selectedValue: 1,
    };

    const filtered = applyGameFilter(games, filterState);

    expect(filtered.map((g) => g.id)).toEqual(["r1c1", "r1c2"]);
  });

  it("filters by court when filterType is 'court'", () => {
    const filterState: GameFilterState = {
      filterType: "court",
      selectedValue: 2,
    };

    const filtered = applyGameFilter(games, filterState);

    expect(filtered.map((g) => g.id)).toEqual(["r1c2", "r2c2"]);
  });
});

describe("countCompletedGames", () => {
  it("counts games with both scores entered", () => {
    const games = [
      createMockGame({ team1_score: 11, team2_score: 9 }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: 8, team2_score: 11 }),
      createMockGame({ team1_score: 11, team2_score: null }), // incomplete
    ];

    expect(countCompletedGames(games)).toBe(2);
  });

  it("returns 0 when no games are complete", () => {
    const games = [
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: 5, team2_score: null }),
    ];

    expect(countCompletedGames(games)).toBe(0);
  });

  it("returns total when all games are complete", () => {
    const games = [
      createMockGame({ team1_score: 11, team2_score: 5 }),
      createMockGame({ team1_score: 7, team2_score: 11 }),
    ];

    expect(countCompletedGames(games)).toBe(2);
  });
});

describe("getFilterSummary", () => {
  it("returns correct summary text", () => {
    const games = [
      createMockGame({ team1_score: 11, team2_score: 9 }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: 8, team2_score: 11 }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: null, team2_score: null }),
      createMockGame({ team1_score: 11, team2_score: 3 }),
    ];

    const summary = getFilterSummary(games);

    expect(summary).toBe("Showing 6 games | 3 of 6 completed");
  });

  it("handles empty games list", () => {
    expect(getFilterSummary([])).toBe("Showing 0 games | 0 of 0 completed");
  });
});

describe("getDefaultFilterState", () => {
  it("defaults to 'round' filter type with first round selected", () => {
    const games = [
      createMockGame({ round_number: 2 }),
      createMockGame({ round_number: 1 }),
      createMockGame({ round_number: 3 }),
    ];

    const defaultState = getDefaultFilterState(games);

    expect(defaultState.filterType).toBe("round");
    expect(defaultState.selectedValue).toBe(1);
  });

  it("returns selectedValue of 1 when games list is empty", () => {
    const defaultState = getDefaultFilterState([]);

    expect(defaultState.filterType).toBe("round");
    expect(defaultState.selectedValue).toBe(1);
  });
});
