"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  calculateRankings,
  formatRank,
  formatWinPercentage,
  type PlayerStats,
  type RankedPlayer,
} from "@/lib/leaderboard/ranking";
import { exportStandingsPdf } from "@/lib/pdf/exportStandingsPdf";

// Props passed from server component
export interface LeaderboardProps {
  seasonId: string;
  seasonName: string;
  playerStats: PlayerStats[];
}

/**
 * Leaderboard component displaying player rankings
 * Mobile-optimized table with rank, name, points, games, wins, win%
 */
export function Leaderboard({ seasonId, seasonName, playerStats }: LeaderboardProps) {
  // Calculate rankings from player stats
  const rankedPlayers: RankedPlayer[] = calculateRankings(playerStats);

  // Handle PDF export
  function handleExportPdf() {
    exportStandingsPdf({
      standingsInfo: { seasonName },
      rankedPlayers,
    });
  }

  if (rankedPlayers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>
            No games have been played yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            The leaderboard will show rankings once games have been completed and scores recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>
              {rankedPlayers.length} player{rankedPlayers.length !== 1 ? "s" : ""} ranked
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile-optimized table wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium w-12">#</th>
                <th className="px-3 py-2 text-left font-medium">Player</th>
                <th className="px-3 py-2 text-right font-medium">Points</th>
                <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">Games</th>
                <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">Wins</th>
                <th className="px-3 py-2 text-right font-medium">Win%</th>
              </tr>
            </thead>
            <tbody>
              {rankedPlayers.map((player, index) => (
                <tr
                  key={player.playerId}
                  className={`border-b last:border-0 hover:bg-muted/30 ${
                    index < 3 ? "font-medium" : ""
                  }`}
                >
                  {/* Rank */}
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                        player.rank === 1
                          ? "bg-yellow-100 text-yellow-800"
                          : player.rank === 2
                            ? "bg-gray-100 text-gray-700"
                            : player.rank === 3
                              ? "bg-orange-100 text-orange-800"
                              : ""
                      }`}
                    >
                      {formatRank(player.rank, player.isTied)}
                    </span>
                  </td>

                  {/* Player Name - clickable for detail view */}
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/seasons/${seasonId}/players/${player.playerId}`}
                      className="font-medium hover:text-blue-600 hover:underline"
                    >
                      {player.playerName}
                    </Link>
                    {/* Mobile: show games/wins under name */}
                    <span className="block text-xs text-muted-foreground sm:hidden">
                      {player.gamesPlayed} games, {player.wins} wins
                    </span>
                  </td>

                  {/* Total Points */}
                  <td className="px-3 py-2 text-right tabular-nums">
                    {player.totalPoints}
                  </td>

                  {/* Games Played - hidden on mobile */}
                  <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
                    {player.gamesPlayed}
                  </td>

                  {/* Wins - hidden on mobile */}
                  <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
                    {player.wins}
                  </td>

                  {/* Win Percentage */}
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatWinPercentage(player.winPercentage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
