import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { Leaderboard } from "../leaderboard";
import type { PlayerStats } from "@/lib/leaderboard/ranking";
import { formatDate } from "@/lib/dates/dateUtils";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Week = Database["public"]["Tables"]["weeks"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];
type Game = Database["public"]["Tables"]["games"]["Row"];

export default async function LeaderboardPage({
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

  // Fetch players in this season's roster (join through season_players)
  const { data: seasonPlayersData } = await supabase
    .from("season_players")
    .select("player_id, players(*)")
    .eq("season_id", id);

  // Extract the player data from the join result
  const rosterPlayers: Player[] =
    seasonPlayersData?.map((sp) => sp.players as unknown as Player) ?? [];

  // Get all week IDs for this season
  const weekIds = weeks.map((w) => w.id);

  // All games from this season
  let allGames: Game[] = [];

  if (weekIds.length > 0) {
    const { data: gamesData } = await supabase
      .from("games")
      .select("*")
      .in("week_id", weekIds);

    allGames = (gamesData ?? []) as Game[];
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
          <span className="text-foreground">Leaderboard</span>
        </div>

        {/* Season Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold">{season.name}</h1>
          <p className="text-muted-foreground">
            Started {formatDate(season.start_date)} • {season.num_weeks} weeks •{" "}
            {season.num_courts} courts
          </p>
        </header>

        {/* Leaderboard */}
        <Leaderboard seasonId={id} seasonName={season.name} playerStats={playerStats} />
      </div>
    </div>
  );
}
