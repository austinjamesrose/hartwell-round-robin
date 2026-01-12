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
import { calculateWinPercentage, formatWinPercentage } from "@/lib/leaderboard/ranking";

type Season = Database["public"]["Tables"]["seasons"]["Row"];
type Player = Database["public"]["Tables"]["players"]["Row"];
type Week = Database["public"]["Tables"]["weeks"]["Row"];
type Game = Database["public"]["Tables"]["games"]["Row"];

/**
 * Game history entry for display
 * Shows the player's perspective of a single game
 */
interface GameHistoryEntry {
  gameId: string;
  weekNumber: number;
  weekDate: string;
  partnerName: string;
  opponentNames: [string, string];
  playerScore: number;
  opponentScore: number;
  isWin: boolean;
}

// Format date for display (e.g., "Jan 15")
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string; playerId: string }>;
}) {
  const { id: seasonId, playerId } = await params;
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

  // Fetch the player
  const { data: playerData, error: playerError } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (playerError || !playerData) {
    return notFound();
  }

  const player: Player = playerData;

  // Verify player is in this season's roster
  const { data: seasonPlayerData } = await supabase
    .from("season_players")
    .select("id")
    .eq("season_id", seasonId)
    .eq("player_id", playerId)
    .single();

  if (!seasonPlayerData) {
    return notFound();
  }

  // Fetch all weeks for this season
  const { data: weeksData } = await supabase
    .from("weeks")
    .select("*")
    .eq("season_id", seasonId)
    .order("week_number", { ascending: true });

  const weeks: Week[] = weeksData ?? [];
  const weekIds = weeks.map((w) => w.id);
  const weekMap = new Map(weeks.map((w) => [w.id, w]));

  // Fetch all players in this season's roster (for partner/opponent names)
  const { data: seasonPlayersData } = await supabase
    .from("season_players")
    .select("player_id, players(*)")
    .eq("season_id", seasonId);

  const playerMap = new Map<string, Player>();
  for (const sp of seasonPlayersData ?? []) {
    const p = sp.players as unknown as Player;
    playerMap.set(sp.player_id, p);
  }

  // Fetch all games where this player participated
  // Player can be in any of the 4 positions: team1_player1, team1_player2, team2_player1, team2_player2
  let games: Game[] = [];
  if (weekIds.length > 0) {
    const { data: gamesData } = await supabase
      .from("games")
      .select("*")
      .in("week_id", weekIds)
      .or(
        `team1_player1_id.eq.${playerId},team1_player2_id.eq.${playerId},team2_player1_id.eq.${playerId},team2_player2_id.eq.${playerId}`
      );

    games = (gamesData ?? []) as Game[];
  }

  // Calculate player stats from completed games only
  let totalPoints = 0;
  let wins = 0;
  let gamesPlayed = 0;

  // Build game history entries (sorted by week number descending = most recent first)
  const gameHistory: GameHistoryEntry[] = [];

  for (const game of games) {
    // Skip games without scores
    if (game.team1_score === null || game.team2_score === null) continue;

    const week = weekMap.get(game.week_id);
    if (!week) continue;

    // Determine which team the player is on
    const isOnTeam1 =
      game.team1_player1_id === playerId || game.team1_player2_id === playerId;

    // Get partner and opponents
    let partnerId: string;
    let opponentIds: [string, string];

    if (isOnTeam1) {
      partnerId =
        game.team1_player1_id === playerId
          ? game.team1_player2_id
          : game.team1_player1_id;
      opponentIds = [game.team2_player1_id, game.team2_player2_id];
    } else {
      partnerId =
        game.team2_player1_id === playerId
          ? game.team2_player2_id
          : game.team2_player1_id;
      opponentIds = [game.team1_player1_id, game.team1_player2_id];
    }

    const playerScore = isOnTeam1 ? game.team1_score : game.team2_score;
    const opponentScore = isOnTeam1 ? game.team2_score : game.team1_score;
    const isWin = playerScore > opponentScore;

    // Update stats
    totalPoints += playerScore;
    gamesPlayed += 1;
    if (isWin) wins += 1;

    // Add to game history
    gameHistory.push({
      gameId: game.id,
      weekNumber: week.week_number,
      weekDate: week.date,
      partnerName: playerMap.get(partnerId)?.name ?? "Unknown",
      opponentNames: [
        playerMap.get(opponentIds[0])?.name ?? "Unknown",
        playerMap.get(opponentIds[1])?.name ?? "Unknown",
      ],
      playerScore,
      opponentScore,
      isWin,
    });
  }

  // Sort game history by week number descending (most recent first)
  gameHistory.sort((a, b) => b.weekNumber - a.weekNumber);

  const winPercentage = calculateWinPercentage(wins, gamesPlayed);

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/dashboard/seasons/${seasonId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to {season.name}
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-bold">{player.name}</h1>
          <p className="text-muted-foreground">{season.name}</p>
        </header>

        <div className="space-y-6">
          {/* Player Stats Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Season Stats</CardTitle>
              <CardDescription>
                Performance summary for this season
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gamesPlayed > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="text-2xl font-bold">{totalPoints}</div>
                    <div className="text-sm text-muted-foreground">
                      Total Points
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="text-2xl font-bold">{gamesPlayed}</div>
                    <div className="text-sm text-muted-foreground">
                      Games Played
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="text-2xl font-bold">{wins}</div>
                    <div className="text-sm text-muted-foreground">Wins</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <div className="text-2xl font-bold">
                      {formatWinPercentage(winPercentage)}
                    </div>
                    <div className="text-sm text-muted-foreground">Win %</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No completed games yet. Stats will appear once games have been
                  played and scored.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Game History */}
          <Card>
            <CardHeader>
              <CardTitle>Game History</CardTitle>
              <CardDescription>
                {gameHistory.length} completed game
                {gameHistory.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {gameHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium">
                          Week
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Partner
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Opponents
                        </th>
                        <th className="px-3 py-2 text-center font-medium">
                          Score
                        </th>
                        <th className="px-3 py-2 text-center font-medium">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameHistory.map((entry) => (
                        <tr
                          key={entry.gameId}
                          className="border-b last:border-0 hover:bg-muted/30"
                        >
                          {/* Week */}
                          <td className="px-3 py-2">
                            <span className="font-medium">
                              Week {entry.weekNumber}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {formatDate(entry.weekDate)}
                            </span>
                          </td>

                          {/* Partner */}
                          <td className="px-3 py-2">{entry.partnerName}</td>

                          {/* Opponents */}
                          <td className="px-3 py-2">
                            <span className="block">
                              {entry.opponentNames[0]}
                            </span>
                            <span className="block">
                              {entry.opponentNames[1]}
                            </span>
                          </td>

                          {/* Score */}
                          <td className="px-3 py-2 text-center tabular-nums">
                            <span
                              className={
                                entry.isWin
                                  ? "font-semibold text-green-600"
                                  : ""
                              }
                            >
                              {entry.playerScore}
                            </span>
                            <span className="mx-1">-</span>
                            <span
                              className={
                                !entry.isWin
                                  ? "font-semibold text-green-600"
                                  : ""
                              }
                            >
                              {entry.opponentScore}
                            </span>
                          </td>

                          {/* Result */}
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${
                                entry.isWin
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {entry.isWin ? "W" : "L"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-muted-foreground">
                    No game history yet. Games will appear here once they have
                    been completed and scored.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
