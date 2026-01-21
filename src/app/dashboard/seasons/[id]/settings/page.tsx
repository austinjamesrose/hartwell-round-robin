"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Settings } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SeasonNav } from "../components/SeasonNav";
import { formatDate } from "@/lib/dates/dateUtils";

type Season = Database["public"]["Tables"]["seasons"]["Row"];

export default function SeasonSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundsPerWeek, setRoundsPerWeek] = useState<string>("");

  // Load params and season data
  useEffect(() => {
    async function loadData() {
      const { id } = await params;
      setSeasonId(id);

      const supabase = createClient();

      // Verify user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch the season
      const { data: seasonData, error: fetchError } = await supabase
        .from("seasons")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !seasonData) {
        setError("Season not found");
        setIsLoading(false);
        return;
      }

      setSeason(seasonData);
      setRoundsPerWeek(seasonData.rounds_per_week?.toString() ?? "");
      setIsLoading(false);
    }

    loadData();
  }, [params, router]);

  async function handleSave() {
    if (!seasonId || !season) return;

    setIsSaving(true);
    setError(null);

    const supabase = createClient();

    // Parse the rounds per week value
    const parsedRounds = roundsPerWeek === "" ? null : parseInt(roundsPerWeek);

    // Validate if a value is provided
    if (parsedRounds !== null && (parsedRounds < 1 || parsedRounds > 20)) {
      setError("Rounds per week must be between 1 and 20");
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("seasons")
      .update({ rounds_per_week: parsedRounds })
      .eq("id", seasonId);

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    // Update local state
    setSeason({ ...season, rounds_per_week: parsedRounds });
    toast.success("Settings saved");
    setIsSaving(false);
    router.refresh();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-4xl">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!season || !seasonId) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertDescription>{error || "Season not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/dashboard/seasons/${seasonId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            {season.name}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">Settings</span>
        </div>

        {/* Season Header */}
        <header className="mb-4">
          <h1 className="text-2xl font-bold">{season.name}</h1>
          <p className="text-muted-foreground">
            Started {formatDate(season.start_date)} • {season.num_weeks} weeks •{" "}
            {season.num_courts} courts
          </p>
        </header>

        {/* Season Navigation */}
        <SeasonNav seasonId={seasonId} />

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Season Settings
            </CardTitle>
            <CardDescription>
              Configure schedule generation settings for this season.
              Changes only affect future schedule generations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="roundsPerWeek">Rounds Per Week (Optional)</Label>
              <Input
                id="roundsPerWeek"
                type="number"
                min={1}
                max={20}
                placeholder="Auto-calculate"
                value={roundsPerWeek}
                onChange={(e) => setRoundsPerWeek(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Leave blank for 8 games per player. Set a value to fix rounds
                (players may get fewer games).
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
