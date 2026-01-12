"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import {
  findPlayerPosition,
  performSwap,
  checkSwapViolations,
  type SwapGame,
} from "@/lib/scheduling/swap";
import { canUnfinalizeWeek, canMarkWeekComplete } from "@/lib/weeks/validation";
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
  weekId: string;
  gamesWithScoresCount: number;
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

// Selection state for swap
interface SwapSelection {
  roundNumber: number;
  playerId: string;
}

export function ScheduleViewer({
  games: initialGames,
  byes: initialByes,
  players,
  scheduleWarnings: initialWarnings,
  weekStatus,
  weekId,
  gamesWithScoresCount,
}: ScheduleViewerProps) {
  const router = useRouter();

  // Local state for games and byes (for optimistic updates during swaps)
  const [games, setGames] = useState(initialGames);
  const [byes, setByes] = useState(initialByes);
  const [warnings, setWarnings] = useState<string[]>(initialWarnings || []);

  // Selection state for swapping
  const [selectedPlayer, setSelectedPlayer] = useState<SwapSelection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we have unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Finalize dialog state
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Unfinalize dialog state
  const [showUnfinalizeDialog, setShowUnfinalizeDialog] = useState(false);
  const [isUnfinalizing, setIsUnfinalizing] = useState(false);

  // Mark Complete dialog state
  const [showMarkCompleteDialog, setShowMarkCompleteDialog] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  // Can edit only in draft mode
  const canEdit = weekStatus === "draft";

  // Check if unfinalize is allowed
  const unfinalizeResult = canUnfinalizeWeek(gamesWithScoresCount);
  const canUnfinalize = weekStatus === "finalized" && unfinalizeResult.canUnfinalize;

  // Check if week can be marked as complete
  const markCompleteResult = canMarkWeekComplete(weekStatus, games.length, gamesWithScoresCount);

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

  // Handle player click for swap
  function handlePlayerClick(roundNumber: number, playerId: string) {
    if (!canEdit) return;

    if (!selectedPlayer) {
      // First selection
      setSelectedPlayer({ roundNumber, playerId });
      setError(null);
    } else if (selectedPlayer.roundNumber !== roundNumber) {
      // Different round - can't swap across rounds
      setError("Can only swap players within the same round");
      setSelectedPlayer(null);
    } else if (selectedPlayer.playerId === playerId) {
      // Same player - deselect
      setSelectedPlayer(null);
    } else {
      // Second selection in same round - perform swap
      performPlayerSwap(roundNumber, selectedPlayer.playerId, playerId);
      setSelectedPlayer(null);
    }
  }

  // Perform the swap and update local state
  function performPlayerSwap(roundNumber: number, player1Id: string, player2Id: string) {
    // Get round data
    const round = rounds.find((r) => r.roundNumber === roundNumber);
    if (!round) return;

    // Convert to SwapGame format
    const roundGames: SwapGame[] = round.games.map((g) => ({
      id: g.id,
      roundNumber: g.round_number,
      team1Player1Id: g.team1_player1_id,
      team1Player2Id: g.team1_player2_id,
      team2Player1Id: g.team2_player1_id,
      team2Player2Id: g.team2_player2_id,
    }));

    // Find positions
    const pos1 = findPlayerPosition(player1Id, roundGames, round.byes);
    const pos2 = findPlayerPosition(player2Id, roundGames, round.byes);

    if (!pos1 || !pos2) {
      setError("Could not find player positions");
      return;
    }

    // Perform swap
    const result = performSwap(pos1, pos2, roundGames, round.byes);

    if (!result.success) {
      setError(result.error || "Swap failed");
      return;
    }

    // Update local state with swapped data
    const updatedGames = games.map((g) => {
      if (g.round_number !== roundNumber) return g;

      const updated = result.updatedGames?.find((u) => u.gameId === g.id);
      if (!updated) return g;

      return {
        ...g,
        team1_player1_id: updated.team1Player1Id,
        team1_player2_id: updated.team1Player2Id,
        team2_player1_id: updated.team2Player1Id,
        team2_player2_id: updated.team2Player2Id,
      };
    });

    // Update byes for this round
    const updatedByes = byes.map((b) => {
      if (b.round_number !== roundNumber) return b;

      // Find the bye slot index and update with the new player ID
      const originalIdx = round.byes.indexOf(b.player_id);
      if (originalIdx >= 0 && result.updatedByes && result.updatedByes[originalIdx]) {
        return { ...b, player_id: result.updatedByes[originalIdx] };
      }

      return b;
    });

    setGames(updatedGames);
    setByes(updatedByes);
    setHasUnsavedChanges(true);
    setError(null);

    // Check for constraint violations across all games
    const allSwapGames: SwapGame[] = updatedGames.map((g) => ({
      id: g.id,
      roundNumber: g.round_number,
      team1Player1Id: g.team1_player1_id,
      team1Player2Id: g.team1_player2_id,
      team2Player1Id: g.team2_player1_id,
      team2Player2Id: g.team2_player2_id,
    }));

    const playerIds = players.map((p) => p.id);
    const newWarnings = checkSwapViolations(allSwapGames, playerIds, playerNameMap);
    setWarnings(newWarnings);
  }

  // Save changes to database
  async function handleSaveChanges() {
    setIsSaving(true);
    setError(null);

    const supabase = createClient();

    try {
      // Update all games
      for (const game of games) {
        const { error: updateError } = await supabase
          .from("games")
          .update({
            team1_player1_id: game.team1_player1_id,
            team1_player2_id: game.team1_player2_id,
            team2_player1_id: game.team2_player1_id,
            team2_player2_id: game.team2_player2_id,
          })
          .eq("id", game.id);

        if (updateError) {
          throw new Error(`Failed to update game: ${updateError.message}`);
        }
      }

      // Update all byes
      for (const bye of byes) {
        const { error: updateError } = await supabase
          .from("byes")
          .update({ player_id: bye.player_id })
          .eq("id", bye.id);

        if (updateError) {
          throw new Error(`Failed to update bye: ${updateError.message}`);
        }
      }

      // Update schedule warnings on the week
      const { error: weekError } = await supabase
        .from("weeks")
        .update({
          schedule_warnings: warnings.length > 0 ? warnings : null,
        })
        .eq("id", weekId);

      if (weekError) {
        throw new Error(`Failed to update week: ${weekError.message}`);
      }

      setHasUnsavedChanges(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }

  // Cancel changes and reload
  function handleCancelChanges() {
    setGames(initialGames);
    setByes(initialByes);
    setWarnings(initialWarnings || []);
    setHasUnsavedChanges(false);
    setSelectedPlayer(null);
    setError(null);
  }

  // Finalize the schedule (change week status from draft to finalized)
  async function handleFinalizeSchedule() {
    setIsFinalizing(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error: updateError } = await supabase
        .from("weeks")
        .update({ status: "finalized" })
        .eq("id", weekId);

      if (updateError) {
        throw new Error(`Failed to finalize schedule: ${updateError.message}`);
      }

      setShowFinalizeDialog(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize schedule");
    } finally {
      setIsFinalizing(false);
    }
  }

  // Unfinalize the schedule (change week status from finalized back to draft)
  async function handleUnfinalizeSchedule() {
    setIsUnfinalizing(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error: updateError } = await supabase
        .from("weeks")
        .update({ status: "draft" })
        .eq("id", weekId);

      if (updateError) {
        throw new Error(`Failed to unfinalize schedule: ${updateError.message}`);
      }

      setShowUnfinalizeDialog(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unfinalize schedule");
    } finally {
      setIsUnfinalizing(false);
    }
  }

  // Mark the week as complete (change week status from finalized to completed)
  async function handleMarkComplete() {
    setIsMarkingComplete(true);
    setError(null);

    const supabase = createClient();

    try {
      const { error: updateError } = await supabase
        .from("weeks")
        .update({ status: "completed" })
        .eq("id", weekId);

      if (updateError) {
        throw new Error(`Failed to mark week complete: ${updateError.message}`);
      }

      setShowMarkCompleteDialog(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark week complete");
    } finally {
      setIsMarkingComplete(false);
    }
  }

  // Check if a player is selected
  function isPlayerSelected(roundNumber: number, playerId: string): boolean {
    return (
      selectedPlayer?.roundNumber === roundNumber &&
      selectedPlayer?.playerId === playerId
    );
  }

  // Check if a player is a valid swap target
  function isValidSwapTarget(roundNumber: number, playerId: string): boolean {
    if (!selectedPlayer) return false;
    if (selectedPlayer.roundNumber !== roundNumber) return false;
    if (selectedPlayer.playerId === playerId) return false;
    return true;
  }

  // Get CSS classes for a player name based on selection state
  function getPlayerClasses(roundNumber: number, playerId: string): string {
    const baseClasses = "cursor-pointer transition-colors px-1 rounded";

    if (isPlayerSelected(roundNumber, playerId)) {
      return `${baseClasses} bg-blue-500 text-white`;
    }

    if (isValidSwapTarget(roundNumber, playerId)) {
      return `${baseClasses} hover:bg-blue-100`;
    }

    if (canEdit) {
      return `${baseClasses} hover:bg-muted`;
    }

    return "";
  }

  // Render a clickable player name
  function renderPlayer(roundNumber: number, playerId: string) {
    const name = getPlayerName(playerId);

    if (!canEdit) {
      return <span>{name}</span>;
    }

    return (
      <span
        className={getPlayerClasses(roundNumber, playerId)}
        onClick={(e) => {
          e.stopPropagation();
          handlePlayerClick(roundNumber, playerId);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePlayerClick(roundNumber, playerId);
          }
        }}
      >
        {name}
      </span>
    );
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
            ? "Draft schedule - click players to swap them within a round"
            : weekStatus === "finalized"
              ? "Finalized schedule - ready for score entry"
              : "Completed week"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Selection hint */}
        {canEdit && selectedPlayer && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>{getPlayerName(selectedPlayer.playerId)}</strong> selected in
              Round {selectedPlayer.roundNumber}. Click another player in the same
              round to swap, or click the same player to deselect.
            </AlertDescription>
          </Alert>
        )}

        {/* Unsaved changes actions */}
        {hasUnsavedChanges && (
          <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-yellow-800 text-sm flex-1">
              You have unsaved changes
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelChanges}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}

        {/* Schedule warnings */}
        {warnings && warnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, idx) => (
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
                      {renderPlayer(round.roundNumber, game.team1_player1_id)} &amp;{" "}
                      {renderPlayer(round.roundNumber, game.team1_player2_id)}
                    </span>
                    <span className="text-muted-foreground text-xs px-2">vs</span>
                    <span>
                      {renderPlayer(round.roundNumber, game.team2_player1_id)} &amp;{" "}
                      {renderPlayer(round.roundNumber, game.team2_player2_id)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Byes */}
              {round.byes.length > 0 && (
                <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                  <span className="font-medium">Bye: </span>
                  {round.byes.map((playerId, idx) => (
                    <span key={playerId}>
                      {idx > 0 && ", "}
                      {renderPlayer(round.roundNumber, playerId)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Games per player breakdown (collapsed by default) */}
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

        {/* Finalize button (only for draft schedules) */}
        {canEdit && !hasUnsavedChanges && (
          <div className="border-t pt-4 mt-4">
            <Button
              onClick={() => setShowFinalizeDialog(true)}
              className="w-full sm:w-auto"
            >
              Finalize Schedule
            </Button>
          </div>
        )}

        {/* Unfinalize and Mark Complete buttons (for finalized schedules) */}
        {weekStatus === "finalized" && (
          <div className="border-t pt-4 mt-4 flex flex-wrap gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant="outline"
                      onClick={() => setShowUnfinalizeDialog(true)}
                      disabled={!canUnfinalize}
                      className="w-full sm:w-auto"
                    >
                      Unfinalize Schedule
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canUnfinalize && unfinalizeResult.errorMessage && (
                  <TooltipContent>
                    <p>{unfinalizeResult.errorMessage}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {/* Mark Complete button */}
            <Button
              onClick={() => setShowMarkCompleteDialog(true)}
              className="w-full sm:w-auto"
            >
              Mark Week Complete
            </Button>
          </div>
        )}

        {/* Finalize confirmation dialog */}
        <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finalize Schedule?</DialogTitle>
              <DialogDescription>
                This will lock the schedule and make it ready for play. You will not
                be able to make further changes to player assignments after
                finalizing.
              </DialogDescription>
            </DialogHeader>

            {/* Show warnings if any */}
            {warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  <p className="font-medium mb-2">
                    The schedule has the following warnings:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowFinalizeDialog(false)}
                disabled={isFinalizing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFinalizeSchedule}
                disabled={isFinalizing}
              >
                {isFinalizing ? "Finalizing..." : "Finalize Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unfinalize confirmation dialog */}
        <Dialog open={showUnfinalizeDialog} onOpenChange={setShowUnfinalizeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unfinalize Schedule?</DialogTitle>
              <DialogDescription>
                This will revert the schedule to draft status. You will be able
                to make changes to player assignments again.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUnfinalizeDialog(false)}
                disabled={isUnfinalizing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnfinalizeSchedule}
                disabled={isUnfinalizing}
              >
                {isUnfinalizing ? "Unfinalizing..." : "Unfinalize Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mark Complete confirmation dialog */}
        <Dialog open={showMarkCompleteDialog} onOpenChange={setShowMarkCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Week Complete?</DialogTitle>
              <DialogDescription>
                This will archive the week and mark it as completed. The week
                will remain visible for viewing historical results.
              </DialogDescription>
            </DialogHeader>

            {/* Show warning if games are missing scores */}
            {markCompleteResult.hasMissingScores && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  <p className="font-medium">
                    {markCompleteResult.missingScoresCount}{" "}
                    {markCompleteResult.missingScoresCount === 1
                      ? "game is"
                      : "games are"}{" "}
                    missing scores.
                  </p>
                  <p className="mt-1 text-sm">
                    You can still mark this week complete, but the missing
                    scores will not be recorded.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowMarkCompleteDialog(false)}
                disabled={isMarkingComplete}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkComplete}
                disabled={isMarkingComplete}
              >
                {isMarkingComplete ? "Completing..." : "Mark Complete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
