"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  validateAvailableCount,
  getAvailabilityWarning,
} from "@/lib/availability/validation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Availability entry with player data
export interface PlayerAvailability {
  playerId: string;
  playerName: string;
  isAvailable: boolean;
  // Database ID if this record exists, null if we need to create it
  availabilityId: string | null;
}

interface AvailabilityManagerProps {
  weekId: string;
  // All players in the season roster with their availability status
  playerAvailability: PlayerAvailability[];
}

export function AvailabilityManager({
  weekId,
  playerAvailability,
}: AvailabilityManagerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Track which toggles are currently being updated
  const [updatingPlayers, setUpdatingPlayers] = useState<Set<string>>(new Set());
  // Local state for immediate UI feedback
  const [localAvailability, setLocalAvailability] = useState<Map<string, boolean>>(
    () => new Map(playerAvailability.map((p) => [p.playerId, p.isAvailable]))
  );

  // Calculate available count from local state
  const availableCount = Array.from(localAvailability.values()).filter(
    (isAvailable) => isAvailable
  ).length;
  const totalCount = playerAvailability.length;

  // Validation result
  const validation = validateAvailableCount(availableCount);
  const warning = getAvailabilityWarning(availableCount);

  // Toggle availability for a player
  async function handleToggleAvailability(
    playerId: string,
    currentlyAvailable: boolean,
    availabilityId: string | null
  ) {
    // Optimistic update
    const newAvailable = !currentlyAvailable;
    setLocalAvailability((prev) => new Map(prev).set(playerId, newAvailable));
    setUpdatingPlayers((prev) => new Set(prev).add(playerId));
    setError(null);

    const supabase = createClient();

    try {
      if (availabilityId) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("player_availability")
          .update({ is_available: newAvailable })
          .eq("id", availabilityId);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new record (uses upsert to handle race conditions)
        const { error: insertError } = await supabase
          .from("player_availability")
          .upsert(
            {
              week_id: weekId,
              player_id: playerId,
              is_available: newAvailable,
            },
            {
              onConflict: "week_id,player_id",
            }
          );

        if (insertError) {
          throw insertError;
        }
      }

      // Refresh the page data to get updated IDs and ensure consistency
      router.refresh();
    } catch (err) {
      // Revert optimistic update
      setLocalAvailability((prev) =>
        new Map(prev).set(playerId, currentlyAvailable)
      );
      setError(err instanceof Error ? err.message : "Failed to update availability");
    } finally {
      setUpdatingPlayers((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  }

  // Sort players alphabetically
  const sortedPlayers = [...playerAvailability].sort((a, b) =>
    a.playerName.localeCompare(b.playerName)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Availability</CardTitle>
        <CardDescription>
          <span
            className={
              !validation.isValid
                ? "text-red-600 font-medium"
                : warning
                  ? "text-yellow-600"
                  : ""
            }
          >
            {availableCount} of {totalCount} players available
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation error or warning */}
        {!validation.isValid && (
          <Alert variant="destructive">
            <AlertDescription>{validation.message}</AlertDescription>
          </Alert>
        )}

        {validation.isValid && warning && (
          <Alert>
            <AlertDescription className="text-yellow-800">{warning}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Player availability list */}
        {sortedPlayers.length > 0 ? (
          <div className="space-y-2">
            {sortedPlayers.map((player) => {
              const isAvailable = localAvailability.get(player.playerId) ?? player.isAvailable;
              const isUpdating = updatingPlayers.has(player.playerId);

              return (
                <div
                  key={player.playerId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <Label
                    htmlFor={`availability-${player.playerId}`}
                    className="flex-1 cursor-pointer"
                  >
                    {player.playerName}
                  </Label>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm ${
                        isAvailable ? "text-green-600" : "text-muted-foreground"
                      }`}
                    >
                      {isAvailable ? "Available" : "Unavailable"}
                    </span>
                    <Switch
                      id={`availability-${player.playerId}`}
                      checked={isAvailable}
                      disabled={isUpdating}
                      onCheckedChange={() =>
                        handleToggleAvailability(
                          player.playerId,
                          isAvailable,
                          player.availabilityId
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No players in the season roster. Add players from the season page first.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
