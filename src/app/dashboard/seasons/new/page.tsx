"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import {
  createSeasonSchema,
  createSeasonDefaults,
  calculateWeekDates,
  validateSeasonName,
  type CreateSeasonFormValues,
} from "@/lib/seasons/validation";

type SeasonInsert = Database["public"]["Tables"]["seasons"]["Insert"];
type WeekInsert = Database["public"]["Tables"]["weeks"]["Insert"];

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateSeasonPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isValidatingName, setIsValidatingName] = useState(false);

  const form = useForm<CreateSeasonFormValues>({
    resolver: zodResolver(createSeasonSchema),
    defaultValues: createSeasonDefaults,
  });

  // Validate season name uniqueness on blur
  async function handleNameBlur(name: string) {
    if (!name.trim()) {
      setNameError(null);
      return;
    }

    setIsValidatingName(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsValidatingName(false);
      return;
    }

    const result = await validateSeasonName(name, user.id);
    setNameError(result.error || null);
    setIsValidatingName(false);
  }

  async function onSubmit(data: CreateSeasonFormValues) {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to create a season");
      setIsLoading(false);
      return;
    }

    // Validate season name uniqueness before creating
    const nameValidation = await validateSeasonName(data.name, user.id);
    if (!nameValidation.valid) {
      setNameError(nameValidation.error || null);
      setIsLoading(false);
      return;
    }

    // Create the season
    const seasonToInsert: SeasonInsert = {
      admin_id: user.id,
      name: data.name,
      start_date: data.startDate,
      num_weeks: data.numWeeks,
      num_courts: data.numCourts,
      status: "active",
    };

    const { data: season, error: seasonError } = await supabase
      .from("seasons")
      .insert(seasonToInsert)
      .select()
      .single();

    if (seasonError) {
      setError(seasonError.message);
      toast.error("Failed to create season");
      setIsLoading(false);
      return;
    }

    // Auto-create week schedules for all weeks
    const weekDates = calculateWeekDates(data.startDate, data.numWeeks);
    const weeksToInsert: WeekInsert[] = weekDates.map((week) => ({
      season_id: season.id,
      week_number: week.weekNumber,
      date: week.date,
      status: "draft",
    }));

    const { error: weeksError } = await supabase.from("weeks").insert(weeksToInsert);

    if (weeksError) {
      // If weeks creation fails, we should delete the season to maintain consistency
      // (In production, this would ideally be a transaction)
      await supabase.from("seasons").delete().eq("id", season.id);
      setError(`Failed to create week schedules: ${weeksError.message}`);
      toast.error("Failed to create week schedules");
      setIsLoading(false);
      return;
    }

    // Show success toast and redirect to the season dashboard
    toast.success(`Season "${data.name}" created`);
    router.push(`/dashboard/seasons/${season.id}`);
    router.refresh();
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Season</CardTitle>
            <CardDescription>
              Set up a new round robin league season
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Season Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Spring 2026 League"
                          {...field}
                          onBlur={(e) => {
                            field.onBlur();
                            handleNameBlur(e.target.value);
                          }}
                          onChange={(e) => {
                            field.onChange(e);
                            // Clear the duplicate error when user starts typing again
                            if (nameError) setNameError(null);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this season
                      </FormDescription>
                      <FormMessage />
                      {nameError && (
                        <p className="text-sm font-medium text-destructive">
                          {nameError}
                        </p>
                      )}
                      {isValidatingName && (
                        <p className="text-sm text-muted-foreground">
                          Checking name availability...
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        The date of the first week of play
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numWeeks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Weeks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={12}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 7)
                            }
                          />
                        </FormControl>
                        <FormDescription>1-12 weeks</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numCourts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Courts</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={4}
                            max={8}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 6)
                            }
                          />
                        </FormControl>
                        <FormDescription>4-8 courts</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading || !!nameError || isValidatingName}>
                    {isLoading ? "Creating..." : "Create Season"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
