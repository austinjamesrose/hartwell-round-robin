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
import { Button } from "@/components/ui/button";
import { findActiveWeekId } from "../week-utils";
import { formatDate } from "@/lib/dates/dateUtils";
import { SeasonNav } from "../components/SeasonNav";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Week = Database["public"]["Tables"]["weeks"]["Row"];

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the season (RLS ensures only owner can see it)
  const { data: seasonData, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !seasonData) {
    return notFound();
  }

  const season: Season = seasonData;

  // Fetch the weeks for this season
  const { data: weeksData } = await supabase
    .from("weeks")
    .select("*")
    .eq("season_id", id)
    .order("week_number", { ascending: true });

  const weeks: Week[] = weeksData ?? [];

  // Find the active week
  const activeWeekId = findActiveWeekId(weeks);

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
            href={`/dashboard/seasons/${id}`}
            className="text-muted-foreground hover:text-foreground"
          >
            {season.name}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">Schedule</span>
        </div>

        {/* Season Header */}
        <header className="mb-4">
          <h1 className="text-2xl font-bold">{season.name}</h1>
          <p className="text-muted-foreground">
            Started {formatDate(season.start_date)} • {season.num_weeks} weeks •{" "}
            {season.num_courts} courts
          </p>
        </header>

        {/* Season Navigation */}
        <SeasonNav seasonId={id} />

        {/* Week Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Week Schedule</CardTitle>
            <CardDescription>
              {weeks.length} weeks created for this season
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeks.length > 0 ? (
              <div className="space-y-2">
                {weeks.map((week) => (
                  <Link
                    key={week.id}
                    href={`/dashboard/seasons/${id}/weeks/${week.id}`}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                      week.id === activeWeekId ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Week {week.week_number}</span>
                      <span className="text-muted-foreground">
                        {formatDate(week.date)}
                      </span>
                      {week.id === activeWeekId && (
                        <span className="text-xs text-blue-600">(Active)</span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        week.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : week.status === "finalized"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {week.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No weeks found for this season.</p>
            )}

            {/* Quick access to active week */}
            {weeks.length > 0 && activeWeekId && (
              <div className="mt-4">
                <Link href={`/dashboard/seasons/${id}/weeks/${activeWeekId}`}>
                  <Button className="w-full">
                    Manage Active Week
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
