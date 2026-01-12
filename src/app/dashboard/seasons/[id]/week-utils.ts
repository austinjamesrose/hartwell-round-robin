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

// Find the active week (earliest non-completed week by week_number)
export function findActiveWeekId(weeks: Week[]): string | null {
  if (weeks.length === 0) return null;

  // Sort by week_number to ensure we get the earliest
  const sortedWeeks = [...weeks].sort((a, b) => a.week_number - b.week_number);

  // Find the first (earliest) non-completed week
  const activeWeek = sortedWeeks.find((w) => w.status !== "completed");

  if (activeWeek) {
    return activeWeek.id;
  }

  // All weeks are completed - return the last one (most recent by week_number)
  return sortedWeeks[sortedWeeks.length - 1].id;
}
