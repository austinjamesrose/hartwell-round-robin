import { describe, expect, it } from "vitest";
import {
  validateScore,
  getWinningTeam,
  parseScoreInput,
  WINNING_SCORE,
  MAX_LOSING_SCORE,
} from "./validation";

describe("validateScore", () => {
  describe("valid scores", () => {
    it("accepts 11-0 (team 1 wins)", () => {
      const result = validateScore(11, 0);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("accepts 0-11 (team 2 wins)", () => {
      const result = validateScore(0, 11);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("accepts 11-10 (team 1 wins close game)", () => {
      const result = validateScore(11, 10);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("accepts 10-11 (team 2 wins close game)", () => {
      const result = validateScore(10, 11);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("accepts 11-5 (typical game)", () => {
      const result = validateScore(11, 5);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it("accepts 7-11 (typical game)", () => {
      const result = validateScore(7, 11);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    // Edge cases at boundaries
    it.each([
      [11, 0],
      [11, 1],
      [11, 2],
      [11, 3],
      [11, 4],
      [11, 5],
      [11, 6],
      [11, 7],
      [11, 8],
      [11, 9],
      [11, 10],
      [0, 11],
      [1, 11],
      [2, 11],
      [3, 11],
      [4, 11],
      [5, 11],
      [6, 11],
      [7, 11],
      [8, 11],
      [9, 11],
      [10, 11],
    ])("accepts %i-%i as valid", (team1, team2) => {
      const result = validateScore(team1, team2);
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid scores", () => {
    it("rejects 11-11 (both teams cannot win)", () => {
      const result = validateScore(11, 11);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Both teams cannot score 11");
    });

    it("rejects 10-10 (no winner)", () => {
      const result = validateScore(10, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Exactly one team must score 11");
    });

    it("rejects 5-7 (no winner)", () => {
      const result = validateScore(5, 7);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Exactly one team must score 11");
    });

    it("rejects 0-0 (no winner)", () => {
      const result = validateScore(0, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Exactly one team must score 11");
    });

    it("rejects scores above 11", () => {
      const result = validateScore(12, 10);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Scores cannot exceed 11");
    });

    it("rejects 11-12 (losing score above max)", () => {
      const result = validateScore(11, 12);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Scores cannot exceed 11");
    });
  });

  describe("missing scores", () => {
    it("rejects null team1 score", () => {
      const result = validateScore(null, 11);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Team 1 score is required");
    });

    it("rejects null team2 score", () => {
      const result = validateScore(11, null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Team 2 score is required");
    });

    it("rejects undefined team1 score", () => {
      const result = validateScore(undefined, 11);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Team 1 score is required");
    });

    it("rejects undefined team2 score", () => {
      const result = validateScore(11, undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Team 2 score is required");
    });

    it("rejects both scores null", () => {
      const result = validateScore(null, null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Team 1 score is required");
    });
  });

  describe("invalid input types", () => {
    it("rejects negative scores", () => {
      const result = validateScore(-1, 11);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Team 1 score must be a non-negative integer");
    });

    it("rejects negative team2 score", () => {
      const result = validateScore(11, -5);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Team 2 score must be a non-negative integer");
    });

    it("rejects decimal scores", () => {
      const result = validateScore(10.5, 11);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Team 1 score must be a non-negative integer");
    });
  });
});

describe("getWinningTeam", () => {
  it("returns 1 when team 1 wins", () => {
    expect(getWinningTeam(11, 5)).toBe(1);
    expect(getWinningTeam(11, 0)).toBe(1);
    expect(getWinningTeam(11, 10)).toBe(1);
  });

  it("returns 2 when team 2 wins", () => {
    expect(getWinningTeam(5, 11)).toBe(2);
    expect(getWinningTeam(0, 11)).toBe(2);
    expect(getWinningTeam(10, 11)).toBe(2);
  });

  it("returns null for invalid scores", () => {
    expect(getWinningTeam(10, 10)).toBeNull();
    expect(getWinningTeam(11, 11)).toBeNull();
    expect(getWinningTeam(null, 11)).toBeNull();
    expect(getWinningTeam(11, null)).toBeNull();
  });
});

describe("parseScoreInput", () => {
  it("parses valid numeric strings", () => {
    expect(parseScoreInput("0")).toBe(0);
    expect(parseScoreInput("5")).toBe(5);
    expect(parseScoreInput("11")).toBe(11);
    expect(parseScoreInput("10")).toBe(10);
  });

  it("returns null for empty string", () => {
    expect(parseScoreInput("")).toBeNull();
    expect(parseScoreInput("   ")).toBeNull();
  });

  it("handles strings with whitespace", () => {
    expect(parseScoreInput(" 5 ")).toBe(5);
    expect(parseScoreInput("  11  ")).toBe(11);
  });

  it("returns null for non-numeric input", () => {
    expect(parseScoreInput("abc")).toBeNull();
    expect(parseScoreInput("five")).toBeNull();
  });

  it("returns null for negative numbers", () => {
    expect(parseScoreInput("-5")).toBeNull();
    expect(parseScoreInput("-1")).toBeNull();
  });
});

describe("constants", () => {
  it("has correct winning score", () => {
    expect(WINNING_SCORE).toBe(11);
  });

  it("has correct max losing score", () => {
    expect(MAX_LOSING_SCORE).toBe(10);
  });
});
