import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  newPlayerSchema,
  addPlayerToSeasonSchema,
  isPlayerInSeason,
  validatePlayerName,
  checkPlayerRemoval,
  normalizePlayerName,
  validatePlayerNameForDuplicate,
} from "./validation";

// Mock the Supabase client module
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

// Import the mocked module to control its behavior
import { createClient } from "@/lib/supabase/client";

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

describe("checkPlayerRemoval", () => {
  it("allows removal when player has no games", () => {
    const result = checkPlayerRemoval(0);
    expect(result.canRemove).toBe(true);
    expect(result.gameCount).toBe(0);
    expect(result.message).toBe("Player can be removed from this season");
  });

  it("blocks removal when player has 1 game", () => {
    const result = checkPlayerRemoval(1);
    expect(result.canRemove).toBe(false);
    expect(result.gameCount).toBe(1);
    expect(result.message).toBe("Player has 1 game recorded");
  });

  it("blocks removal when player has multiple games", () => {
    const result = checkPlayerRemoval(24);
    expect(result.canRemove).toBe(false);
    expect(result.gameCount).toBe(24);
    expect(result.message).toBe("Player has 24 games recorded");
  });

  it("uses correct singular/plural for game count", () => {
    // Singular for 1 game
    expect(checkPlayerRemoval(1).message).toBe("Player has 1 game recorded");
    // Plural for 0, 2, or more games
    expect(checkPlayerRemoval(2).message).toBe("Player has 2 games recorded");
    expect(checkPlayerRemoval(8).message).toBe("Player has 8 games recorded");
  });
});

describe("normalizePlayerName", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizePlayerName("  John Doe  ")).toBe("John Doe");
  });

  it("collapses multiple spaces to single space", () => {
    expect(normalizePlayerName("John  Doe")).toBe("John Doe");
    expect(normalizePlayerName("John   Doe")).toBe("John Doe");
    expect(normalizePlayerName("John    Doe")).toBe("John Doe");
  });

  it("handles combined trimming and collapsing", () => {
    expect(normalizePlayerName("  John   Doe  ")).toBe("John Doe");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizePlayerName("   ")).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(normalizePlayerName("")).toBe("");
  });
});

describe("validatePlayerNameForDuplicate", () => {
  const mockAdminId = "test-admin-id";

  // Helper to create a mock Supabase client with configurable response
  function createMockClient(existingPlayers: { id: string; name: string }[] = []) {
    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockResolvedValue({
              data: existingPlayers,
              error: null,
            }),
          }),
        }),
      }),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns valid when no duplicate exists", async () => {
    // No existing players with this name
    vi.mocked(createClient).mockReturnValue(createMockClient([]) as never);

    const result = await validatePlayerNameForDuplicate("John Doe", mockAdminId);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.existingPlayer).toBeUndefined();
  });

  it("returns error when duplicate exists (case-insensitive)", async () => {
    // Existing player with same name, different case
    vi.mocked(createClient).mockReturnValue(
      createMockClient([{ id: "player-1", name: "John Doe" }]) as never
    );

    const result = await validatePlayerNameForDuplicate("john doe", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("A player with this name already exists");
    expect(result.existingPlayer).toEqual({ id: "player-1", name: "John Doe" });
  });

  it("collapses multiple spaces and detects duplicate", async () => {
    // Existing player 'John Doe' should match 'John  Doe' (with multiple spaces)
    vi.mocked(createClient).mockReturnValue(
      createMockClient([{ id: "player-1", name: "John Doe" }]) as never
    );

    const result = await validatePlayerNameForDuplicate("John  Doe", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("A player with this name already exists");
    expect(result.existingPlayer).toEqual({ id: "player-1", name: "John Doe" });
  });

  it("trims whitespace before comparison", async () => {
    // Existing player should match input with leading/trailing whitespace
    vi.mocked(createClient).mockReturnValue(
      createMockClient([{ id: "player-1", name: "John Doe" }]) as never
    );

    const result = await validatePlayerNameForDuplicate("  John Doe  ", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("A player with this name already exists");
  });

  it("returns invalid for empty name", async () => {
    vi.mocked(createClient).mockReturnValue(createMockClient([]) as never);

    const result = await validatePlayerNameForDuplicate("", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Player name is required");
  });

  it("returns invalid for whitespace-only name", async () => {
    vi.mocked(createClient).mockReturnValue(createMockClient([]) as never);

    const result = await validatePlayerNameForDuplicate("   ", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Player name is required");
  });

  it("returns valid when database returns error (fails open)", async () => {
    // Mock a database error
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database connection failed" },
            }),
          }),
        }),
      }),
    } as never);

    const result = await validatePlayerNameForDuplicate("John Doe", mockAdminId);

    // Should fail open and allow the form to proceed
    expect(result.valid).toBe(true);
  });

  it("allows different player names", async () => {
    // Existing player with a different name
    vi.mocked(createClient).mockReturnValue(
      createMockClient([{ id: "player-1", name: "Jane Smith" }]) as never
    );

    const result = await validatePlayerNameForDuplicate("John Doe", mockAdminId);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns existing player info when duplicate found", async () => {
    vi.mocked(createClient).mockReturnValue(
      createMockClient([{ id: "player-123", name: "John Doe" }]) as never
    );

    const result = await validatePlayerNameForDuplicate("John Doe", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.existingPlayer).toEqual({ id: "player-123", name: "John Doe" });
  });
});
