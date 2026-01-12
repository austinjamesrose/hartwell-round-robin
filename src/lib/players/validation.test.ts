import { describe, it, expect } from "vitest";
import {
  newPlayerSchema,
  addPlayerToSeasonSchema,
  isPlayerInSeason,
  validatePlayerName,
} from "./validation";

describe("newPlayerSchema", () => {
  it("validates a valid player name", () => {
    const result = newPlayerSchema.safeParse({ name: "John Doe" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John Doe");
    }
  });

  it("trims whitespace from player names", () => {
    const result = newPlayerSchema.safeParse({ name: "  John Doe  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John Doe");
    }
  });

  it("rejects empty player name", () => {
    const result = newPlayerSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only player name", () => {
    const result = newPlayerSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });
});

describe("addPlayerToSeasonSchema", () => {
  it("validates a valid UUID", () => {
    const validUuid = "123e4567-e89b-12d3-a456-426614174000";
    const result = addPlayerToSeasonSchema.safeParse({ playerId: validUuid });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID format", () => {
    const result = addPlayerToSeasonSchema.safeParse({ playerId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = addPlayerToSeasonSchema.safeParse({ playerId: "" });
    expect(result.success).toBe(false);
  });
});

describe("isPlayerInSeason", () => {
  it("returns true when player is in the season", () => {
    const existingPlayerIds = new Set(["player-1", "player-2", "player-3"]);
    expect(isPlayerInSeason(existingPlayerIds, "player-2")).toBe(true);
  });

  it("returns false when player is not in the season", () => {
    const existingPlayerIds = new Set(["player-1", "player-2", "player-3"]);
    expect(isPlayerInSeason(existingPlayerIds, "player-4")).toBe(false);
  });

  it("returns false for empty set", () => {
    const existingPlayerIds = new Set<string>();
    expect(isPlayerInSeason(existingPlayerIds, "player-1")).toBe(false);
  });
});

describe("validatePlayerName", () => {
  it("returns trimmed name for valid input", () => {
    expect(validatePlayerName("John Doe")).toBe("John Doe");
    expect(validatePlayerName("  Jane Smith  ")).toBe("Jane Smith");
  });

  it("throws error for empty string", () => {
    expect(() => validatePlayerName("")).toThrow("Player name cannot be empty");
  });

  it("throws error for whitespace-only string", () => {
    expect(() => validatePlayerName("   ")).toThrow("Player name cannot be empty");
  });
});
