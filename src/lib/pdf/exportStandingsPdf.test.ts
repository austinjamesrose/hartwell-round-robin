import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a mock storage object that can be shared between the factory and tests
const mockFns = {
  save: vi.fn(),
  text: vi.fn(),
  line: vi.fn(),
  rect: vi.fn(),
  addPage: vi.fn(),
  setPage: vi.fn(),
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  setFillColor: vi.fn(),
  setTextColor: vi.fn(),
  getTextWidth: vi.fn().mockReturnValue(50),
  getNumberOfPages: vi.fn().mockReturnValue(1),
};

// Setup mock - using factory that returns class
vi.mock("jspdf", () => {
  return {
    jsPDF: class {
      internal = {
        pageSize: {
          getWidth: () => 612,
          getHeight: () => 792,
        },
      };
      text(...args: unknown[]) {
        mockFns.text(...args);
      }
      line(...args: unknown[]) {
        mockFns.line(...args);
      }
      rect(...args: unknown[]) {
        mockFns.rect(...args);
      }
      addPage(...args: unknown[]) {
        mockFns.addPage(...args);
      }
      setPage(...args: unknown[]) {
        mockFns.setPage(...args);
      }
      setFontSize(...args: unknown[]) {
        mockFns.setFontSize(...args);
      }
      setFont(...args: unknown[]) {
        mockFns.setFont(...args);
      }
      setDrawColor(...args: unknown[]) {
        mockFns.setDrawColor(...args);
      }
      setLineWidth(...args: unknown[]) {
        mockFns.setLineWidth(...args);
      }
      setFillColor(...args: unknown[]) {
        mockFns.setFillColor(...args);
      }
      setTextColor(...args: unknown[]) {
        mockFns.setTextColor(...args);
      }
      getTextWidth(...args: unknown[]) {
        return mockFns.getTextWidth(...args);
      }
      getNumberOfPages(...args: unknown[]) {
        return mockFns.getNumberOfPages(...args);
      }
      save(...args: unknown[]) {
        mockFns.save(...args);
      }
    },
  };
});

// Import after mock setup
import { exportStandingsPdf } from "./exportStandingsPdf";
import type { RankedPlayer } from "@/lib/leaderboard/ranking";

describe("exportStandingsPdf", () => {
  beforeEach(() => {
    Object.values(mockFns).forEach((fn) => fn.mockClear());
  });

  // Sample test data
  const sampleRankedPlayers: RankedPlayer[] = [
    {
      playerId: "p1",
      playerName: "Alice",
      totalPoints: 88,
      gamesPlayed: 8,
      wins: 7,
      winPercentage: 87.5,
      rank: 1,
      isTied: false,
    },
    {
      playerId: "p2",
      playerName: "Bob",
      totalPoints: 82,
      gamesPlayed: 8,
      wins: 6,
      winPercentage: 75,
      rank: 2,
      isTied: false,
    },
    {
      playerId: "p3",
      playerName: "Charlie",
      totalPoints: 78,
      gamesPlayed: 8,
      wins: 5,
      winPercentage: 62.5,
      rank: 3,
      isTied: true,
    },
    {
      playerId: "p4",
      playerName: "Diana",
      totalPoints: 78,
      gamesPlayed: 8,
      wins: 5,
      winPercentage: 62.5,
      rank: 3,
      isTied: true,
    },
  ];

  it("generates a PDF file with the correct filename", () => {
    exportStandingsPdf({
      standingsInfo: {
        seasonName: "Fall 2026",
      },
      rankedPlayers: sampleRankedPlayers,
    });

    expect(mockFns.save).toHaveBeenCalledTimes(1);
    expect(mockFns.save).toHaveBeenCalledWith("Fall_2026_Standings.pdf");
  });

  it("sanitizes special characters in season name for filename", () => {
    exportStandingsPdf({
      standingsInfo: {
        seasonName: "Spring@2026",
      },
      rankedPlayers: sampleRankedPlayers,
    });

    expect(mockFns.save).toHaveBeenCalledWith("Spring_2026_Standings.pdf");
  });

  it("includes season name in the PDF header", () => {
    exportStandingsPdf({
      standingsInfo: {
        seasonName: "Winter 2026",
      },
      rankedPlayers: sampleRankedPlayers,
    });

    // Verify text function was called with season name
    expect(mockFns.text).toHaveBeenCalledWith(
      "Winter 2026",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("includes 'Standings as of [date]' in the PDF header", () => {
    exportStandingsPdf({
      standingsInfo: {
        seasonName: "Test Season",
      },
      rankedPlayers: sampleRankedPlayers,
    });

    // Verify text function was called with standings date
    expect(mockFns.text).toHaveBeenCalledWith(
      expect.stringContaining("Standings as of"),
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("renders table headers", () => {
    exportStandingsPdf({
      standingsInfo: {
        seasonName: "Test Season",
      },
      rankedPlayers: sampleRankedPlayers,
    });

    // Verify table headers are rendered
    expect(mockFns.text).toHaveBeenCalledWith(
      "Rank",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Player",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Points",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Games",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Wins",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Win%",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("renders player data in table rows", () => {
    exportStandingsPdf({
      standingsInfo: {
        seasonName: "Test Season",
      },
      rankedPlayers: sampleRankedPlayers,
    });

    // Verify player names are rendered
    expect(mockFns.text).toHaveBeenCalledWith(
      "Alice",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Bob",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("handles tied players correctly", () => {
    exportStandingsPdf({
      standingsInfo: {
        seasonName: "Test Season",
      },
      rankedPlayers: sampleRankedPlayers,
    });

    // Verify tied rank format is used (T3)
    expect(mockFns.text).toHaveBeenCalledWith(
      "T3",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("handles empty standings without errors", () => {
    expect(() => {
      exportStandingsPdf({
        standingsInfo: {
          seasonName: "Empty Season",
        },
        rankedPlayers: [],
      });
    }).not.toThrow();

    expect(mockFns.save).toHaveBeenCalledTimes(1);

    // Should show "No games have been played yet" message
    expect(mockFns.text).toHaveBeenCalledWith(
      "No games have been played yet.",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("handles large standings with pagination", () => {
    // Create many players to trigger pagination
    const manyPlayers: RankedPlayer[] = [];
    for (let i = 1; i <= 50; i++) {
      manyPlayers.push({
        playerId: `p${i}`,
        playerName: `Player ${i}`,
        totalPoints: 100 - i,
        gamesPlayed: 8,
        wins: Math.floor((100 - i) / 11),
        winPercentage: ((100 - i) / 11) * 12.5,
        rank: i,
        isTied: false,
      });
    }

    expect(() => {
      exportStandingsPdf({
        standingsInfo: {
          seasonName: "Large Season",
        },
        rankedPlayers: manyPlayers,
      });
    }).not.toThrow();

    expect(mockFns.save).toHaveBeenCalledTimes(1);
  });

  it("adds footer with page numbers", () => {
    exportStandingsPdf({
      standingsInfo: {
        seasonName: "Test Season",
      },
      rankedPlayers: sampleRankedPlayers,
    });

    // Verify page number is added
    expect(mockFns.text).toHaveBeenCalledWith(
      "Page 1 of 1",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("adds generated timestamp to footer", () => {
    exportStandingsPdf({
      standingsInfo: {
        seasonName: "Test Season",
      },
      rankedPlayers: sampleRankedPlayers,
    });

    // Verify generated timestamp is added
    expect(mockFns.text).toHaveBeenCalledWith(
      expect.stringContaining("Generated:"),
      expect.any(Number),
      expect.any(Number)
    );
  });
});
