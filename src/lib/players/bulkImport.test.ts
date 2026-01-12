import { describe, it, expect } from "vitest";
import {
  parsePlayerNames,
  findDuplicates,
  findExistingPlayer,
  getImportPreviewSummary,
  type ExistingPlayer,
} from "./bulkImport";

describe("parsePlayerNames", () => {
  it("parses newline-separated names", () => {
    const input = "Alice\nBob\nCarol";
    const result = parsePlayerNames(input);
    expect(result).toEqual(["Alice", "Bob", "Carol"]);
  });

  it("parses comma-separated names", () => {
    const input = "Alice, Bob, Carol";
    const result = parsePlayerNames(input);
    expect(result).toEqual(["Alice", "Bob", "Carol"]);
  });

  it("parses mixed newline and comma-separated names", () => {
    const input = "Alice\nBob, Carol";
    const result = parsePlayerNames(input);
    expect(result).toEqual(["Alice", "Bob", "Carol"]);
  });

  it("trims whitespace from names", () => {
    const input = "  Alice  ,  Bob  ";
    const result = parsePlayerNames(input);
    expect(result).toEqual(["Alice", "Bob"]);
  });

  it("filters empty entries from double newlines", () => {
    const input = "Alice\n\nBob";
    const result = parsePlayerNames(input);
    expect(result).toEqual(["Alice", "Bob"]);
  });

  it("filters empty entries from double commas", () => {
    const input = "Alice,,Bob";
    const result = parsePlayerNames(input);
    expect(result).toEqual(["Alice", "Bob"]);
  });

  it("handles whitespace-only entries", () => {
    const input = "Alice\n   \nBob";
    const result = parsePlayerNames(input);
    expect(result).toEqual(["Alice", "Bob"]);
  });

  it("collapses multiple spaces in names", () => {
    const input = "John  Doe, Jane   Smith";
    const result = parsePlayerNames(input);
    expect(result).toEqual(["John Doe", "Jane Smith"]);
  });

  it("returns empty array for empty input", () => {
    expect(parsePlayerNames("")).toEqual([]);
    expect(parsePlayerNames("   ")).toEqual([]);
  });
});

describe("findDuplicates", () => {
  const existingPlayers: ExistingPlayer[] = [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
    { id: "3", name: "Carol" },
  ];

  it("identifies duplicate names", () => {
    const names = ["Alice", "David"];
    const result = findDuplicates(names, existingPlayers);
    expect(result.duplicates).toEqual(["Alice"]);
    expect(result.newNames).toEqual(["David"]);
  });

  it("performs case-insensitive comparison", () => {
    const names = ["alice", "ALICE", "AlIcE"];
    const result = findDuplicates(names, existingPlayers);
    expect(result.duplicates).toEqual(["alice", "ALICE", "AlIcE"]);
    expect(result.newNames).toEqual([]);
  });

  it("handles names with extra spaces", () => {
    // Existing player "Alice" should match "  Alice  " after normalization
    const namesWithSpaces = ["  Alice  "];
    const result = findDuplicates(namesWithSpaces, existingPlayers);
    expect(result.duplicates).toEqual(["  Alice  "]);
  });

  it("returns all as new when no existing players", () => {
    const names = ["David", "Eve"];
    const result = findDuplicates(names, []);
    expect(result.duplicates).toEqual([]);
    expect(result.newNames).toEqual(["David", "Eve"]);
  });

  it("returns empty arrays for empty names input", () => {
    const result = findDuplicates([], existingPlayers);
    expect(result.duplicates).toEqual([]);
    expect(result.newNames).toEqual([]);
  });
});

describe("findExistingPlayer", () => {
  const existingPlayers: ExistingPlayer[] = [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
  ];

  it("finds existing player by exact name", () => {
    const result = findExistingPlayer("Alice", existingPlayers);
    expect(result).toEqual({ id: "1", name: "Alice" });
  });

  it("finds existing player case-insensitively", () => {
    const result = findExistingPlayer("alice", existingPlayers);
    expect(result).toEqual({ id: "1", name: "Alice" });
  });

  it("returns undefined when player not found", () => {
    const result = findExistingPlayer("David", existingPlayers);
    expect(result).toBeUndefined();
  });
});

describe("getImportPreviewSummary", () => {
  it("returns message for no names", () => {
    expect(getImportPreviewSummary(0, 0)).toBe("No player names found");
  });

  it("returns message for all new players", () => {
    expect(getImportPreviewSummary(5, 0)).toBe("5 players will be added");
  });

  it("returns singular form for one new player", () => {
    expect(getImportPreviewSummary(1, 0)).toBe("1 player will be added");
  });

  it("returns message for all duplicates", () => {
    expect(getImportPreviewSummary(3, 3)).toBe("All 3 players already exist");
  });

  it("returns singular form for one duplicate", () => {
    expect(getImportPreviewSummary(1, 1)).toBe("All 1 player already exist");
  });

  it("returns message for mixed new and duplicates", () => {
    expect(getImportPreviewSummary(5, 2)).toBe(
      "3 new players will be added, 2 already exist"
    );
  });
});
