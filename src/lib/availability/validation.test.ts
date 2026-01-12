import { describe, it, expect } from "vitest";
import {
  validateAvailableCount,
  isAtBoundary,
  getAvailabilityWarning,
  MIN_AVAILABLE_PLAYERS,
  MAX_AVAILABLE_PLAYERS,
} from "./validation";

describe("validateAvailableCount", () => {
  it("returns too_few when count is below minimum", () => {
    const result = validateAvailableCount(20);
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("too_few");
    expect(result.message).toContain("Need at least 24");
    expect(result.message).toContain("currently 20");
  });

  it("returns too_few when count is 0", () => {
    const result = validateAvailableCount(0);
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("too_few");
  });

  it("returns too_few when count is 23", () => {
    const result = validateAvailableCount(23);
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("too_few");
  });

  it("returns valid when count is exactly 24 (minimum)", () => {
    const result = validateAvailableCount(24);
    expect(result.isValid).toBe(true);
    expect(result.status).toBe("valid");
    expect(result.message).toBe("24 players available");
  });

  it("returns valid when count is in the middle of range (28)", () => {
    const result = validateAvailableCount(28);
    expect(result.isValid).toBe(true);
    expect(result.status).toBe("valid");
    expect(result.message).toBe("28 players available");
  });

  it("returns valid when count is exactly 32 (maximum)", () => {
    const result = validateAvailableCount(32);
    expect(result.isValid).toBe(true);
    expect(result.status).toBe("valid");
    expect(result.message).toBe("32 players available");
  });

  it("returns too_many when count is 33", () => {
    const result = validateAvailableCount(33);
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("too_many");
  });

  it("returns too_many when count is above maximum", () => {
    const result = validateAvailableCount(40);
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("too_many");
    expect(result.message).toContain("Maximum 32");
    expect(result.message).toContain("currently 40");
  });
});

describe("isAtBoundary", () => {
  it("returns true at minimum boundary (24)", () => {
    expect(isAtBoundary(MIN_AVAILABLE_PLAYERS)).toBe(true);
    expect(isAtBoundary(24)).toBe(true);
  });

  it("returns true at maximum boundary (32)", () => {
    expect(isAtBoundary(MAX_AVAILABLE_PLAYERS)).toBe(true);
    expect(isAtBoundary(32)).toBe(true);
  });

  it("returns false in the middle of range", () => {
    expect(isAtBoundary(28)).toBe(false);
    expect(isAtBoundary(25)).toBe(false);
    expect(isAtBoundary(31)).toBe(false);
  });

  it("returns false outside of range", () => {
    expect(isAtBoundary(20)).toBe(false);
    expect(isAtBoundary(40)).toBe(false);
  });
});

describe("getAvailabilityWarning", () => {
  it("returns warning when close to minimum (24-26)", () => {
    expect(getAvailabilityWarning(24)).toContain("minimum");
    expect(getAvailabilityWarning(25)).toContain("minimum");
    expect(getAvailabilityWarning(26)).toContain("minimum");
  });

  it("returns warning when close to maximum (30-32)", () => {
    expect(getAvailabilityWarning(30)).toContain("maximum");
    expect(getAvailabilityWarning(31)).toContain("maximum");
    expect(getAvailabilityWarning(32)).toContain("maximum");
  });

  it("returns null in the middle of range", () => {
    expect(getAvailabilityWarning(27)).toBeNull();
    expect(getAvailabilityWarning(28)).toBeNull();
    expect(getAvailabilityWarning(29)).toBeNull();
  });

  it("returns null outside of range", () => {
    // Below range - no warning, validation will fail
    expect(getAvailabilityWarning(20)).toBeNull();
    // Above range - no warning, validation will fail
    expect(getAvailabilityWarning(40)).toBeNull();
  });
});

describe("constants", () => {
  it("MIN_AVAILABLE_PLAYERS is 24", () => {
    expect(MIN_AVAILABLE_PLAYERS).toBe(24);
  });

  it("MAX_AVAILABLE_PLAYERS is 32", () => {
    expect(MAX_AVAILABLE_PLAYERS).toBe(32);
  });
});
