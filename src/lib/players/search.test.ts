import { describe, it, expect } from "vitest";
import { filterPlayers } from "./search";

// Helper to create mock players
function createMockPlayer(id: string, name: string) {
  return {
    id,
    name,
    admin_id: "admin-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("filterPlayers", () => {
  const mockPlayers = [
    createMockPlayer("1", "John Doe"),
    createMockPlayer("2", "Jane Smith"),
    createMockPlayer("3", "Bob Johnson"),
    createMockPlayer("4", "Alice Williams"),
    createMockPlayer("5", "John Smith"),
  ];

  describe("basic filtering", () => {
    it("returns players with matching name (case-insensitive lowercase)", () => {
      const result = filterPlayers(mockPlayers, "john");
      // "john" matches: John Doe, Bob Johnson, John Smith
      expect(result).toHaveLength(3);
      expect(result.map((p) => p.name)).toContain("John Doe");
      expect(result.map((p) => p.name)).toContain("Bob Johnson");
      expect(result.map((p) => p.name)).toContain("John Smith");
    });

    it("returns players with matching name (case-insensitive uppercase)", () => {
      const result = filterPlayers(mockPlayers, "JOHN");
      // "JOHN" matches: John Doe, Bob Johnson, John Smith (case-insensitive)
      expect(result).toHaveLength(3);
      expect(result.map((p) => p.name)).toContain("John Doe");
      expect(result.map((p) => p.name)).toContain("Bob Johnson");
      expect(result.map((p) => p.name)).toContain("John Smith");
    });

    it("returns players with matching name (mixed case)", () => {
      const result = filterPlayers(mockPlayers, "JoHn");
      // Same as above - case insensitive
      expect(result).toHaveLength(3);
    });

    it("returns empty array when no match", () => {
      const result = filterPlayers(mockPlayers, "xyz");
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("returns empty array when searching for non-existent name", () => {
      const result = filterPlayers(mockPlayers, "Charlie");
      expect(result).toHaveLength(0);
    });
  });

  describe("partial matching", () => {
    it("matches partial first name", () => {
      const result = filterPlayers(mockPlayers, "Jan");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Jane Smith");
    });

    it("matches partial last name", () => {
      const result = filterPlayers(mockPlayers, "Smith");
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.name)).toContain("Jane Smith");
      expect(result.map((p) => p.name)).toContain("John Smith");
    });

    it("matches substring in middle of name", () => {
      const result = filterPlayers(mockPlayers, "illi");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Alice Williams");
    });
  });

  describe("empty/whitespace queries", () => {
    it("returns all players when search query is empty string", () => {
      const result = filterPlayers(mockPlayers, "");
      expect(result).toHaveLength(5);
      expect(result).toEqual(mockPlayers);
    });

    it("returns all players when search query is only whitespace", () => {
      const result = filterPlayers(mockPlayers, "   ");
      expect(result).toHaveLength(5);
      expect(result).toEqual(mockPlayers);
    });

    it("trims whitespace from search query before matching", () => {
      const result = filterPlayers(mockPlayers, "  john  ");
      // Same as "john" - matches John Doe, Bob Johnson, John Smith
      expect(result).toHaveLength(3);
      expect(result.map((p) => p.name)).toContain("John Doe");
      expect(result.map((p) => p.name)).toContain("Bob Johnson");
      expect(result.map((p) => p.name)).toContain("John Smith");
    });
  });

  describe("edge cases", () => {
    it("returns empty array when players array is empty", () => {
      const result = filterPlayers([], "john");
      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("returns all players matching single character", () => {
      const result = filterPlayers(mockPlayers, "o");
      // John Doe, Bob Johnson, John Smith all contain 'o'
      expect(result).toHaveLength(3);
    });

    it("handles special characters in search query", () => {
      const playersWithSpecialChars = [
        createMockPlayer("1", "John O'Brien"),
        createMockPlayer("2", "Mary-Jane Watson"),
      ];
      const result = filterPlayers(playersWithSpecialChars, "O'B");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("John O'Brien");
    });

    it("handles hyphenated names", () => {
      const playersWithHyphens = [
        createMockPlayer("1", "Mary-Jane Watson"),
        createMockPlayer("2", "John Smith"),
      ];
      const result = filterPlayers(playersWithHyphens, "mary-jane");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Mary-Jane Watson");
    });
  });
});
