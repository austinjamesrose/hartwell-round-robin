import { z } from "zod";

// Validation schema for creating a new season
// These rules match the database constraints in supabase/schema.sql
export const createSeasonSchema = z.object({
  // Season name is required (trimmed first, then checked for length)
  name: z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(1, "Season name is required")
        .max(255, "Season name must be 255 characters or less")
    ),

  // Start date is required
  startDate: z.string().min(1, "Start date is required"),

  // Number of weeks: 1-12 (form provides default of 7)
  numWeeks: z
    .number()
    .int("Number of weeks must be a whole number")
    .min(1, "Season must have at least 1 week")
    .max(12, "Season cannot have more than 12 weeks"),

  // Number of courts: 4-8 (form provides default of 6)
  numCourts: z
    .number()
    .int("Number of courts must be a whole number")
    .min(4, "Season must have at least 4 courts")
    .max(8, "Season cannot have more than 8 courts"),
});

export type CreateSeasonFormValues = z.infer<typeof createSeasonSchema>;

// Default values for the create season form
export const createSeasonDefaults: CreateSeasonFormValues = {
  name: "",
  startDate: "",
  numWeeks: 7,
  numCourts: 6,
};

/**
 * Calculates the dates for each week of a season.
 * Each week is 7 days after the previous week.
 *
 * @param startDate - The start date of the season (YYYY-MM-DD format)
 * @param numWeeks - The number of weeks in the season
 * @returns An array of objects containing week number and date
 */
export function calculateWeekDates(
  startDate: string,
  numWeeks: number
): { weekNumber: number; date: string }[] {
  const weeks: { weekNumber: number; date: string }[] = [];
  const start = new Date(startDate);

  for (let i = 0; i < numWeeks; i++) {
    // Calculate date for this week (i weeks after start)
    const weekDate = new Date(start);
    weekDate.setDate(weekDate.getDate() + i * 7);

    // Format as YYYY-MM-DD for database storage
    const formattedDate = weekDate.toISOString().split("T")[0];

    weeks.push({
      weekNumber: i + 1,
      date: formattedDate,
    });
  }

  return weeks;
}
