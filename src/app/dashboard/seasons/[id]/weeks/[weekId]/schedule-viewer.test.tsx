// Tests for ScheduleViewer component - swap mode functionality

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScheduleViewer } from "./schedule-viewer";

// Mock the next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

// Test data setup
const mockPlayers = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Carol" },
  { id: "p4", name: "Dave" },
  { id: "p5", name: "Eve" },
  { id: "p6", name: "Frank" },
  { id: "p7", name: "Grace" },
  { id: "p8", name: "Henry" },
];

const mockGames = [
  {
    id: "game-1",
    week_id: "week-1",
    round_number: 1,
    court_number: 1,
    team1_player1_id: "p1",
    team1_player2_id: "p2",
    team2_player1_id: "p3",
    team2_player2_id: "p4",
    team1_score: null,
    team2_score: null,
    status: "scheduled" as const,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "game-2",
    week_id: "week-1",
    round_number: 1,
    court_number: 2,
    team1_player1_id: "p5",
    team1_player2_id: "p6",
    team2_player1_id: "p7",
    team2_player2_id: "p8",
    team1_score: null,
    team2_score: null,
    status: "scheduled" as const,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "game-3",
    week_id: "week-1",
    round_number: 2,
    court_number: 1,
    team1_player1_id: "p1",
    team1_player2_id: "p3",
    team2_player1_id: "p5",
    team2_player2_id: "p7",
    team1_score: null,
    team2_score: null,
    status: "scheduled" as const,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

const mockByes: Array<{
  id: string;
  week_id: string;
  round_number: number;
  player_id: string;
  created_at: string;
}> = [];

const defaultProps = {
  games: mockGames,
  byes: mockByes,
  players: mockPlayers,
  scheduleWarnings: null,
  weekStatus: "draft" as const,
  weekId: "week-1",
  gamesWithScoresCount: 0,
  scheduleInfo: {
    seasonName: "Test Season",
    weekNumber: 1,
    weekDate: "2026-01-15",
  },
};

describe("ScheduleViewer - Swap Mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clicking player on draft schedule enters swap mode", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    // Find and click a player name
    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);

    // Swap banner should appear
    expect(screen.getByTestId("swap-banner")).toBeInTheDocument();
  });

  it("selected player has correct highlight classes (ring-2 ring-blue-500)", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    const aliceElements = screen.getAllByText("Alice");
    const firstAlice = aliceElements[0];
    await user.click(firstAlice);

    // Check that the element has the blue ring styling
    expect(firstAlice).toHaveClass("ring-2");
    expect(firstAlice).toHaveClass("ring-blue-500");
  });

  it("swap banner displays with correct player name", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);

    const banner = screen.getByTestId("swap-banner");
    expect(banner).toHaveTextContent("Select another player to swap with");
    expect(banner).toHaveTextContent("Alice");
  });

  it("swap banner has Cancel button", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);

    expect(screen.getByTestId("cancel-swap-button")).toBeInTheDocument();
  });

  it("clicking Cancel exits swap mode and clears selection", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    // Enter swap mode
    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);
    expect(screen.getByTestId("swap-banner")).toBeInTheDocument();

    // Click Cancel
    await user.click(screen.getByTestId("cancel-swap-button"));

    // Banner should be gone
    expect(screen.queryByTestId("swap-banner")).not.toBeInTheDocument();
  });

  it("pressing Escape key exits swap mode", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    // Enter swap mode
    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);
    expect(screen.getByTestId("swap-banner")).toBeInTheDocument();

    // Press Escape
    await user.keyboard("{Escape}");

    // Banner should be gone
    expect(screen.queryByTestId("swap-banner")).not.toBeInTheDocument();
  });

  it("valid swap targets have green background (bg-green-100)", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    // Click Alice (p1 in round 1)
    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);

    // Carol (p3) is on opposing team in same game - should be a valid target
    const carolElements = screen.getAllByText("Carol");
    // Get Carol in round 1 (first occurrence)
    expect(carolElements[0]).toHaveClass("bg-green-100");
  });

  it("teammate is not highlighted as valid target", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    // Click Alice (p1 in round 1)
    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);

    // Bob (p2) is Alice's teammate - should NOT have green background
    const bobElements = screen.getAllByText("Bob");
    // Bob should not have the green class
    expect(bobElements[0]).not.toHaveClass("bg-green-100");
  });

  it("players in other rounds are dimmed when in swap mode", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    // Click Alice (p1 in round 1)
    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);

    // In round 2, players should be dimmed (opacity-50)
    // Find round 2's Grace (p7 is in round 2)
    const graceElements = screen.getAllByText("Grace");
    // The second Grace (in round 2) should be dimmed
    const round2Grace = graceElements.find((el) =>
      el.classList.contains("opacity-50")
    );
    expect(round2Grace).toBeDefined();
  });

  it("players in other rounds are not clickable during swap mode", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    // Click Alice (p1 in round 1)
    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);
    expect(screen.getByTestId("swap-banner")).toBeInTheDocument();

    // Try clicking on a round 2 player - should have cursor-not-allowed
    const graceElements = screen.getAllByText("Grace");
    // Find the dimmed Grace (in round 2)
    const draftRound2Grace = graceElements.find((el) =>
      el.classList.contains("opacity-50")
    );

    expect(draftRound2Grace).toHaveClass("cursor-not-allowed");
  });

  it("clicking same player deselects them", async () => {
    const user = userEvent.setup();
    render(<ScheduleViewer {...defaultProps} />);

    const aliceElements = screen.getAllByText("Alice");
    await user.click(aliceElements[0]);
    expect(screen.getByTestId("swap-banner")).toBeInTheDocument();

    // Click Alice again
    await user.click(aliceElements[0]);

    // Banner should be gone
    expect(screen.queryByTestId("swap-banner")).not.toBeInTheDocument();
  });

  it("players are not clickable when schedule is finalized", () => {
    render(<ScheduleViewer {...defaultProps} weekStatus="finalized" />);

    const aliceElements = screen.getAllByText("Alice");
    // In finalized mode, players should not have cursor-pointer
    expect(aliceElements[0]).not.toHaveClass("cursor-pointer");
  });

  it("players are not clickable when schedule is completed", () => {
    // Add scores to games for completed view
    const completedGames = mockGames.map((g) => ({
      ...g,
      team1_score: 11,
      team2_score: 5,
      status: "completed" as const,
    }));

    render(
      <ScheduleViewer
        {...defaultProps}
        games={completedGames}
        weekStatus="completed"
      />
    );

    // In completed mode, players should not have interactive styling
    const aliceElements = screen.getAllByText("Alice");
    expect(aliceElements[0]).not.toHaveClass("cursor-pointer");
  });
});
