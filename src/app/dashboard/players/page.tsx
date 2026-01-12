import { redirect } from "next/navigation";
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
import { PlayerPoolManager } from "./player-pool-manager";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Season = Database["public"]["Tables"]["seasons"]["Row"];

// Player with the seasons they're assigned to
export type PlayerWithSeasons = Player & {
  seasons: Season[];
};

export default async function PlayersPage() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all players for this admin
  const { data: playersData, error: playersError } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true });

  if (playersError) {
    console.error("Error fetching players:", playersError);
  }

  const players = (playersData ?? []) as Player[];

  // Fetch all season_players to map which seasons each player is in
  const { data: seasonPlayersData, error: spError } = await supabase
    .from("season_players")
    .select("player_id, season_id");

  if (spError) {
    console.error("Error fetching season_players:", spError);
  }

  const seasonPlayers = seasonPlayersData ?? [];

  // Fetch all seasons for this admin
  const { data: seasonsData, error: seasonsError } = await supabase
    .from("seasons")
    .select("*")
    .order("name", { ascending: true });

  if (seasonsError) {
    console.error("Error fetching seasons:", seasonsError);
  }

  const seasons = (seasonsData ?? []) as Season[];
  const seasonsById = new Map(seasons.map((s) => [s.id, s]));

  // Build map of player_id -> list of seasons
  const playerSeasonMap = new Map<string, Season[]>();
  for (const sp of seasonPlayers) {
    const season = seasonsById.get(sp.season_id);
    if (season) {
      const existing = playerSeasonMap.get(sp.player_id) || [];
      existing.push(season);
      playerSeasonMap.set(sp.player_id, existing);
    }
  }

  // Combine players with their seasons
  const playersWithSeasons: PlayerWithSeasons[] = players.map((player) => ({
    ...player,
    seasons: playerSeasonMap.get(player.id) || [],
  }));

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Player Pool</h1>
            <p className="text-muted-foreground">
              Manage all your players across seasons
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>All Players</CardTitle>
            <CardDescription>
              {players.length} player{players.length !== 1 ? "s" : ""} in your
              pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            {playersWithSeasons.length > 0 ? (
              <PlayerPoolManager players={playersWithSeasons} />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No players yet. Create players when adding them to a season
                roster.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
