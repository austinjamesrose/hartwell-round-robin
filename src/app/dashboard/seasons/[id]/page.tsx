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
import { findActiveWeekId } from "./week-navigation";
import { Leaderboard } from "./leaderboard";
import { Button } from "@/components/ui/button";
import type { PlayerStats } from "@/lib/leaderboard/ranking";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Week = Database["public"]["Tables"]["weeks"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];
type Game = Database["public"]["Tables"]["games"]["Row"];

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

  // Get game counts for each player in this season
  // A player appears in games as team1_player1, team1_player2, team2_player1, or team2_player2
  // We need to count games from weeks that belong to this season
  const playerGameCounts: Record<string, number> = {};

  // Get all week IDs for this season
  const weekIds = weeks.map((w) => w.id);

  // All games from this season (for game counts)
  let allGames: Game[] = [];

  if (weekIds.length > 0 && rosterPlayers.length > 0) {
    // Fetch all games from this season's weeks (including scores for leaderboard)
    const { data: gamesData } = await supabase
      .from("games")
      .select("*")
      .in("week_id", weekIds);

    allGames = (gamesData ?? []) as Game[];

    // Count games for each player
    for (const game of allGames) {
      const playerIds = [
        game.team1_player1_id,
        game.team1_player2_id,
        game.team2_player1_id,
        game.team2_player2_id,
      ];
      for (const playerId of playerIds) {
        playerGameCounts[playerId] = (playerGameCounts[playerId] || 0) + 1;
      }
    }
  }

  // Build player stats for leaderboard from completed games
  // Only include games with scores (both team1_score and team2_score are set)
  const playerMap = new Map<string, Player>(rosterPlayers.map((p) => [p.id, p]));
  const playerStatsMap = new Map<string, { totalPoints: number; wins: number; gamesPlayed: number }>();

  for (const game of allGames) {
    // Skip games without scores
    if (game.team1_score === null || game.team2_score === null) continue;

    const team1Won = game.team1_score > game.team2_score;
    const team1Score = game.team1_score;
    const team2Score = game.team2_score;

    // Team 1 players
    for (const playerId of [game.team1_player1_id, game.team1_player2_id]) {
      const stats = playerStatsMap.get(playerId) ?? { totalPoints: 0, wins: 0, gamesPlayed: 0 };
      stats.totalPoints += team1Score;
      stats.gamesPlayed += 1;
      if (team1Won) stats.wins += 1;
      playerStatsMap.set(playerId, stats);
    }

    // Team 2 players
    for (const playerId of [game.team2_player1_id, game.team2_player2_id]) {
      const stats = playerStatsMap.get(playerId) ?? { totalPoints: 0, wins: 0, gamesPlayed: 0 };
      stats.totalPoints += team2Score;
      stats.gamesPlayed += 1;
      if (!team1Won) stats.wins += 1;
      playerStatsMap.set(playerId, stats);
    }
  }

  // Convert to PlayerStats array for leaderboard
  const playerStats: PlayerStats[] = Array.from(playerStatsMap.entries())
    .map(([playerId, stats]) => ({
      playerId,
      playerName: playerMap.get(playerId)?.name ?? "Unknown",
      totalPoints: stats.totalPoints,
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
    }))
    .filter((p) => p.gamesPlayed > 0); // Only include players with at least one completed game

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
            playerGameCounts={playerGameCounts}
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
                  {(() => {
                    const activeWeekId = findActiveWeekId(weeks);
                    return weeks.map((week) => (
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
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground">No weeks found for this season.</p>
              )}

              {/* Quick access to active week */}
              {weeks.length > 0 && (
                <div className="mt-4">
                  <Link href={`/dashboard/seasons/${id}/weeks/${findActiveWeekId(weeks)}`}>
                    <Button className="w-full">
                      Manage Active Week
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Leaderboard seasonId={id} playerStats={playerStats} />
        </div>
      </div>
    </div>
  );
}
