"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  newPlayerSchema,
  type NewPlayerFormValues,
  checkPlayerRemoval,
  validatePlayerNameForDuplicate,
  type PlayerNameValidationResult,
} from "@/lib/players/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Database } from "@/types/database";

type Player = Database["public"]["Tables"]["players"]["Row"];

interface RosterManagerProps {
  seasonId: string;
  // All players owned by the admin
  allPlayers: Player[];
  // Players already in this season's roster
  rosterPlayers: Player[];
  // Map of player ID to game count in this season
  playerGameCounts: Record<string, number>;
}

export function RosterManager({
  seasonId,
  allPlayers,
  rosterPlayers,
  playerGameCounts,
}: RosterManagerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isAddingExisting, setIsAddingExisting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  // Duplicate player name validation state
  const [nameValidation, setNameValidation] = useState<PlayerNameValidationResult | null>(null);
  const [isValidatingName, setIsValidatingName] = useState(false);

  // Confirmation dialog state for player removal
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  // Create a Set of player IDs already in the roster for quick lookup
  const rosterPlayerIds = new Set(rosterPlayers.map((p) => p.id));

  // Filter available players (not already in roster)
  const availablePlayers = allPlayers.filter((p) => !rosterPlayerIds.has(p.id));

  // Form for creating new player
  const newPlayerForm = useForm<NewPlayerFormValues>({
    resolver: zodResolver(newPlayerSchema),
    defaultValues: {
      name: "",
    },
  });

  // Validate player name for duplicates
  async function validateName(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameValidation(null);
      return;
    }

    setIsValidatingName(true);
    const supabase = createClient();

    // Get current user to scope the check to their players
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsValidatingName(false);
      return;
    }

    const result = await validatePlayerNameForDuplicate(trimmedName, user.id);
    setNameValidation(result);
    setIsValidatingName(false);
  }

  // Handle blur on the name input to trigger validation
  function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    validateName(e.target.value);
  }

  // Add an existing player to the season roster
  async function handleAddExistingPlayer() {
    if (!selectedPlayerId) {
      setError("Please select a player");
      return;
    }

    // Check for duplicate (should not happen due to filtering, but safety check)
    if (rosterPlayerIds.has(selectedPlayerId)) {
      setError("This player is already in the season roster");
      return;
    }

    setIsAddingExisting(true);
    setError(null);

    const supabase = createClient();

    const { error: insertError } = await supabase.from("season_players").insert({
      season_id: seasonId,
      player_id: selectedPlayerId,
    });

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === "23505") {
        setError("This player is already in the season roster");
      } else {
        setError(insertError.message);
      }
      toast.error("Failed to add player to roster");
      setIsAddingExisting(false);
      return;
    }

    // Get player name for the toast
    const addedPlayer = allPlayers.find((p) => p.id === selectedPlayerId);

    // Reset selection and refresh
    setSelectedPlayerId("");
    toast.success(`${addedPlayer?.name || "Player"} added to roster`);
    router.refresh();
    setIsAddingExisting(false);
  }

  // Create a new player and add them to the season roster
  async function handleCreateNewPlayer(data: NewPlayerFormValues) {
    setIsCreatingNew(true);
    setError(null);

    const supabase = createClient();

    // Get current user to set admin_id
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setIsCreatingNew(false);
      return;
    }

    // Validate for duplicate name on submit
    const validationResult = await validatePlayerNameForDuplicate(data.name, user.id);
    setNameValidation(validationResult);

    if (!validationResult.valid) {
      setIsCreatingNew(false);
      return;
    }

    // Create the new player
    const { data: newPlayer, error: createError } = await supabase
      .from("players")
      .insert({
        admin_id: user.id,
        name: data.name,
      })
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      toast.error("Failed to create player");
      setIsCreatingNew(false);
      return;
    }

    // Add the new player to the season roster
    const { error: rosterError } = await supabase.from("season_players").insert({
      season_id: seasonId,
      player_id: newPlayer.id,
    });

    if (rosterError) {
      setError(rosterError.message);
      toast.error("Failed to add player to roster");
      setIsCreatingNew(false);
      return;
    }

    // Reset form, validation state, and refresh
    newPlayerForm.reset();
    setNameValidation(null);
    toast.success(`${data.name} added to roster`);
    router.refresh();
    setIsCreatingNew(false);
  }

  // Add an existing player (who was detected as duplicate) to the season roster
  async function handleAddExistingDuplicate() {
    if (!nameValidation?.existingPlayer) return;

    const playerId = nameValidation.existingPlayer.id;

    // Check if player is already in this season
    if (rosterPlayerIds.has(playerId)) {
      setError("This player is already in this season's roster");
      return;
    }

    setIsAddingExisting(true);
    setError(null);

    const supabase = createClient();

    const playerName = nameValidation.existingPlayer.name;

    const { error: insertError } = await supabase.from("season_players").insert({
      season_id: seasonId,
      player_id: playerId,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("This player is already in the season roster");
      } else {
        setError(insertError.message);
      }
      toast.error("Failed to add player to roster");
      setIsAddingExisting(false);
      return;
    }

    // Reset form, validation state, and refresh
    newPlayerForm.reset();
    setNameValidation(null);
    toast.success(`${playerName} added to roster`);
    router.refresh();
    setIsAddingExisting(false);
  }

  // Open confirmation dialog for player removal
  function handleRemoveClick(player: Player) {
    setPlayerToRemove(player);
  }

  // Close the confirmation dialog without removing
  function handleCancelRemoval() {
    setPlayerToRemove(null);
  }

  // Remove a player from the season roster after confirmation
  async function handleConfirmRemoval() {
    if (!playerToRemove) return;

    const playerId = playerToRemove.id;
    const playerName = playerToRemove.name;

    // Check if player has game history
    const gameCount = playerGameCounts[playerId] || 0;
    const removalCheck = checkPlayerRemoval(gameCount);

    if (!removalCheck.canRemove) {
      setError(removalCheck.message);
      setPlayerToRemove(null);
      return;
    }

    setRemovingPlayerId(playerId);
    setError(null);

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("season_players")
      .delete()
      .eq("season_id", seasonId)
      .eq("player_id", playerId);

    if (deleteError) {
      setError(deleteError.message);
      toast.error("Failed to remove player from roster");
      setRemovingPlayerId(null);
      setPlayerToRemove(null);
      return;
    }

    toast.success(`${playerName} removed from roster`);
    router.refresh();
    setRemovingPlayerId(null);
    setPlayerToRemove(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season Roster</CardTitle>
        <CardDescription>
          {rosterPlayers.length} player{rosterPlayers.length !== 1 ? "s" : ""} in
          this season
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Add existing player section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Add Existing Player</h3>
          {availablePlayers.length > 0 ? (
            <div className="flex gap-2">
              <Select
                value={selectedPlayerId}
                onValueChange={setSelectedPlayerId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a player..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddExistingPlayer}
                disabled={!selectedPlayerId || isAddingExisting}
              >
                {isAddingExisting ? "Adding..." : "Add"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {allPlayers.length === 0
                ? "No players in your pool yet. Create a new player below."
                : "All players are already in this season."}
            </p>
          )}
        </div>

        {/* Create new player section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Create New Player</h3>
          <Form {...newPlayerForm}>
            <form
              onSubmit={newPlayerForm.handleSubmit(handleCreateNewPlayer)}
              className="space-y-2"
            >
              <div className="flex gap-2">
                <FormField
                  control={newPlayerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Enter player name..."
                          {...field}
                          onBlur={(e) => {
                            field.onBlur();
                            handleNameBlur(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={
                    isCreatingNew ||
                    isValidatingName ||
                    (nameValidation !== null && !nameValidation.valid)
                  }
                >
                  {isCreatingNew ? "Creating..." : isValidatingName ? "Checking..." : "Create & Add"}
                </Button>
              </div>
              {/* Duplicate player validation message */}
              {nameValidation && !nameValidation.valid && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm">
                  <p className="font-medium text-yellow-800">
                    {nameValidation.error}
                  </p>
                  {nameValidation.existingPlayer && !rosterPlayerIds.has(nameValidation.existingPlayer.id) && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-yellow-700">
                        Would you like to add &quot;{nameValidation.existingPlayer.name}&quot; to this season instead?
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddExistingDuplicate}
                        disabled={isAddingExisting}
                      >
                        {isAddingExisting ? "Adding..." : "Add to Season"}
                      </Button>
                    </div>
                  )}
                  {nameValidation.existingPlayer && rosterPlayerIds.has(nameValidation.existingPlayer.id) && (
                    <p className="mt-1 text-yellow-700">
                      This player is already in this season&apos;s roster.
                    </p>
                  )}
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Current roster display */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current Roster</h3>
          {rosterPlayers.length > 0 ? (
            <div className="space-y-1">
              {rosterPlayers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((player) => {
                  const gameCount = playerGameCounts[player.id] || 0;
                  const removalCheck = checkPlayerRemoval(gameCount);
                  const isRemoving = removingPlayerId === player.id;

                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <Link
                        href={`/dashboard/seasons/${seasonId}/players/${player.id}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {player.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        {!removalCheck.canRemove && (
                          <span className="text-xs text-muted-foreground">
                            {removalCheck.message}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveClick(player)}
                          disabled={!removalCheck.canRemove || isRemoving}
                          title={
                            removalCheck.canRemove
                              ? "Remove from season"
                              : removalCheck.message
                          }
                        >
                          {isRemoving ? "Removing..." : "Remove"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No players added to this season yet.
            </p>
          )}
        </div>

        {/* Confirmation dialog for player removal */}
        <Dialog
          open={playerToRemove !== null}
          onOpenChange={(open) => {
            if (!open) handleCancelRemoval();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Player</DialogTitle>
              <DialogDescription>
                Remove {playerToRemove?.name} from this season&apos;s roster?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelRemoval}
                disabled={removingPlayerId !== null}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmRemoval}
                disabled={removingPlayerId !== null}
              >
                {removingPlayerId !== null ? "Removing..." : "Remove"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
