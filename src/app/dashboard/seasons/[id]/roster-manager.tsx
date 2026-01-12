"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createClient } from "@/lib/supabase/client";
import {
  newPlayerSchema,
  type NewPlayerFormValues,
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
import type { Database } from "@/types/database";

type Player = Database["public"]["Tables"]["players"]["Row"];

interface RosterManagerProps {
  seasonId: string;
  // All players owned by the admin
  allPlayers: Player[];
  // Players already in this season's roster
  rosterPlayers: Player[];
}

export function RosterManager({
  seasonId,
  allPlayers,
  rosterPlayers,
}: RosterManagerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isAddingExisting, setIsAddingExisting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

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
      setIsAddingExisting(false);
      return;
    }

    // Reset selection and refresh
    setSelectedPlayerId("");
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
      setIsCreatingNew(false);
      return;
    }

    // Reset form and refresh
    newPlayerForm.reset();
    router.refresh();
    setIsCreatingNew(false);
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
              className="flex gap-2"
            >
              <FormField
                control={newPlayerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Enter player name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCreatingNew}>
                {isCreatingNew ? "Creating..." : "Create & Add"}
              </Button>
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
                .map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <span>{player.name}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No players added to this season yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
