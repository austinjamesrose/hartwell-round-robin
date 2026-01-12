"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Database } from "@/types/database";

// Types from database
type Game = Database["public"]["Tables"]["games"]["Row"];

// Player info for name display
interface PlayerInfo {
  id: string;
  name: string;
}

// Props for the ScoreEntry component
interface ScoreEntryProps {
  games: Game[];
  players: PlayerInfo[];
  weekStatus: "draft" | "finalized" | "completed";
}

// Represents a single round for display
interface DisplayRound {
  roundNumber: number;
  games: Game[];
}

// Score input state for a single game
interface GameScoreInput {
  team1Score: string;
  team2Score: string;
}

export function ScoreEntry({
  games,
  players,
  weekStatus,
}: ScoreEntryProps) {
  // Track local score input state
  const [scoreInputs, setScoreInputs] = useState<Map<string, GameScoreInput>>(() => {
    // Initialize from existing game scores
    const initial = new Map<string, GameScoreInput>();
    for (const game of games) {
      initial.set(game.id, {
        team1Score: game.team1_score !== null ? String(game.team1_score) : "",
        team2Score: game.team2_score !== null ? String(game.team2_score) : "",
      });
    }
    return initial;
  });

  // Create player name lookup map
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const player of players) {
      map.set(player.id, player.name);
    }
    return map;
  }, [players]);

  // Group games by round
  const rounds = useMemo((): DisplayRound[] => {
    // Find all unique round numbers
    const roundNumbers = new Set<number>();
    for (const game of games) {
      roundNumbers.add(game.round_number);
    }

    // Sort round numbers
    const sortedRounds = Array.from(roundNumbers).sort((a, b) => a - b);

    // Build display rounds
    return sortedRounds.map((roundNumber) => ({
      roundNumber,
      games: games
        .filter((g) => g.round_number === roundNumber)
        .sort((a, b) => a.court_number - b.court_number),
    }));
  }, [games]);

  // Get player name by ID
  function getPlayerName(playerId: string): string {
    return playerNameMap.get(playerId) || "Unknown";
  }

  // Get score input for a game
  function getScoreInput(gameId: string): GameScoreInput {
    return scoreInputs.get(gameId) || { team1Score: "", team2Score: "" };
  }

  // Handle score input change
  function handleScoreChange(gameId: string, team: "team1" | "team2", value: string) {
    // Only allow numeric input (0-11)
    const numericValue = value.replace(/\D/g, "");
    const clampedValue = numericValue === "" ? "" : String(Math.min(11, parseInt(numericValue, 10)));

    setScoreInputs((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(gameId) || { team1Score: "", team2Score: "" };
      newMap.set(gameId, {
        ...current,
        [team === "team1" ? "team1Score" : "team2Score"]: clampedValue,
      });
      return newMap;
    });
  }

  // Score entry is only available for finalized schedules
  if (weekStatus !== "finalized" && weekStatus !== "completed") {
    return null;
  }

  // No games to show
  if (games.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Entry</CardTitle>
        <CardDescription>
          Enter scores for each game. Valid pickleball scores: one team scores 11, the other scores 0-10.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rounds */}
        {rounds.map((round) => (
          <div key={round.roundNumber} className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Round {round.roundNumber}
            </h4>

            {/* Games in this round */}
            <div className="space-y-3">
              {round.games.map((game) => {
                const scoreInput = getScoreInput(game.id);
                const hasScore = game.team1_score !== null && game.team2_score !== null;

                return (
                  <div
                    key={game.id}
                    className={`rounded-lg border p-4 ${
                      hasScore ? "bg-green-50 border-green-200" : "bg-muted/30"
                    }`}
                  >
                    {/* Court label */}
                    <div className="text-xs text-muted-foreground mb-3">
                      Court {game.court_number}
                    </div>

                    {/* Game matchup with score inputs */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
                      {/* Team 1 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {/* Team 1 score input */}
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={scoreInput.team1Score}
                            onChange={(e) => handleScoreChange(game.id, "team1", e.target.value)}
                            placeholder="0"
                            className="w-14 h-14 text-center text-xl font-bold shrink-0 touch-manipulation"
                            style={{ minWidth: "56px", minHeight: "56px" }}
                            aria-label={`Team 1 score for Court ${game.court_number}`}
                          />
                          {/* Team 1 players */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-blue-700 truncate">
                              {getPlayerName(game.team1_player1_id)}
                            </div>
                            <div className="text-sm text-blue-600 truncate">
                              {getPlayerName(game.team1_player2_id)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vs separator */}
                      <div className="text-center text-muted-foreground text-sm font-medium px-2 self-center">
                        vs
                      </div>

                      {/* Team 2 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 sm:flex-row-reverse">
                          {/* Team 2 score input */}
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={scoreInput.team2Score}
                            onChange={(e) => handleScoreChange(game.id, "team2", e.target.value)}
                            placeholder="0"
                            className="w-14 h-14 text-center text-xl font-bold shrink-0 touch-manipulation"
                            style={{ minWidth: "56px", minHeight: "56px" }}
                            aria-label={`Team 2 score for Court ${game.court_number}`}
                          />
                          {/* Team 2 players */}
                          <div className="flex-1 min-w-0 sm:text-right">
                            <div className="text-sm font-medium text-orange-700 truncate">
                              {getPlayerName(game.team2_player1_id)}
                            </div>
                            <div className="text-sm text-orange-600 truncate">
                              {getPlayerName(game.team2_player2_id)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
