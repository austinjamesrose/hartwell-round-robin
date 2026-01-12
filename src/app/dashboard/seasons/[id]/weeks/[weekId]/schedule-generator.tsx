"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  generateSchedule,
  type Schedule,
  type Round,
} from "@/lib/scheduling/generateSchedule";
import {
  validateAvailableCount,
  MIN_AVAILABLE_PLAYERS,
  MAX_AVAILABLE_PLAYERS,
} from "@/lib/availability/validation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Player info for display
interface PlayerInfo {
  id: string;
  name: string;
}

interface ScheduleGeneratorProps {
  weekId: string;
  numCourts: number;
  // Available players for schedule generation
  availablePlayers: PlayerInfo[];
  // Has this week already been scheduled?
  hasExistingSchedule: boolean;
  // Current week status
  weekStatus: "draft" | "finalized" | "completed";
}

export function ScheduleGenerator({
  weekId,
  numCourts,
  availablePlayers,
  hasExistingSchedule,
  weekStatus,
}: ScheduleGeneratorProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Local schedule state for display before saving
  const [generatedSchedule, setGeneratedSchedule] = useState<Schedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create a map of player ID to name for display
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const player of availablePlayers) {
      map.set(player.id, player.name);
    }
    return map;
  }, [availablePlayers]);

  // Validate player count
  const playerCount = availablePlayers.length;
  const validation = validateAvailableCount(playerCount);

  // Determine if generation is allowed
  const canGenerate =
    validation.isValid &&
    !isGenerating &&
    !isSaving &&
    weekStatus === "draft";

  // Get disabled reason for tooltip
  function getDisabledReason(): string | null {
    if (weekStatus !== "draft") {
      return "Schedule can only be generated for draft weeks";
    }
    if (!validation.isValid) {
      return `Need ${MIN_AVAILABLE_PLAYERS}-${MAX_AVAILABLE_PLAYERS} available players (currently ${playerCount})`;
    }
    return null;
  }

  const disabledReason = getDisabledReason();

  // Generate the schedule (client-side)
  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    try {
      // Extract player IDs
      const playerIds = availablePlayers.map((p) => p.id);

      // Generate schedule (this runs the algorithm client-side)
      // Use setTimeout to allow UI to update with loading state
      await new Promise((resolve) => setTimeout(resolve, 50));
      const schedule = generateSchedule(playerIds, numCourts);

      setGeneratedSchedule(schedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate schedule");
    } finally {
      setIsGenerating(false);
    }
  }

  // Save the generated schedule to the database
  async function handleSave() {
    if (!generatedSchedule) return;

    setIsSaving(true);
    setError(null);

    const supabase = createClient();

    try {
      // First, delete any existing games and byes for this week
      // This handles the "regenerate" scenario
      const { error: deleteGamesError } = await supabase
        .from("games")
        .delete()
        .eq("week_id", weekId);

      if (deleteGamesError) {
        throw new Error(`Failed to clear existing games: ${deleteGamesError.message}`);
      }

      const { error: deleteByesError } = await supabase
        .from("byes")
        .delete()
        .eq("week_id", weekId);

      if (deleteByesError) {
        throw new Error(`Failed to clear existing byes: ${deleteByesError.message}`);
      }

      // Insert all games
      const gamesToInsert = generatedSchedule.rounds.flatMap((round) =>
        round.games.map((game) => ({
          week_id: weekId,
          round_number: round.roundNumber,
          court_number: game.court,
          team1_player1_id: game.team1[0],
          team1_player2_id: game.team1[1],
          team2_player1_id: game.team2[0],
          team2_player2_id: game.team2[1],
          status: "scheduled" as const,
        }))
      );

      if (gamesToInsert.length > 0) {
        const { error: insertGamesError } = await supabase
          .from("games")
          .insert(gamesToInsert);

        if (insertGamesError) {
          throw new Error(`Failed to save games: ${insertGamesError.message}`);
        }
      }

      // Insert all byes
      const byesToInsert = generatedSchedule.rounds.flatMap((round) =>
        round.byes.map((playerId) => ({
          week_id: weekId,
          round_number: round.roundNumber,
          player_id: playerId,
        }))
      );

      if (byesToInsert.length > 0) {
        const { error: insertByesError } = await supabase.from("byes").insert(byesToInsert);

        if (insertByesError) {
          throw new Error(`Failed to save byes: ${insertByesError.message}`);
        }
      }

      // Update week with warnings (if any)
      const { error: updateWeekError } = await supabase
        .from("weeks")
        .update({
          schedule_warnings: generatedSchedule.warnings.length > 0 ? generatedSchedule.warnings : null,
        })
        .eq("id", weekId);

      if (updateWeekError) {
        throw new Error(`Failed to update week: ${updateWeekError.message}`);
      }

      // Refresh the page to show the saved schedule
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  }

  // Get player name helper
  function getPlayerName(playerId: string): string {
    return playerNameMap.get(playerId) || "Unknown";
  }

  // Render a single round
  function renderRound(round: Round) {
    return (
      <div key={round.roundNumber} className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Round {round.roundNumber}</h4>

        {/* Games */}
        <div className="space-y-2">
          {round.games.map((game, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[auto_1fr_auto_1fr] gap-2 text-sm items-center bg-muted/50 rounded p-2"
            >
              <span className="text-muted-foreground text-xs">Ct {game.court}</span>
              <span>
                {getPlayerName(game.team1[0])} &amp; {getPlayerName(game.team1[1])}
              </span>
              <span className="text-muted-foreground text-xs px-2">vs</span>
              <span>
                {getPlayerName(game.team2[0])} &amp; {getPlayerName(game.team2[1])}
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
    );
  }

  // Calculate summary stats for display
  function getScheduleSummary(schedule: Schedule) {
    const totalGames = schedule.rounds.reduce((sum, r) => sum + r.games.length, 0);
    const gamesPerPlayer = new Map<string, number>();

    for (const round of schedule.rounds) {
      for (const game of round.games) {
        for (const playerId of [...game.team1, ...game.team2]) {
          gamesPerPlayer.set(playerId, (gamesPerPlayer.get(playerId) || 0) + 1);
        }
      }
    }

    const gamesCounts = Array.from(gamesPerPlayer.values());
    const minGames = gamesCounts.length > 0 ? Math.min(...gamesCounts) : 0;
    const maxGames = gamesCounts.length > 0 ? Math.max(...gamesCounts) : 0;
    const allSame = minGames === maxGames;

    return {
      totalRounds: schedule.rounds.length,
      totalGames,
      gamesPerPlayer: allSame ? `${minGames}` : `${minGames}-${maxGames}`,
    };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Generation</CardTitle>
        <CardDescription>
          Generate a round-robin schedule for {playerCount} available players on {numCourts} courts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Warning message for invalid player count - visible above button */}
        {!validation.isValid && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              {validation.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Generate button */}
        <div className="flex gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Wrap button in span to allow tooltip on disabled button */}
                <span>
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="min-w-[140px]"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner />
                        Generating...
                      </>
                    ) : hasExistingSchedule || generatedSchedule ? (
                      "Regenerate Schedule"
                    ) : (
                      "Generate Schedule"
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {disabledReason && (
                <TooltipContent>
                  <p>{disabledReason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          {/* Save button (only show when we have unsaved schedule) */}
          {generatedSchedule && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="secondary"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner />
                  Saving...
                </>
              ) : (
                "Save Schedule"
              )}
            </Button>
          )}
        </div>

        {/* Generated schedule display */}
        {generatedSchedule && (
          <div className="space-y-4 mt-6">
            {/* Warnings */}
            {generatedSchedule.warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  <ul className="list-disc list-inside space-y-1">
                    {generatedSchedule.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Summary */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{getScheduleSummary(generatedSchedule).totalRounds} rounds</span>
              <span>{getScheduleSummary(generatedSchedule).totalGames} games</span>
              <span>{getScheduleSummary(generatedSchedule).gamesPerPlayer} games/player</span>
            </div>

            {/* Rounds */}
            <div className="grid gap-4 md:grid-cols-2">
              {generatedSchedule.rounds.map((round) => renderRound(round))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple loading spinner component
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
