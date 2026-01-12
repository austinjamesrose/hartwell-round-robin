import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSeasonSchema,
  calculateWeekDates,
  createSeasonDefaults,
  validateSeasonName,
} from "./validation";

// Mock the Supabase client module
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

// Import the mocked module to control its behavior
import { createClient } from "@/lib/supabase/client";

describe("createSeasonSchema", () => {
  describe("name validation", () => {
    it("should require a name", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "",
        startDate: "2026-01-15",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Season name is required");
      }
    });

    it("should trim whitespace from name", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "  Spring 2026  ",
        startDate: "2026-01-15",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Spring 2026");
      }
    });

    it("should reject names that are only whitespace", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "   ",
        startDate: "2026-01-15",
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid season names", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026 League",
        startDate: "2026-01-15",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("startDate validation", () => {
    it("should require a start date", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Start date is required");
      }
    });

    it("should accept valid date strings", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("numWeeks validation", () => {
    it("should require numWeeks", () => {
      const result = createSeasonSchema.safeParse({
        name: "Spring 2026",
        startDate: "2026-01-15",
        numCourts: 6,
      });

      expect(result.success).toBe(false);
    });

    it("should reject 0 weeks", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numWeeks: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Season must have at least 1 week"
        );
      }
    });

    it("should accept 1 week (minimum)", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numWeeks: 1,
      });

      expect(result.success).toBe(true);
    });

    it("should accept 12 weeks (maximum)", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numWeeks: 12,
      });

      expect(result.success).toBe(true);
    });

    it("should reject 13 weeks (over maximum)", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numWeeks: 13,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Season cannot have more than 12 weeks"
        );
      }
    });

    it("should reject non-integer weeks", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numWeeks: 7.5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Number of weeks must be a whole number"
        );
      }
    });
  });

  describe("numCourts validation", () => {
    it("should require numCourts", () => {
      const result = createSeasonSchema.safeParse({
        name: "Spring 2026",
        startDate: "2026-01-15",
        numWeeks: 7,
      });

      expect(result.success).toBe(false);
    });

    it("should reject 3 courts (under minimum)", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numCourts: 3,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Season must have at least 4 courts"
        );
      }
    });

    it("should accept 4 courts (minimum)", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numCourts: 4,
      });

      expect(result.success).toBe(true);
    });

    it("should accept 8 courts (maximum)", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numCourts: 8,
      });

      expect(result.success).toBe(true);
    });

    it("should reject 9 courts (over maximum)", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numCourts: 9,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Season cannot have more than 8 courts"
        );
      }
    });

    it("should reject non-integer courts", () => {
      const result = createSeasonSchema.safeParse({
        ...createSeasonDefaults,
        name: "Spring 2026",
        startDate: "2026-01-15",
        numCourts: 6.5,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Number of courts must be a whole number"
        );
      }
    });
  });

  describe("full form validation", () => {
    it("should accept a complete valid form", () => {
      const result = createSeasonSchema.safeParse({
        name: "Spring 2026 League",
        startDate: "2026-01-15",
        numWeeks: 8,
        numCourts: 6,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          name: "Spring 2026 League",
          startDate: "2026-01-15",
          numWeeks: 8,
          numCourts: 6,
        });
      }
    });
  });
});

describe("calculateWeekDates", () => {
  it("should calculate correct dates for a 7-week season", () => {
    const weeks = calculateWeekDates("2026-01-15", 7);

    expect(weeks).toHaveLength(7);
    expect(weeks[0]).toEqual({ weekNumber: 1, date: "2026-01-15" });
    expect(weeks[1]).toEqual({ weekNumber: 2, date: "2026-01-22" });
    expect(weeks[2]).toEqual({ weekNumber: 3, date: "2026-01-29" });
    expect(weeks[3]).toEqual({ weekNumber: 4, date: "2026-02-05" });
    expect(weeks[4]).toEqual({ weekNumber: 5, date: "2026-02-12" });
    expect(weeks[5]).toEqual({ weekNumber: 6, date: "2026-02-19" });
    expect(weeks[6]).toEqual({ weekNumber: 7, date: "2026-02-26" });
  });

  it("should handle a single-week season", () => {
    const weeks = calculateWeekDates("2026-03-01", 1);

    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toEqual({ weekNumber: 1, date: "2026-03-01" });
  });

  it("should handle month boundaries correctly", () => {
    // Start on Jan 29, next week should be Feb 5
    const weeks = calculateWeekDates("2026-01-29", 3);

    expect(weeks).toHaveLength(3);
    expect(weeks[0]).toEqual({ weekNumber: 1, date: "2026-01-29" });
    expect(weeks[1]).toEqual({ weekNumber: 2, date: "2026-02-05" });
    expect(weeks[2]).toEqual({ weekNumber: 3, date: "2026-02-12" });
  });

  it("should handle year boundaries correctly", () => {
    // Start on Dec 25, should span into next year
    const weeks = calculateWeekDates("2025-12-25", 3);

    expect(weeks).toHaveLength(3);
    expect(weeks[0]).toEqual({ weekNumber: 1, date: "2025-12-25" });
    expect(weeks[1]).toEqual({ weekNumber: 2, date: "2026-01-01" });
    expect(weeks[2]).toEqual({ weekNumber: 3, date: "2026-01-08" });
  });

  it("should handle maximum 12 weeks", () => {
    const weeks = calculateWeekDates("2026-01-01", 12);

    expect(weeks).toHaveLength(12);
    expect(weeks[0].weekNumber).toBe(1);
    expect(weeks[11].weekNumber).toBe(12);
    // Week 12 should be 11*7 = 77 days after start
    expect(weeks[11].date).toBe("2026-03-18");
  });
});

describe("validateSeasonName", () => {
  const mockAdminId = "test-admin-id";

  // Helper to create a mock Supabase client with configurable response
  function createMockClient(existingSeasons: { id: string; name: string }[] = []) {
    return {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            ilike: vi.fn().mockResolvedValue({
              data: existingSeasons,
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
    // No existing seasons with this name
    vi.mocked(createClient).mockReturnValue(createMockClient([]) as never);

    const result = await validateSeasonName("Test Season", mockAdminId);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns error when duplicate exists (case-insensitive)", async () => {
    // Existing season with same name, different case
    vi.mocked(createClient).mockReturnValue(
      createMockClient([{ id: "season-1", name: "Test Season" }]) as never
    );

    const result = await validateSeasonName("test season", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("A season with this name already exists");
  });

  it("trims whitespace before comparison", async () => {
    // Existing season with name that matches after trimming
    vi.mocked(createClient).mockReturnValue(
      createMockClient([{ id: "season-1", name: "Test Season" }]) as never
    );

    const result = await validateSeasonName("  Test Season  ", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("A season with this name already exists");
  });

  it("returns invalid for empty name", async () => {
    vi.mocked(createClient).mockReturnValue(createMockClient([]) as never);

    const result = await validateSeasonName("", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Season name is required");
  });

  it("returns invalid for whitespace-only name", async () => {
    vi.mocked(createClient).mockReturnValue(createMockClient([]) as never);

    const result = await validateSeasonName("   ", mockAdminId);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Season name is required");
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

    const result = await validateSeasonName("Test Season", mockAdminId);

    // Should fail open and allow the form to proceed
    expect(result.valid).toBe(true);
  });

  it("allows different season names", async () => {
    // Existing season with a different name
    vi.mocked(createClient).mockReturnValue(
      createMockClient([{ id: "season-1", name: "Spring 2026" }]) as never
    );

    const result = await validateSeasonName("Fall 2026", mockAdminId);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
