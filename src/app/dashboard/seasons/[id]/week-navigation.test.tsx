import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeekNavigation } from "./week-navigation";
import { findActiveWeekId, type Week } from "./week-utils";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("WeekNavigation", () => {
  const mockWeeks: Week[] = [
    {
      id: "week-1",
      season_id: "season-1",
      week_number: 1,
      date: "2026-01-15",
      status: "completed",
    },
    {
      id: "week-2",
      season_id: "season-1",
      week_number: 2,
      date: "2026-01-22",
      status: "draft",
    },
    {
      id: "week-3",
      season_id: "season-1",
      week_number: 3,
      date: "2026-01-29",
      status: "draft",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selected week tab has 'active' styling (data-state=active)", () => {
    render(
      <WeekNavigation
        seasonId="season-1"
        weeks={mockWeeks}
        currentWeekId="week-2"
      />
    );

    // Find all tab triggers
    const tabs = screen.getAllByRole("tab");

    // Week 2 should be selected (has data-state="active")
    const week2Tab = tabs.find((tab) => tab.textContent?.includes("Wk 2"));
    expect(week2Tab).toHaveAttribute("data-state", "active");

    // Other tabs should not be active
    const week1Tab = tabs.find((tab) => tab.textContent?.includes("Wk 1"));
    const week3Tab = tabs.find((tab) => tab.textContent?.includes("Wk 3"));
    expect(week1Tab).toHaveAttribute("data-state", "inactive");
    expect(week3Tab).toHaveAttribute("data-state", "inactive");
  });

  it("clicking different week updates navigation via router.push", async () => {
    const user = userEvent.setup();

    render(
      <WeekNavigation
        seasonId="season-1"
        weeks={mockWeeks}
        currentWeekId="week-1"
      />
    );

    // Find week 2 tab and click it
    const tabs = screen.getAllByRole("tab");
    const week2Tab = tabs.find((tab) => tab.textContent?.includes("Wk 2"));
    expect(week2Tab).toBeDefined();

    await user.click(week2Tab!);

    // Should navigate to week 2
    expect(mockPush).toHaveBeenCalledWith(
      "/dashboard/seasons/season-1/weeks/week-2"
    );
  });

  it("'(Active Week)' label appears only on earliest non-completed week", () => {
    // Week 2 is the earliest non-completed week (week 1 is completed)
    render(
      <WeekNavigation
        seasonId="season-1"
        weeks={mockWeeks}
        currentWeekId="week-2"
      />
    );

    // The "(Active Week)" label should appear in the banner since week-2 is selected
    // and week-2 is also the active week (earliest non-completed)
    expect(screen.getByText("(Active Week)")).toBeInTheDocument();
  });

  it("'(Active Week)' label does not appear when viewing a different week", () => {
    // When viewing week-3, but week-2 is still the active week
    render(
      <WeekNavigation
        seasonId="season-1"
        weeks={mockWeeks}
        currentWeekId="week-3"
      />
    );

    // The "(Active Week)" label should NOT appear in the banner
    // because we're viewing week-3, not the active week (week-2)
    expect(screen.queryByText("(Active Week)")).not.toBeInTheDocument();
  });

  it("component displays the current week from props (URL-based navigation)", () => {
    // This tests that currentWeekId correctly controls which week is shown
    render(
      <WeekNavigation
        seasonId="season-1"
        weeks={mockWeeks}
        currentWeekId="week-3"
      />
    );

    // The info should show "Week 3" (appears in both mobile and desktop views)
    const week3Elements = screen.getAllByText(/Week 3/);
    expect(week3Elements.length).toBeGreaterThan(0);

    // Tab for week 3 should be active
    const tabs = screen.getAllByRole("tab");
    const week3Tab = tabs.find((tab) => tab.textContent?.includes("Wk 3"));
    expect(week3Tab).toHaveAttribute("data-state", "active");
  });

  it("active week (earliest non-completed) has blue ring styling", () => {
    render(
      <WeekNavigation
        seasonId="season-1"
        weeks={mockWeeks}
        currentWeekId="week-1"
      />
    );

    // Find all tab triggers
    const tabs = screen.getAllByRole("tab");

    // Week 2 is the active week (earliest non-completed) so should have ring styling
    const week2Tab = tabs.find((tab) => tab.textContent?.includes("Wk 2"));
    expect(week2Tab).toHaveClass("ring-2", "ring-blue-500");

    // Week 1 (completed) and week 3 (not active) should not have ring
    const week1Tab = tabs.find((tab) => tab.textContent?.includes("Wk 1"));
    const week3Tab = tabs.find((tab) => tab.textContent?.includes("Wk 3"));
    expect(week1Tab).not.toHaveClass("ring-blue-500");
    expect(week3Tab).not.toHaveClass("ring-blue-500");
  });
});

describe("findActiveWeekId", () => {
  it("returns the earliest non-completed week", () => {
    const weeks: Week[] = [
      {
        id: "week-1",
        season_id: "season-1",
        week_number: 1,
        date: "2026-01-15",
        status: "completed",
      },
      {
        id: "week-2",
        season_id: "season-1",
        week_number: 2,
        date: "2026-01-22",
        status: "draft",
      },
      {
        id: "week-3",
        season_id: "season-1",
        week_number: 3,
        date: "2026-01-29",
        status: "draft",
      },
    ];

    expect(findActiveWeekId(weeks)).toBe("week-2");
  });

  it("returns the last completed week when all weeks are completed", () => {
    const weeks: Week[] = [
      {
        id: "week-1",
        season_id: "season-1",
        week_number: 1,
        date: "2026-01-15",
        status: "completed",
      },
      {
        id: "week-2",
        season_id: "season-1",
        week_number: 2,
        date: "2026-01-22",
        status: "completed",
      },
    ];

    expect(findActiveWeekId(weeks)).toBe("week-2");
  });

  it("returns the first week when no weeks are completed", () => {
    const weeks: Week[] = [
      {
        id: "week-1",
        season_id: "season-1",
        week_number: 1,
        date: "2026-01-15",
        status: "draft",
      },
      {
        id: "week-2",
        season_id: "season-1",
        week_number: 2,
        date: "2026-01-22",
        status: "draft",
      },
    ];

    expect(findActiveWeekId(weeks)).toBe("week-1");
  });

  it("returns null for empty weeks array", () => {
    expect(findActiveWeekId([])).toBeNull();
  });

  it("handles weeks in non-sorted order correctly", () => {
    // Weeks provided out of order
    const weeks: Week[] = [
      {
        id: "week-3",
        season_id: "season-1",
        week_number: 3,
        date: "2026-01-29",
        status: "draft",
      },
      {
        id: "week-1",
        season_id: "season-1",
        week_number: 1,
        date: "2026-01-15",
        status: "completed",
      },
      {
        id: "week-2",
        season_id: "season-1",
        week_number: 2,
        date: "2026-01-22",
        status: "draft",
      },
    ];

    // Should still return week-2 as earliest non-completed
    expect(findActiveWeekId(weeks)).toBe("week-2");
  });

  it("finalized weeks are not considered completed", () => {
    const weeks: Week[] = [
      {
        id: "week-1",
        season_id: "season-1",
        week_number: 1,
        date: "2026-01-15",
        status: "completed",
      },
      {
        id: "week-2",
        season_id: "season-1",
        week_number: 2,
        date: "2026-01-22",
        status: "finalized",
      },
      {
        id: "week-3",
        season_id: "season-1",
        week_number: 3,
        date: "2026-01-29",
        status: "draft",
      },
    ];

    // Finalized is not completed, so week-2 should be the active week
    expect(findActiveWeekId(weeks)).toBe("week-2");
  });
});
