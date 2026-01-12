import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

// Mock sonner toast - use vi.hoisted for variables used in mocks
const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: mockToast,
}));

// Mock Supabase client - use vi.hoisted for variables used in mocks
const { mockDelete, mockEq, mockFrom } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockEq: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
  }),
}));

// Mock validation functions to simplify tests - use actual zod for newPlayerSchema
vi.mock("@/lib/players/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/players/validation")>();
  return {
    ...actual,
    // Keep the real schema so zodResolver works
    newPlayerSchema: actual.newPlayerSchema,
    checkPlayerRemoval: (gameCount: number) => ({
      canRemove: gameCount === 0,
      gameCount,
      message: gameCount === 0 ? "Player can be removed" : `Player has ${gameCount} game${gameCount === 1 ? "" : "s"} recorded`,
    }),
    validatePlayerNameForDuplicate: vi.fn().mockResolvedValue({ valid: true }),
  };
});

// Import component after mocks
import { RosterManager } from "./roster-manager";

describe("RosterManager - Confirmation Dialog", () => {
  const mockPlayer = {
    id: "player-1",
    name: "John Doe",
    admin_id: "admin-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  const defaultProps = {
    seasonId: "season-1",
    allPlayers: [mockPlayer],
    rosterPlayers: [mockPlayer],
    playerGameCounts: { "player-1": 0 }, // No games, so can be removed
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mock chain for delete operation: .delete().eq("season_id", x).eq("player_id", y)
    // First eq returns an object with eq method, second eq resolves with result
    const secondEq = vi.fn().mockResolvedValue({ error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    mockDelete.mockReturnValue({ eq: firstEq });
    mockEq.mockImplementation(() => ({ eq: mockEq }));
    mockFrom.mockReturnValue({
      delete: mockDelete,
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
  });

  it("clicking Remove button opens confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<RosterManager {...defaultProps} />);

    // Find and click the Remove button
    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    // Dialog should be open with Remove Player title
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Remove Player")).toBeInTheDocument();
  });

  it("dialog displays correct player name", async () => {
    const user = userEvent.setup();
    render(<RosterManager {...defaultProps} />);

    // Open the dialog
    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    // Dialog should show the player name
    expect(screen.getByText(/Remove John Doe from this season's roster\?/)).toBeInTheDocument();
  });

  it("clicking Cancel closes dialog without calling remove API", async () => {
    const user = userEvent.setup();
    render(<RosterManager {...defaultProps} />);

    // Open the dialog
    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    // Click Cancel
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Delete should not have been called
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("clicking Remove in dialog calls remove API and closes dialog", async () => {
    const user = userEvent.setup();
    render(<RosterManager {...defaultProps} />);

    // Open the dialog
    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    // Wait for dialog to open
    await screen.findByRole("dialog");

    // Find all Remove buttons - the second one should be in the dialog (has destructive styling)
    const buttons = screen.getAllByRole("button", { name: /^remove$/i });
    // The dialog's Remove button is the one with 'destructive' in its class
    const confirmRemoveButton = buttons.find(btn => btn.getAttribute("data-variant") === "destructive");
    expect(confirmRemoveButton).toBeDefined();
    await user.click(confirmRemoveButton!);

    // Delete should have been called
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("season_players");
    });
    expect(mockDelete).toHaveBeenCalled();

    // Toast success should be called
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("John Doe removed from roster");
    });
  });

  it("shows toast success message after removal", async () => {
    const user = userEvent.setup();
    render(<RosterManager {...defaultProps} />);

    // Open the dialog
    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    // Wait for dialog to open
    await screen.findByRole("dialog");

    // Find the dialog's Remove button (has destructive styling)
    const buttons = screen.getAllByRole("button", { name: /^remove$/i });
    const confirmRemoveButton = buttons.find(btn => btn.getAttribute("data-variant") === "destructive");
    await user.click(confirmRemoveButton!);

    // Toast success should be called with correct message
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("John Doe removed from roster");
    });
  });

  it("Remove button is disabled for players with games", async () => {
    const propsWithGames = {
      ...defaultProps,
      playerGameCounts: { "player-1": 5 }, // Has games, cannot be removed
    };

    render(<RosterManager {...propsWithGames} />);

    // Remove button should be disabled
    const removeButton = screen.getByRole("button", { name: /remove/i });
    expect(removeButton).toBeDisabled();
  });

  it("shows error message when removal fails", async () => {
    // Re-setup mocks for this test to simulate a failure
    const secondEq = vi.fn().mockResolvedValue({ error: { message: "Database error" } });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    mockDelete.mockReturnValue({ eq: firstEq });
    mockFrom.mockReturnValue({
      delete: mockDelete,
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          ilike: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const user = userEvent.setup();
    render(<RosterManager {...defaultProps} />);

    // Open the dialog
    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    // Wait for dialog to open
    await screen.findByRole("dialog");

    // Find the dialog's Remove button (has destructive styling)
    const buttons = screen.getAllByRole("button", { name: /^remove$/i });
    const confirmRemoveButton = buttons.find(btn => btn.getAttribute("data-variant") === "destructive");
    await user.click(confirmRemoveButton!);

    // Toast error should be called
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Failed to remove player from roster");
    });
  });
});
