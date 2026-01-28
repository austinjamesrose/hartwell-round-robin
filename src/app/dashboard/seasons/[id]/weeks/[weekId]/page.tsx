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
import {
  AvailabilityManager,
  type PlayerAvailability,
} from "./availability-manager";
import { ScheduleGenerator } from "./schedule-generator";
import { ScheduleViewer } from "./schedule-viewer";
import { ScoreEntry } from "./score-entry";
import { countGamesWithScores } from "@/lib/weeks/validation";
import { formatDate } from "@/lib/dates/dateUtils";
import { calculateExpectedGamesPerPlayer } from "@/lib/scheduling/generateSchedule";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Week = Database["public"]["Tables"]["weeks"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];

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

  // Fetch players in this season's roster (join through season_players)
  const { data: seasonPlayersData } = await supabase
    .from("season_players")
    .select("player_id, players(*)")
    .eq("season_id", seasonId);

  // Extract the player data from the join result
  const rosterPlayers: Player[] =
    seasonPlayersData?.map((sp) => sp.players as unknown as Player) ?? [];

  // Fetch existing availability records for this week
  const { data: availabilityData } = await supabase
    .from("player_availability")
    .select("id, player_id, is_available")
    .eq("week_id", weekId);

  // Create a map of player_id -> availability record
  const availabilityMap = new Map(
    availabilityData?.map((a) => [a.player_id, a]) ?? []
  );

  // Build the player availability array
  // Default: all players are available if no record exists
  const playerAvailability: PlayerAvailability[] = rosterPlayers.map((player) => {
    const record = availabilityMap.get(player.id);
    return {
      playerId: player.id,
      playerName: player.name,
      isAvailable: record?.is_available ?? true, // Default to available
      availabilityId: record?.id ?? null,
    };
  });

  // Get available players for schedule generation
  const availablePlayers = playerAvailability
    .filter((p) => p.isAvailable)
    .map((p) => ({ id: p.playerId, name: p.playerName }));

  // Fetch all games for this week (for schedule display)
  const { data: gamesData } = await supabase
    .from("games")
    .select("*")
    .eq("week_id", weekId)
    .order("round_number", { ascending: true })
    .order("court_number", { ascending: true });

  const games = gamesData ?? [];
  const hasExistingSchedule = games.length > 0;

  // Count games with scores (for unfinalize blocking)
  const gamesWithScoresCount = countGamesWithScores(games);

  // Fetch all byes for this week
  const { data: byesData } = await supabase
    .from("byes")
    .select("*")
    .eq("week_id", weekId)
    .order("round_number", { ascending: true });

  const byesRecords = byesData ?? [];

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
              </div>
            </CardContent>
          </Card>

          {/* Player Availability (hide for completed weeks) */}
          {currentWeek.status !== "completed" && (
            <AvailabilityManager
              weekId={weekId}
              playerAvailability={playerAvailability}
            />
          )}

          {/* Schedule Generation (only show for draft weeks) */}
          {currentWeek.status === "draft" && (
            <ScheduleGenerator
              weekId={weekId}
              numCourts={season.num_courts}
              availablePlayers={availablePlayers}
              hasExistingSchedule={hasExistingSchedule}
              weekStatus={currentWeek.status}
              roundsPerWeek={season.rounds_per_week}
            />
          )}

          {/* Schedule Viewer (shows saved schedule from database) */}
          <ScheduleViewer
            games={games}
            byes={byesRecords}
            players={rosterPlayers.map((p) => ({ id: p.id, name: p.name }))}
            scheduleWarnings={currentWeek.schedule_warnings}
            weekStatus={currentWeek.status}
            weekId={weekId}
            gamesWithScoresCount={gamesWithScoresCount}
            scheduleInfo={{
              seasonName: season.name,
              weekNumber: currentWeek.week_number,
              weekDate: formatDate(currentWeek.date),
            }}
            expectedGamesPerPlayer={
              season.rounds_per_week
                ? calculateExpectedGamesPerPlayer(
                    availablePlayers.length,
                    season.num_courts,
                    season.rounds_per_week
                  )
                : null
            }
          />

          {/* Score Entry (shows for finalized/completed weeks) */}
          <ScoreEntry
            games={games}
            players={rosterPlayers.map((p) => ({ id: p.id, name: p.name }))}
            weekStatus={currentWeek.status}
          />
        </div>
      </div>
    </div>
  );
}
