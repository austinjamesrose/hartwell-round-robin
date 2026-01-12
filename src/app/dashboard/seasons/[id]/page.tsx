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
import { RosterManager } from "./roster-manager";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Week = Database["public"]["Tables"]["weeks"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

// Format date for display (e.g., "Jan 15, 2026")
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SeasonDetailPage({
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

  // notFound() throws, but TypeScript needs explicit return for control flow
  if (error || !seasonData) {
    return notFound();
  }

  // Cast to typed Season after null check
  const season: Season = seasonData;

  // Fetch the weeks for this season
  const { data: weeksData } = await supabase
    .from("weeks")
    .select("*")
    .eq("season_id", id)
    .order("week_number", { ascending: true });

  const weeks: Week[] = weeksData ?? [];

  // Fetch all players owned by this admin (for the player pool dropdown)
  const { data: allPlayersData } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true });

  const allPlayers: Player[] = allPlayersData ?? [];

  // Fetch players in this season's roster (join through season_players)
  const { data: seasonPlayersData } = await supabase
    .from("season_players")
    .select("player_id, players(*)")
    .eq("season_id", id);

  // Extract the player data from the join result
  const rosterPlayers: Player[] =
    seasonPlayersData?.map((sp) => sp.players as unknown as Player) ?? [];

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-bold">{season.name}</h1>
          <p className="text-muted-foreground">
            Started {formatDate(season.start_date)} • {season.num_weeks} weeks •{" "}
            {season.num_courts} courts
          </p>
          <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            {season.status}
          </span>
        </header>

        <div className="space-y-6">
          {/* Roster Management */}
          <RosterManager
            seasonId={id}
            allPlayers={allPlayers}
            rosterPlayers={rosterPlayers}
          />

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
                    <div
                      key={week.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <span className="font-medium">Week {week.week_number}</span>
                        <span className="ml-2 text-muted-foreground">
                          {formatDate(week.date)}
                        </span>
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No weeks found for this season.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
