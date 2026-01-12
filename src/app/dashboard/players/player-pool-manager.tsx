"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { validatePlayerName } from "@/lib/players/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { PlayerWithSeasons } from "./page";

interface PlayerPoolManagerProps {
  players: PlayerWithSeasons[];
}

export function PlayerPoolManager({ players }: PlayerPoolManagerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Track which player is being edited
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  // Track the current edit value
  const [editName, setEditName] = useState("");
  // Track saving state
  const [isSaving, setIsSaving] = useState(false);

  // Start editing a player's name
  function handleStartEdit(player: PlayerWithSeasons) {
    setEditingPlayerId(player.id);
    setEditName(player.name);
    setError(null);
  }

  // Cancel editing
  function handleCancelEdit() {
    setEditingPlayerId(null);
    setEditName("");
    setError(null);
  }

  // Save the edited name
  async function handleSaveName(playerId: string) {
    setError(null);

    // Validate the name
    let trimmedName: string;
    try {
      trimmedName = validatePlayerName(editName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid name");
      return;
    }

    // Check if name actually changed
    const originalPlayer = players.find((p) => p.id === playerId);
    if (originalPlayer && originalPlayer.name === trimmedName) {
      // No change, just cancel
      handleCancelEdit();
      return;
    }

    setIsSaving(true);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("players")
      .update({ name: trimmedName })
      .eq("id", playerId);

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    // Success - reset state and refresh
    setEditingPlayerId(null);
    setEditName("");
    setIsSaving(false);
    router.refresh();
  }

  // Handle Enter key to save
  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    playerId: string
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveName(playerId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground mb-4">
        Players cannot be deleted to preserve historical data. You can edit
        names, which will update across all seasons.
      </div>

      <div className="space-y-2">
        {players.map((player) => {
          const isEditing = editingPlayerId === player.id;

          return (
            <div
              key={player.id}
              className="flex items-start justify-between rounded-lg border p-3 gap-4"
            >
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, player.id)}
                      autoFocus
                      className="flex-1"
                      disabled={isSaving}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveName(player.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="font-medium">{player.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {player.seasons.length > 0 ? (
                        player.seasons.map((season) => (
                          <Link
                            key={season.id}
                            href={`/dashboard/seasons/${season.id}`}
                          >
                            <Badge
                              variant="secondary"
                              className="cursor-pointer hover:bg-secondary/80"
                            >
                              {season.name}
                            </Badge>
                          </Link>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not assigned to any season
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartEdit(player)}
                >
                  Edit
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
