import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { RosterManager } from "../roster-manager";
import { formatDate } from "@/lib/dates/dateUtils";
import { SeasonNav } from "../components/SeasonNav";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Week = Database["public"]["Tables"]["weeks"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];
type Game = Database["public"]["Tables"]["games"]["Row"];

export default async function RosterPage({
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

  // Fetch the weeks for this season (for game counts)
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
  const playerGameCounts: Record<string, number> = {};

  // Get all week IDs for this season
  const weekIds = weeks.map((w) => w.id);

  if (weekIds.length > 0 && rosterPlayers.length > 0) {
    // Fetch all games from this season's weeks
    const { data: gamesData } = await supabase
      .from("games")
      .select("*")
      .in("week_id", weekIds);

    const allGames: Game[] = (gamesData ?? []) as Game[];

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
          <span className="text-foreground">Roster</span>
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

        {/* Roster Management */}
        <RosterManager
          seasonId={id}
          allPlayers={allPlayers}
          rosterPlayers={rosterPlayers}
          playerGameCounts={playerGameCounts}
        />
      </div>
    </div>
  );
}
