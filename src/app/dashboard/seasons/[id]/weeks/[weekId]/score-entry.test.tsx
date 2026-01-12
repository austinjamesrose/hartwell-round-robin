import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoreEntry } from "./score-entry";
import type { Database } from "@/types/database";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
  })),
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

type Game = Database["public"]["Tables"]["games"]["Row"];

// Helper to create mock games
function createMockGame(overrides: Partial<Game>): Game {
  return {
    id: crypto.randomUUID(),
    week_id: "week-1",
    round_number: 1,
    court_number: 1,
    team1_player1_id: "p1",
    team1_player2_id: "p2",
    team2_player1_id: "p3",
    team2_player2_id: "p4",
    team1_score: null,
    team2_score: null,
    status: "scheduled",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Mock players for display
const mockPlayers = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Carol" },
  { id: "p4", name: "Dan" },
];

describe("ScoreEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("filter controls", () => {
    it("renders filter UI with 'By Round' as default", () => {
      const games = [
        createMockGame({ round_number: 1, court_number: 1 }),
        createMockGame({ round_number: 1, court_number: 2 }),
        createMockGame({ round_number: 2, court_number: 1 }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      // Should show filter type toggle with "By Round" active
      const byRoundButton = screen.getByRole("button", { name: "By Round" });
      expect(byRoundButton).toHaveAttribute("data-active", "true");

      // Should show filter dropdown
      const dropdown = screen.getByTestId("filter-dropdown");
      expect(dropdown).toBeInTheDocument();
    });

    it("defaults to Round 1 selected", () => {
      const games = [
        createMockGame({ round_number: 1, court_number: 1 }),
        createMockGame({ round_number: 2, court_number: 1 }),
        createMockGame({ round_number: 3, court_number: 1 }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      // Dropdown trigger should contain "Round 1" text
      const dropdown = screen.getByTestId("filter-dropdown");
      expect(dropdown).toHaveTextContent("Round 1");
    });

    it("shows only games from selected round", () => {
      const games = [
        createMockGame({ id: "g1", round_number: 1, court_number: 1 }),
        createMockGame({ id: "g2", round_number: 1, court_number: 2 }),
        createMockGame({ id: "g3", round_number: 2, court_number: 1 }),
        createMockGame({ id: "g4", round_number: 2, court_number: 2 }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      // Default is Round 1, should show 2 games
      const summary = screen.getByTestId("filter-summary");
      expect(summary).toHaveTextContent("Showing 2 games");
    });

    it("switches filter type to court when 'By Court' is clicked", () => {
      const games = [
        createMockGame({ round_number: 1, court_number: 1 }),
        createMockGame({ round_number: 1, court_number: 2 }),
        createMockGame({ round_number: 2, court_number: 1 }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      // Click "By Court" button
      const byCourtButton = screen.getByRole("button", { name: "By Court" });
      fireEvent.click(byCourtButton);

      // "By Court" should now be active
      expect(byCourtButton).toHaveAttribute("data-active", "true");

      // "By Round" should not be active
      const byRoundButton = screen.getByRole("button", { name: "By Round" });
      expect(byRoundButton).toHaveAttribute("data-active", "false");
    });

    it("resets to first option when changing filter type", () => {
      const games = [
        createMockGame({ round_number: 1, court_number: 3 }),
        createMockGame({ round_number: 2, court_number: 1 }),
        createMockGame({ round_number: 3, court_number: 2 }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      // Initially dropdown should show "Round 1" (first round)
      const dropdown = screen.getByTestId("filter-dropdown");
      expect(dropdown).toHaveTextContent("Round 1");

      // Click "By Court"
      const byCourtButton = screen.getByRole("button", { name: "By Court" });
      fireEvent.click(byCourtButton);

      // Dropdown should now show "Court 1" (first court number, sorted)
      expect(dropdown).toHaveTextContent("Court 1");
    });

    it("shows correct summary with completed game counts", () => {
      const games = [
        createMockGame({ round_number: 1, court_number: 1, team1_score: 11, team2_score: 9 }),
        createMockGame({ round_number: 1, court_number: 2, team1_score: null, team2_score: null }),
        createMockGame({ round_number: 1, court_number: 3, team1_score: 8, team2_score: 11 }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      // Should show "Showing 3 games | 2 of 3 completed"
      const summary = screen.getByTestId("filter-summary");
      expect(summary).toHaveTextContent("Showing 3 games | 2 of 3 completed");
    });
  });

  describe("filtering behavior", () => {
    it("filters games by round correctly", () => {
      const games = [
        createMockGame({ round_number: 1, court_number: 1 }),
        createMockGame({ round_number: 2, court_number: 1 }),
        createMockGame({ round_number: 2, court_number: 2 }),
        createMockGame({ round_number: 3, court_number: 1 }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      // Default is Round 1 - should show 1 game
      expect(screen.getByTestId("filter-summary")).toHaveTextContent(
        "Showing 1 games"
      );
    });

    it("filters games by court correctly after switching", () => {
      const games = [
        createMockGame({ round_number: 1, court_number: 1 }),
        createMockGame({ round_number: 2, court_number: 1 }),
        createMockGame({ round_number: 1, court_number: 2 }),
        createMockGame({ round_number: 2, court_number: 2 }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      // Switch to "By Court"
      fireEvent.click(screen.getByRole("button", { name: "By Court" }));

      // Default court 1 - should show 2 games
      expect(screen.getByTestId("filter-summary")).toHaveTextContent(
        "Showing 2 games"
      );
    });
  });

  describe("display conditions", () => {
    it("returns null when weekStatus is not 'finalized'", () => {
      const games = [createMockGame({})];

      const { container } = render(
        <ScoreEntry games={games} players={mockPlayers} weekStatus="draft" />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("returns null when there are no games", () => {
      const { container } = render(
        <ScoreEntry games={[]} players={mockPlayers} weekStatus="finalized" />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("renders score entry card when status is finalized with games", () => {
      const games = [createMockGame({})];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      expect(screen.getByText("Score Entry")).toBeInTheDocument();
    });
  });

  describe("progress indicator", () => {
    it("shows progress text with correct counts", () => {
      const games = [
        createMockGame({ team1_score: 11, team2_score: 9 }),
        createMockGame({ team1_score: 11, team2_score: 7 }),
        createMockGame({ team1_score: null, team2_score: null }),
        createMockGame({ team1_score: null, team2_score: null }),
        createMockGame({ team1_score: null, team2_score: null }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      const progressText = screen.getByTestId("progress-text");
      expect(progressText).toHaveTextContent("2 of 5 games completed (40%)");
    });

    it("shows CheckCircle icon when 100% complete", () => {
      const games = [
        createMockGame({ team1_score: 11, team2_score: 9 }),
        createMockGame({ team1_score: 11, team2_score: 7 }),
        createMockGame({ team1_score: 8, team2_score: 11 }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      expect(screen.getByTestId("progress-complete-icon")).toBeInTheDocument();
      expect(screen.getByTestId("progress-text")).toHaveTextContent("100%");
    });

    it("does not show CheckCircle icon when not 100% complete", () => {
      const games = [
        createMockGame({ team1_score: 11, team2_score: 9 }),
        createMockGame({ team1_score: null, team2_score: null }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      expect(screen.queryByTestId("progress-complete-icon")).not.toBeInTheDocument();
    });

    it("renders progress bar with correct width", () => {
      const games = [
        createMockGame({ team1_score: 11, team2_score: 9 }),
        createMockGame({ team1_score: null, team2_score: null }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      const progressBar = screen.getByTestId("progress-bar");
      // 1 of 2 = 50%
      expect(progressBar).toHaveStyle({ width: "50%" });
    });

    it("shows 0% progress when no games completed", () => {
      const games = [
        createMockGame({ team1_score: null, team2_score: null }),
        createMockGame({ team1_score: null, team2_score: null }),
      ];

      render(
        <ScoreEntry
          games={games}
          players={mockPlayers}
          weekStatus="finalized"
        />
      );

      expect(screen.getByTestId("progress-text")).toHaveTextContent("0 of 2 games completed (0%)");
      expect(screen.getByTestId("progress-bar")).toHaveStyle({ width: "0%" });
    });
  });
});
