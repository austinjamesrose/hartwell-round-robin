"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Database } from "@/types/database";

// Types from database
type Game = Database["public"]["Tables"]["games"]["Row"];
type Bye = Database["public"]["Tables"]["byes"]["Row"];

// Player info for name display
interface PlayerInfo {
  id: string;
  name: string;
}

// Props for the ScheduleViewer component
interface ScheduleViewerProps {
  games: Game[];
  byes: Bye[];
  players: PlayerInfo[];
  scheduleWarnings: string[] | null;
  weekStatus: "draft" | "finalized" | "completed";
}

// Represents a single round for display
interface DisplayRound {
  roundNumber: number;
  games: Game[];
  byes: string[]; // player IDs
}

// Summary statistics
interface ScheduleSummary {
  totalRounds: number;
  totalGames: number;
  gamesPerPlayer: string; // e.g., "8" or "7-8" if variance
  gamesBreakdown: Map<string, number>; // playerId -> games played
}

export function ScheduleViewer({
  games,
  byes,
  players,
  scheduleWarnings,
  weekStatus,
}: ScheduleViewerProps) {
  // Create player name lookup map
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const player of players) {
      map.set(player.id, player.name);
    }
    return map;
  }, [players]);

  // Group games and byes by round
  const rounds = useMemo((): DisplayRound[] => {
    // Find all unique round numbers
    const roundNumbers = new Set<number>();
    for (const game of games) {
      roundNumbers.add(game.round_number);
    }
    for (const bye of byes) {
      roundNumbers.add(bye.round_number);
    }

    // Sort round numbers
    const sortedRounds = Array.from(roundNumbers).sort((a, b) => a - b);

    // Build display rounds
    return sortedRounds.map((roundNumber) => ({
      roundNumber,
      games: games
        .filter((g) => g.round_number === roundNumber)
        .sort((a, b) => a.court_number - b.court_number),
      byes: byes
        .filter((b) => b.round_number === roundNumber)
        .map((b) => b.player_id),
    }));
  }, [games, byes]);

  // Calculate summary statistics
  const summary = useMemo((): ScheduleSummary => {
    const gamesBreakdown = new Map<string, number>();

    // Initialize all players with 0 games
    for (const player of players) {
      gamesBreakdown.set(player.id, 0);
    }

    // Count games for each player
    for (const game of games) {
      const playerIds = [
        game.team1_player1_id,
        game.team1_player2_id,
        game.team2_player1_id,
        game.team2_player2_id,
      ];

      for (const playerId of playerIds) {
        const current = gamesBreakdown.get(playerId) || 0;
        gamesBreakdown.set(playerId, current + 1);
      }
    }

    // Calculate min/max games
    const gameCounts = Array.from(gamesBreakdown.values());
    const minGames = gameCounts.length > 0 ? Math.min(...gameCounts) : 0;
    const maxGames = gameCounts.length > 0 ? Math.max(...gameCounts) : 0;
    const gamesPerPlayer = minGames === maxGames ? `${minGames}` : `${minGames}-${maxGames}`;

    return {
      totalRounds: rounds.length,
      totalGames: games.length,
      gamesPerPlayer,
      gamesBreakdown,
    };
  }, [games, players, rounds.length]);

  // Get player name by ID
  function getPlayerName(playerId: string): string {
    return playerNameMap.get(playerId) || "Unknown";
  }

  // Early return if no schedule exists
  if (games.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
        <CardDescription>
          {weekStatus === "draft"
            ? "Draft schedule - can be modified or regenerated"
            : weekStatus === "finalized"
              ? "Finalized schedule - ready for score entry"
              : "Completed week"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Schedule warnings */}
        {scheduleWarnings && scheduleWarnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              <ul className="list-disc list-inside space-y-1">
                {scheduleWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary stats */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{summary.totalRounds}</span>
            <span>rounds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{summary.totalGames}</span>
            <span>games</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{summary.gamesPerPlayer}</span>
            <span>games/player</span>
          </div>
        </div>

        {/* Rounds grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {rounds.map((round) => (
            <div key={round.roundNumber} className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Round {round.roundNumber}</h4>

              {/* Games */}
              <div className="space-y-2">
                {round.games.map((game) => (
                  <div
                    key={game.id}
                    className="grid grid-cols-[auto_1fr_auto_1fr] gap-2 text-sm items-center bg-muted/50 rounded p-2"
                  >
                    <span className="text-muted-foreground text-xs">
                      Ct {game.court_number}
                    </span>
                    <span>
                      {getPlayerName(game.team1_player1_id)} &amp;{" "}
                      {getPlayerName(game.team1_player2_id)}
                    </span>
                    <span className="text-muted-foreground text-xs px-2">vs</span>
                    <span>
                      {getPlayerName(game.team2_player1_id)} &amp;{" "}
                      {getPlayerName(game.team2_player2_id)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Byes */}
              {round.byes.length > 0 && (
                <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                  <span className="font-medium">Bye: </span>
                  {round.byes.map((playerId) => getPlayerName(playerId)).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Games per player breakdown (collapsed by default in future version) */}
        <div className="border-t pt-4 mt-4">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              View games per player breakdown
            </summary>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {Array.from(summary.gamesBreakdown.entries())
                .sort((a, b) => {
                  // Sort by name alphabetically
                  const nameA = getPlayerName(a[0]);
                  const nameB = getPlayerName(b[0]);
                  return nameA.localeCompare(nameB);
                })
                .map(([playerId, gameCount]) => {
                  // Highlight if player doesn't have exactly 8 games (constraint violation indicator)
                  const isNot8Games = gameCount !== 8;
                  return (
                    <div
                      key={playerId}
                      className={`flex justify-between p-2 rounded ${
                        isNot8Games ? "bg-yellow-50 text-yellow-800" : "bg-muted/50"
                      }`}
                    >
                      <span className="truncate">{getPlayerName(playerId)}</span>
                      <span className={`font-medium ${isNot8Games ? "text-yellow-700" : ""}`}>
                        {gameCount}
                      </span>
                    </div>
                  );
                })}
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
