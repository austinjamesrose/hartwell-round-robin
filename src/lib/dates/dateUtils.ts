/**
 * Timezone-safe date utilities for the Hartwell Round Robin app.
 *
 * The key insight: When storing dates in the database as YYYY-MM-DD strings,
 * we want to display and calculate with those dates WITHOUT timezone conversion.
 * A date stored as "2026-01-15" should always display as "January 15, 2026"
 * regardless of the user's timezone.
 *
 * The problem with `new Date("2026-01-15")`:
 * - JavaScript interprets this as midnight UTC
 * - In timezones behind UTC (e.g., US Central = UTC-6), this becomes
 *   6:00 PM on January 14th local time
 * - toLocaleDateString() then shows "January 14, 2026" instead of "January 15, 2026"
 *
 * Solution: Parse and format dates by extracting/building the components directly,
 * avoiding timezone-affected Date object methods for display.
 */

/**
 * Parse a YYYY-MM-DD date string into year, month, day components.
 * Returns null if the string is invalid.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Object with year, month (1-12), day, or null if invalid
 */
export function parseDateString(dateString: string): {
  year: number;
  month: number;
  day: number;
} | null {
  // Validate format with regex
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Basic validation of ranges
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { year, month, day };
}

/**
 * Format a YYYY-MM-DD date string for display without timezone issues.
 * Displays dates exactly as stored, regardless of user's timezone.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param options - Formatting options
 * @returns Formatted date string (e.g., "January 15, 2026" or "Jan 15, 2026")
 */
export function formatDate(
  dateString: string,
  options: {
    monthFormat?: "long" | "short";
    includeYear?: boolean;
  } = {}
): string {
  const { monthFormat = "short", includeYear = true } = options;

  const parsed = parseDateString(dateString);
  if (!parsed) {
    // Fallback for invalid dates - return as-is
    return dateString;
  }

  const { year, month, day } = parsed;

  // Month names
  const monthNames = {
    long: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    short: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
  };

  const monthName = monthNames[monthFormat][month - 1];

  if (includeYear) {
    return `${monthName} ${day}, ${year}`;
  }
  return `${monthName} ${day}`;
}

/**
 * Parse a form date input value into a YYYY-MM-DD string.
 * HTML date inputs already return YYYY-MM-DD format, but this
 * function validates and normalizes the input.
 *
 * @param formValue - Value from an HTML date input
 * @returns YYYY-MM-DD string, or null if invalid
 */
export function parseFormDate(formValue: string): string | null {
  const parsed = parseDateString(formValue);
  if (!parsed) {
    return null;
  }

  // Return normalized YYYY-MM-DD format
  const { year, month, day } = parsed;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Calculate week dates from a start date, adding 7 days for each subsequent week.
 * This is timezone-safe because it operates on date components directly.
 *
 * @param startDate - The start date in YYYY-MM-DD format
 * @param numWeeks - Number of weeks to calculate
 * @returns Array of objects with weekNumber and date (YYYY-MM-DD)
 */
export function calculateWeekDates(
  startDate: string,
  numWeeks: number
): { weekNumber: number; date: string }[] {
  const parsed = parseDateString(startDate);
  if (!parsed) {
    return [];
  }

  const weeks: { weekNumber: number; date: string }[] = [];

  for (let i = 0; i < numWeeks; i++) {
    // Create a local date (not UTC) for the start date
    // Using year, month-1, day ensures we get a local date without timezone offset
    const weekDate = new Date(parsed.year, parsed.month - 1, parsed.day + i * 7);

    // Extract components from the local date
    const year = weekDate.getFullYear();
    const month = String(weekDate.getMonth() + 1).padStart(2, "0");
    const day = String(weekDate.getDate()).padStart(2, "0");

    weeks.push({
      weekNumber: i + 1,
      date: `${year}-${month}-${day}`,
    });
  }

  return weeks;
}

/**
 * Add days to a YYYY-MM-DD date string.
 * Returns the resulting date as a YYYY-MM-DD string.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative)
 * @returns New date in YYYY-MM-DD format, or null if input invalid
 */
export function addDays(dateString: string, days: number): string | null {
  const parsed = parseDateString(dateString);
  if (!parsed) {
    return null;
  }

  // Create local date and add days
  const date = new Date(parsed.year, parsed.month - 1, parsed.day + days);

  // Extract components from local date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
