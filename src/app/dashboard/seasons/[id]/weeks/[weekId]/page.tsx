import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WeekNavigation } from "../../week-navigation";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Week = Database["public"]["Tables"]["weeks"]["Row"];

// Format date for display (e.g., "Jan 15, 2026")
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function WeekManagementPage({
  params,
}: {
  params: Promise<{ id: string; weekId: string }>;
}) {
  const { id: seasonId, weekId } = await params;
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the season (RLS ensures only owner can see it)
  const { data: seasonData, error: seasonError } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", seasonId)
    .single();

  if (seasonError || !seasonData) {
    return notFound();
  }

  const season: Season = seasonData;

  // Fetch all weeks for this season (for navigation)
  const { data: weeksData } = await supabase
    .from("weeks")
    .select("*")
    .eq("season_id", seasonId)
    .order("week_number", { ascending: true });

  const weeks: Week[] = weeksData ?? [];

  // Find the current week
  const currentWeek = weeks.find((w) => w.id === weekId);

  if (!currentWeek) {
    return notFound();
  }

  // TODO: In future stories, we'll fetch:
  // - Player availability for this week
  // - Games/schedule for this week
  // - Byes for this week

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/dashboard/seasons/${seasonId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            {season.name}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">Week {currentWeek.week_number}</span>
        </div>

        {/* Week navigation */}
        <WeekNavigation
          seasonId={seasonId}
          weeks={weeks}
          currentWeekId={weekId}
        />

        <div className="mt-6 space-y-6">
          {/* Week Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Week {currentWeek.week_number} Overview</CardTitle>
              <CardDescription>
                {formatDate(currentWeek.date)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      currentWeek.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : currentWeek.status === "finalized"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {currentWeek.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Courts</span>
                  <span>{season.num_courts}</span>
                </div>

                {/* Placeholder for future functionality */}
                <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                  <p>Schedule management coming soon...</p>
                  <p className="mt-1 text-sm">
                    Mark player availability, generate schedule, and enter scores.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule warnings if any */}
          {currentWeek.schedule_warnings && currentWeek.schedule_warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Schedule Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-yellow-800">
                  {currentWeek.schedule_warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
