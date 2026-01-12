"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findActiveWeekId, type Week } from "./week-utils";

interface WeekNavigationProps {
  seasonId: string;
  weeks: Week[];
  currentWeekId: string;
}

// Format date for compact display (e.g., "1/15")
function formatDateCompact(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Format date for full display (e.g., "January 15, 2026")
function formatDateFull(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Get status color classes
function getStatusClasses(status: Week["status"]): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "finalized":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function WeekNavigation({
  seasonId,
  weeks,
  currentWeekId,
}: WeekNavigationProps) {
  const router = useRouter();

  // Find the current week index
  const currentIndex = weeks.findIndex((w) => w.id === currentWeekId);
  const currentWeek = weeks[currentIndex];

  // Find the active week (for highlighting)
  const activeWeekId = findActiveWeekId(weeks);

  // Handle tab change
  const handleTabChange = (weekId: string) => {
    router.push(`/dashboard/seasons/${seasonId}/weeks/${weekId}`);
  };

  // Handle prev/next navigation
  const goToPrev = () => {
    if (currentIndex > 0) {
      router.push(`/dashboard/seasons/${seasonId}/weeks/${weeks[currentIndex - 1].id}`);
    }
  };

  const goToNext = () => {
    if (currentIndex < weeks.length - 1) {
      router.push(`/dashboard/seasons/${seasonId}/weeks/${weeks[currentIndex + 1].id}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mobile: Prev/Next navigation */}
      <div className="flex items-center justify-between sm:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center">
          <div className="font-medium">
            Week {currentWeek.week_number}{" "}
            {currentWeekId === activeWeekId && (
              <span className="text-xs text-blue-600">(Active)</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDateFull(currentWeek.date)}
          </div>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClasses(
              currentWeek.status
            )}`}
          >
            {currentWeek.status}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          disabled={currentIndex === weeks.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop: Tab navigation */}
      <div className="hidden sm:block">
        <Tabs value={currentWeekId} onValueChange={handleTabChange}>
          <TabsList className="h-auto flex-wrap">
            {weeks.map((week) => (
              <TabsTrigger
                key={week.id}
                value={week.id}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 ${
                  week.id === activeWeekId ? "ring-2 ring-blue-500 ring-offset-1" : ""
                }`}
              >
                <span className="text-sm font-medium">Wk {week.week_number}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateCompact(week.date)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Current week info banner */}
        <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
          <div>
            <span className="font-medium">Week {currentWeek.week_number}</span>
            <span className="ml-2 text-muted-foreground">
              {formatDateFull(currentWeek.date)}
            </span>
            {currentWeekId === activeWeekId && (
              <span className="ml-2 text-sm text-blue-600">(Active Week)</span>
            )}
          </div>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(
              currentWeek.status
            )}`}
          >
            {currentWeek.status}
          </span>
        </div>
      </div>
    </div>
  );
}
