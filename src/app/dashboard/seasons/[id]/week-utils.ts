// Shared utility functions for week operations
// This file has NO "use client" directive so it can be used by both server and client components

// Week type matching database schema
export type Week = {
  id: string;
  season_id: string;
  week_number: number;
  date: string;
  status: "draft" | "finalized" | "completed";
};

// Get today's date at midnight for comparison
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Find the active week (closest to today that hasn't been completed, or the current/upcoming week)
export function findActiveWeekId(weeks: Week[]): string | null {
  if (weeks.length === 0) return null;

  const today = getToday();

  // First, try to find a week that:
  // 1. Is not completed
  // 2. Has a date closest to today (either today or upcoming)
  const nonCompletedWeeks = weeks.filter((w) => w.status !== "completed");

  if (nonCompletedWeeks.length === 0) {
    // All weeks are completed - return the most recent one
    return weeks[weeks.length - 1].id;
  }

  // Find the week with date closest to today (prefer current/upcoming over past)
  let activeWeek = nonCompletedWeeks[0];
  let smallestDiff = Infinity;

  for (const week of nonCompletedWeeks) {
    const weekDate = new Date(week.date);
    weekDate.setHours(0, 0, 0, 0);
    const diff = weekDate.getTime() - today.getTime();

    // Prefer weeks on or after today, but if all are past, use the most recent
    if (diff >= 0 && diff < smallestDiff) {
      smallestDiff = diff;
      activeWeek = week;
    } else if (smallestDiff === Infinity && diff < 0) {
      // All weeks are in the past - track the closest one
      if (Math.abs(diff) < Math.abs(smallestDiff)) {
        smallestDiff = diff;
        activeWeek = week;
      }
    }
  }

  return activeWeek.id;
}
