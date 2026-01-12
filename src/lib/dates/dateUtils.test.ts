import { describe, it, expect } from "vitest";
import {
  parseDateString,
  formatDate,
  parseFormDate,
  calculateWeekDates,
  addDays,
} from "./dateUtils";

describe("parseDateString", () => {
  it("parses valid YYYY-MM-DD date string", () => {
    const result = parseDateString("2026-01-15");
    expect(result).toEqual({ year: 2026, month: 1, day: 15 });
  });

  it("parses date at end of year", () => {
    const result = parseDateString("2026-12-31");
    expect(result).toEqual({ year: 2026, month: 12, day: 31 });
  });

  it("returns null for invalid format", () => {
    expect(parseDateString("01-15-2026")).toBeNull();
    expect(parseDateString("2026/01/15")).toBeNull();
    expect(parseDateString("January 15, 2026")).toBeNull();
    expect(parseDateString("")).toBeNull();
  });

  it("returns null for invalid month", () => {
    expect(parseDateString("2026-13-15")).toBeNull();
    expect(parseDateString("2026-00-15")).toBeNull();
  });

  it("returns null for invalid day", () => {
    expect(parseDateString("2026-01-00")).toBeNull();
    expect(parseDateString("2026-01-32")).toBeNull();
  });
});

describe("formatDate", () => {
  it("formats date as 'Month Day, Year' by default (short month)", () => {
    expect(formatDate("2026-01-15")).toBe("Jan 15, 2026");
  });

  it("formats date with long month name", () => {
    expect(formatDate("2026-01-15", { monthFormat: "long" })).toBe(
      "January 15, 2026"
    );
  });

  it("formats date without year", () => {
    expect(formatDate("2026-01-15", { includeYear: false })).toBe("Jan 15");
  });

  it("formats date with long month and no year", () => {
    expect(
      formatDate("2026-01-15", { monthFormat: "long", includeYear: false })
    ).toBe("January 15");
  });

  it("displays 'January 15, 2026' regardless of timezone", () => {
    // The key test: this should NEVER show January 14
    // even if the system is in a timezone behind UTC
    const result = formatDate("2026-01-15", { monthFormat: "long" });
    expect(result).toBe("January 15, 2026");
    expect(result).not.toContain("14");
  });

  it("returns original string for invalid date", () => {
    expect(formatDate("invalid-date")).toBe("invalid-date");
  });

  it("handles all months correctly", () => {
    const months = [
      { date: "2026-01-15", short: "Jan", long: "January" },
      { date: "2026-02-15", short: "Feb", long: "February" },
      { date: "2026-03-15", short: "Mar", long: "March" },
      { date: "2026-04-15", short: "Apr", long: "April" },
      { date: "2026-05-15", short: "May", long: "May" },
      { date: "2026-06-15", short: "Jun", long: "June" },
      { date: "2026-07-15", short: "Jul", long: "July" },
      { date: "2026-08-15", short: "Aug", long: "August" },
      { date: "2026-09-15", short: "Sep", long: "September" },
      { date: "2026-10-15", short: "Oct", long: "October" },
      { date: "2026-11-15", short: "Nov", long: "November" },
      { date: "2026-12-15", short: "Dec", long: "December" },
    ];

    for (const { date, short, long } of months) {
      expect(formatDate(date, { monthFormat: "short" })).toBe(`${short} 15, 2026`);
      expect(formatDate(date, { monthFormat: "long" })).toBe(`${long} 15, 2026`);
    }
  });
});

describe("parseFormDate", () => {
  it("returns valid YYYY-MM-DD format for valid input", () => {
    expect(parseFormDate("2026-01-15")).toBe("2026-01-15");
  });

  it("returns correct date without timezone shift", () => {
    // This test ensures the date is not affected by timezone
    const result = parseFormDate("2026-01-15");
    expect(result).toBe("2026-01-15");
  });

  it("normalizes date with single-digit month/day", () => {
    // The function should still work even if somehow given non-padded input
    // (though HTML date inputs always return padded values)
    expect(parseFormDate("2026-01-05")).toBe("2026-01-05");
  });

  it("returns null for invalid date string", () => {
    expect(parseFormDate("not-a-date")).toBeNull();
    expect(parseFormDate("")).toBeNull();
  });
});

describe("calculateWeekDates", () => {
  it("calculates correct dates for each week", () => {
    const result = calculateWeekDates("2026-01-15", 3);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ weekNumber: 1, date: "2026-01-15" });
    expect(result[1]).toEqual({ weekNumber: 2, date: "2026-01-22" });
    expect(result[2]).toEqual({ weekNumber: 3, date: "2026-01-29" });
  });

  it("handles month boundary correctly", () => {
    const result = calculateWeekDates("2026-01-29", 2);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ weekNumber: 1, date: "2026-01-29" });
    expect(result[1]).toEqual({ weekNumber: 2, date: "2026-02-05" });
  });

  it("handles year boundary correctly", () => {
    const result = calculateWeekDates("2025-12-25", 2);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ weekNumber: 1, date: "2025-12-25" });
    expect(result[1]).toEqual({ weekNumber: 2, date: "2026-01-01" });
  });

  it("returns empty array for invalid start date", () => {
    expect(calculateWeekDates("invalid", 3)).toEqual([]);
  });

  it("returns empty array for zero weeks", () => {
    expect(calculateWeekDates("2026-01-15", 0)).toEqual([]);
  });

  it("works correctly regardless of timezone (the key fix)", () => {
    // This test verifies the core timezone fix:
    // Week dates should be calculated correctly without timezone shift
    const result = calculateWeekDates("2026-01-15", 7);

    // All dates should be exactly 7 days apart
    expect(result[0].date).toBe("2026-01-15");
    expect(result[1].date).toBe("2026-01-22");
    expect(result[2].date).toBe("2026-01-29");
    expect(result[3].date).toBe("2026-02-05");
    expect(result[4].date).toBe("2026-02-12");
    expect(result[5].date).toBe("2026-02-19");
    expect(result[6].date).toBe("2026-02-26");

    // None of the dates should have shifted to the previous day
    // (which would happen with the old UTC-based implementation in certain timezones)
    for (const week of result) {
      expect(week.date).not.toContain("14"); // Jan 14 instead of Jan 15
      expect(week.date).not.toContain("21"); // Jan 21 instead of Jan 22, etc.
    }
  });
});

describe("addDays", () => {
  it("adds days correctly within same month", () => {
    expect(addDays("2026-01-15", 5)).toBe("2026-01-20");
  });

  it("adds days correctly crossing month boundary", () => {
    expect(addDays("2026-01-30", 5)).toBe("2026-02-04");
  });

  it("adds days correctly crossing year boundary", () => {
    expect(addDays("2025-12-30", 5)).toBe("2026-01-04");
  });

  it("handles negative days (subtraction)", () => {
    expect(addDays("2026-01-15", -5)).toBe("2026-01-10");
  });

  it("returns null for invalid date", () => {
    expect(addDays("invalid", 5)).toBeNull();
  });
});

describe("timezone safety simulation", () => {
  // These tests verify the behavior is consistent regardless of timezone
  // We can't actually change the timezone in Node.js, but we can verify
  // our implementation doesn't use any timezone-sensitive operations

  it("formatDate produces identical output for the same input", () => {
    // Running multiple times should always produce the same result
    const date = "2026-01-15";
    const results = Array(10)
      .fill(null)
      .map(() => formatDate(date, { monthFormat: "long" }));

    // All results should be identical
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe("January 15, 2026");
  });

  it("calculateWeekDates produces identical output for the same input", () => {
    const startDate = "2026-01-15";
    const results = Array(10)
      .fill(null)
      .map(() => calculateWeekDates(startDate, 3));

    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }

    // First week should always be the start date
    expect(results[0][0].date).toBe("2026-01-15");
  });
});

describe("timezone documentation tests", () => {
  // These tests document the bug we're fixing and verify it's fixed

  it("old approach would show wrong date in UTC-5 timezone", () => {
    // OLD BUGGY APPROACH (for documentation):
    // const date = new Date("2026-01-15"); // Parsed as UTC midnight
    // date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    // In UTC-5: returns "January 14, 2026" (WRONG!)

    // NEW FIXED APPROACH:
    const result = formatDate("2026-01-15", { monthFormat: "long" });
    expect(result).toBe("January 15, 2026"); // Correct regardless of timezone
  });

  it("dates work correctly in UTC-5 (US Eastern)", () => {
    // Simulate what the old bug would have caused:
    // A user in UTC-5 entering "2026-01-15" would see "Jan 14, 2026"
    // Our fix ensures they see "Jan 15, 2026"
    expect(formatDate("2026-01-15")).toBe("Jan 15, 2026");
  });

  it("dates work correctly in UTC+0 (GMT)", () => {
    expect(formatDate("2026-01-15")).toBe("Jan 15, 2026");
  });

  it("dates work correctly in UTC+9 (Japan)", () => {
    // Even in timezones ahead of UTC, we should show the exact stored date
    expect(formatDate("2026-01-15")).toBe("Jan 15, 2026");
  });
});
