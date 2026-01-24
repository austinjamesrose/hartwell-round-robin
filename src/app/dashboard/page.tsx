import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loggers } from "@/lib/logger";
import type { Database } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./logout-button";
import { formatDate } from "@/lib/dates/dateUtils";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Week = Database["public"]["Tables"]["weeks"]["Row"];

// Season with its weeks for computing current week
type SeasonWithWeeks = Season & { weeks: Week[] };

// Calculate the current/active week for a season based on today's date
// Returns the week number (1-indexed) or null if no weeks exist
function getCurrentWeek(weeks: Week[]): number | null {
  if (weeks.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort weeks by date ascending
  const sortedWeeks = [...weeks].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find the most recent week that has started (date <= today)
  // or the first upcoming week if season hasn't started yet
  for (let i = sortedWeeks.length - 1; i >= 0; i--) {
    const weekDate = new Date(sortedWeeks[i].date);
    weekDate.setHours(0, 0, 0, 0);
    if (weekDate <= today) {
      return sortedWeeks[i].week_number;
    }
  }

  // Season hasn't started yet - return week 1
  return sortedWeeks[0].week_number;
}

// Get the status badge styling
function getStatusBadgeClass(status: Season["status"]): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "archived":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get the current user (middleware ensures we're authenticated, but double-check)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all seasons for this admin with their weeks
  // RLS ensures we only get seasons where admin_id = current user
  const { data: seasonsData, error } = await supabase
    .from("seasons")
    .select(
      `
      *,
      weeks (*)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    loggers.dashboard.error("Failed to fetch seasons", error);
  }

  // Type the data properly - weeks comes as an array from the join
  // Use unknown as intermediate cast since Supabase types don't fully express the join result
  const seasons: SeasonWithWeeks[] = (seasonsData ?? []) as unknown as SeasonWithWeeks[];

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <LogoutButton />
        </header>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link href="/dashboard/seasons/new">
            <Button size="lg">+ Create New Season</Button>
          </Link>
          <Link href="/dashboard/players">
            <Button size="lg" variant="outline">
              Manage Players
            </Button>
          </Link>
        </div>

        {/* Seasons List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Seasons</CardTitle>
            <CardDescription>
              {seasons.length === 0
                ? "No seasons yet. Create one to get started."
                : `${seasons.length} season${seasons.length === 1 ? "" : "s"}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {seasons.length > 0 ? (
              <div className="space-y-3">
                {seasons.map((season) => {
                  const currentWeek = getCurrentWeek(season.weeks);
                  return (
                    <Link
                      key={season.id}
                      href={`/dashboard/seasons/${season.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{season.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(season.start_date)}
                            {currentWeek !== null && (
                              <span>
                                {" "}
                                • Week {currentWeek} of {season.num_weeks}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                              season.status
                            )}`}
                          >
                            {season.status}
                          </span>
                          <span className="text-muted-foreground">→</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Create your first season to start managing your pickleball league.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
