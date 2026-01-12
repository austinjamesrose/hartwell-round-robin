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
  setTextColor: vi.fn(),
  getTextWidth: vi.fn().mockReturnValue(100),
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
import { exportSchedulePdf } from "./exportSchedulePdf";

describe("exportSchedulePdf", () => {
  beforeEach(() => {
    Object.values(mockFns).forEach((fn) => fn.mockClear());
  });

  // Sample test data
  const samplePlayers = [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Charlie" },
    { id: "p4", name: "Diana" },
    { id: "p5", name: "Eve" },
    { id: "p6", name: "Frank" },
    { id: "p7", name: "Grace" },
    { id: "p8", name: "Henry" },
  ];

  const sampleGames = [
    {
      id: "g1",
      round_number: 1,
      court_number: 1,
      team1_player1_id: "p1",
      team1_player2_id: "p2",
      team2_player1_id: "p3",
      team2_player2_id: "p4",
      team1_score: null,
      team2_score: null,
    },
    {
      id: "g2",
      round_number: 1,
      court_number: 2,
      team1_player1_id: "p5",
      team1_player2_id: "p6",
      team2_player1_id: "p7",
      team2_player2_id: "p8",
      team1_score: null,
      team2_score: null,
    },
    {
      id: "g3",
      round_number: 2,
      court_number: 1,
      team1_player1_id: "p1",
      team1_player2_id: "p3",
      team2_player1_id: "p5",
      team2_player2_id: "p7",
      team1_score: null,
      team2_score: null,
    },
    {
      id: "g4",
      round_number: 2,
      court_number: 2,
      team1_player1_id: "p2",
      team1_player2_id: "p4",
      team2_player1_id: "p6",
      team2_player2_id: "p8",
      team1_score: null,
      team2_score: null,
    },
  ];

  const sampleByes = [
    { player_id: "p9", round_number: 1 },
    { player_id: "p10", round_number: 2 },
  ];

  it("generates a PDF file with the correct filename", () => {
    exportSchedulePdf({
      scheduleInfo: {
        seasonName: "Fall 2026",
        weekNumber: 3,
        weekDate: "Jan 15, 2026",
      },
      games: sampleGames,
      byes: [],
      players: samplePlayers,
    });

    expect(mockFns.save).toHaveBeenCalledTimes(1);
    expect(mockFns.save).toHaveBeenCalledWith("Fall_2026_Week3_Schedule.pdf");
  });

  it("sanitizes special characters in season name for filename", () => {
    exportSchedulePdf({
      scheduleInfo: {
        seasonName: "Fall@2026",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGames,
      byes: [],
      players: samplePlayers,
    });

    // Special characters like @ become underscores
    expect(mockFns.save).toHaveBeenCalledWith("Fall_2026_Week1_Schedule.pdf");
  });

  it("includes season name in the PDF header", () => {
    exportSchedulePdf({
      scheduleInfo: {
        seasonName: "Spring 2026",
        weekNumber: 5,
        weekDate: "Mar 10, 2026",
      },
      games: sampleGames,
      byes: [],
      players: samplePlayers,
    });

    // Verify text function was called with season name
    expect(mockFns.text).toHaveBeenCalledWith(
      "Spring 2026",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("includes week number and date in the PDF header", () => {
    exportSchedulePdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 7,
        weekDate: "Feb 20, 2026",
      },
      games: sampleGames,
      byes: [],
      players: samplePlayers,
    });

    // Verify text function was called with week info
    expect(mockFns.text).toHaveBeenCalledWith(
      "Week 7 - Feb 20, 2026",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("renders court numbers for each game", () => {
    exportSchedulePdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGames,
      byes: [],
      players: samplePlayers,
    });

    // Verify court numbers are in the output
    expect(mockFns.text).toHaveBeenCalledWith(
      "Ct 1:",
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Ct 2:",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("renders player names in matchups", () => {
    exportSchedulePdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGames,
      byes: [],
      players: samplePlayers,
    });

    // Verify player names are included (Alice & Bob vs Charlie & Diana)
    expect(mockFns.text).toHaveBeenCalledWith(
      expect.stringContaining("Alice"),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("handles schedules with byes", () => {
    const playersWithByes = [
      ...samplePlayers,
      { id: "p9", name: "Ivy" },
      { id: "p10", name: "Jack" },
    ];

    exportSchedulePdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGames,
      byes: sampleByes,
      players: playersWithByes,
    });

    // Verify bye text is included
    expect(mockFns.text).toHaveBeenCalledWith(
      expect.stringContaining("Bye:"),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("handles empty schedules without errors", () => {
    expect(() => {
      exportSchedulePdf({
        scheduleInfo: {
          seasonName: "Empty Season",
          weekNumber: 1,
          weekDate: "Jan 1, 2026",
        },
        games: [],
        byes: [],
        players: [],
      });
    }).not.toThrow();

    expect(mockFns.save).toHaveBeenCalledTimes(1);
  });

  it("handles schedules with many rounds", () => {
    // Create a schedule with 12 rounds (should trigger pagination)
    const manyRoundGames = [];
    for (let round = 1; round <= 12; round++) {
      manyRoundGames.push({
        id: `g${round}`,
        round_number: round,
        court_number: 1,
        team1_player1_id: "p1",
        team1_player2_id: "p2",
        team2_player1_id: "p3",
        team2_player2_id: "p4",
        team1_score: null,
        team2_score: null,
      });
    }

    expect(() => {
      exportSchedulePdf({
        scheduleInfo: {
          seasonName: "Long Season",
          weekNumber: 1,
          weekDate: "Jan 1, 2026",
        },
        games: manyRoundGames,
        byes: [],
        players: samplePlayers,
      });
    }).not.toThrow();

    expect(mockFns.save).toHaveBeenCalledTimes(1);
  });

  it("draws round borders and headers", () => {
    exportSchedulePdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGames,
      byes: [],
      players: samplePlayers,
    });

    // Verify rectangles are drawn (round borders)
    expect(mockFns.rect).toHaveBeenCalled();

    // Verify round headers are written
    expect(mockFns.text).toHaveBeenCalledWith(
      "Round 1",
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Round 2",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("adds footer with page numbers", () => {
    exportSchedulePdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGames,
      byes: [],
      players: samplePlayers,
    });

    // Verify page number is added
    expect(mockFns.text).toHaveBeenCalledWith(
      "Page 1 of 1",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });
});
