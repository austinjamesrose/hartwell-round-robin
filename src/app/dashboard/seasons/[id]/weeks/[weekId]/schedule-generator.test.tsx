import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}));

// Import component after mocks
import { ScheduleGenerator } from "./schedule-generator";

// Helper to create mock players
function createMockPlayers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

describe("ScheduleGenerator - Disabled State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Generate Schedule button is disabled when availablePlayers < 24", () => {
    render(
      <ScheduleGenerator
        weekId="week-1"
        numCourts={6}
        availablePlayers={createMockPlayers(20)}
        hasExistingSchedule={false}
        weekStatus="draft"
      />
    );

    const button = screen.getByRole("button", { name: /generate schedule/i });
    expect(button).toBeDisabled();
  });

  it("Generate Schedule button is disabled when availablePlayers > 32", () => {
    render(
      <ScheduleGenerator
        weekId="week-1"
        numCourts={6}
        availablePlayers={createMockPlayers(35)}
        hasExistingSchedule={false}
        weekStatus="draft"
      />
    );

    const button = screen.getByRole("button", { name: /generate schedule/i });
    expect(button).toBeDisabled();
  });

  it("Generate Schedule button is enabled when availablePlayers = 28 (within valid range)", () => {
    render(
      <ScheduleGenerator
        weekId="week-1"
        numCourts={6}
        availablePlayers={createMockPlayers(28)}
        hasExistingSchedule={false}
        weekStatus="draft"
      />
    );

    const button = screen.getByRole("button", { name: /generate schedule/i });
    expect(button).not.toBeDisabled();
  });

  it("shows visible warning message with current player count when too few players", () => {
    render(
      <ScheduleGenerator
        weekId="week-1"
        numCourts={6}
        availablePlayers={createMockPlayers(20)}
        hasExistingSchedule={false}
        weekStatus="draft"
      />
    );

    // Warning should show the current count
    expect(
      screen.getByText(/need at least 24 available players \(currently 20\)/i)
    ).toBeInTheDocument();
  });

  it("shows visible warning message with current player count when too many players", () => {
    render(
      <ScheduleGenerator
        weekId="week-1"
        numCourts={6}
        availablePlayers={createMockPlayers(35)}
        hasExistingSchedule={false}
        weekStatus="draft"
      />
    );

    // Warning should show the current count
    expect(
      screen.getByText(/maximum 32 available players allowed \(currently 35\)/i)
    ).toBeInTheDocument();
  });

  it("does not show warning message when player count is valid", () => {
    render(
      <ScheduleGenerator
        weekId="week-1"
        numCourts={6}
        availablePlayers={createMockPlayers(28)}
        hasExistingSchedule={false}
        weekStatus="draft"
      />
    );

    // Warning messages should not be present
    expect(screen.queryByText(/need at least/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/maximum.*allowed/i)).not.toBeInTheDocument();
  });

  it("Generate Schedule button is enabled at boundary of 24 players", () => {
    render(
      <ScheduleGenerator
        weekId="week-1"
        numCourts={6}
        availablePlayers={createMockPlayers(24)}
        hasExistingSchedule={false}
        weekStatus="draft"
      />
    );

    const button = screen.getByRole("button", { name: /generate schedule/i });
    expect(button).not.toBeDisabled();
  });

  it("Generate Schedule button is enabled at boundary of 32 players", () => {
    render(
      <ScheduleGenerator
        weekId="week-1"
        numCourts={6}
        availablePlayers={createMockPlayers(32)}
        hasExistingSchedule={false}
        weekStatus="draft"
      />
    );

    const button = screen.getByRole("button", { name: /generate schedule/i });
    expect(button).not.toBeDisabled();
  });

  it("button is disabled when week status is not draft", () => {
    render(
      <ScheduleGenerator
        weekId="week-1"
        numCourts={6}
        availablePlayers={createMockPlayers(28)}
        hasExistingSchedule={false}
        weekStatus="finalized"
      />
    );

    const button = screen.getByRole("button", { name: /generate schedule/i });
    expect(button).toBeDisabled();
  });
});
