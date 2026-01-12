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
  setFillColor: vi.fn(),
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
          getWidth: () => 792, // Landscape letter width
          getHeight: () => 612, // Landscape letter height
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
      setFillColor(...args: unknown[]) {
        mockFns.setFillColor(...args);
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
import { exportScoreSheetsPdf, generateCourtBox } from "./exportScoreSheetsPdf";

describe("exportScoreSheetsPdf", () => {
  beforeEach(() => {
    Object.values(mockFns).forEach((fn) => fn.mockClear());
    mockFns.getNumberOfPages.mockReturnValue(1);
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

  const sampleGamesRound1 = [
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
  ];

  const sampleGamesMultiRound = [
    ...sampleGamesRound1,
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

  it("returns jsPDF instance", () => {
    const result = exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Fall 2026",
        weekNumber: 3,
        weekDate: "Jan 15, 2026",
      },
      games: sampleGamesRound1,
      players: samplePlayers,
    });

    // Result should be a jsPDF instance (has the expected methods)
    expect(result).toBeDefined();
    expect(typeof result.text).toBe("function");
    expect(typeof result.save).toBe("function");
  });

  it("has correct number of pages (one per round)", () => {
    // Mock 2 pages for 2 rounds
    mockFns.getNumberOfPages.mockReturnValue(2);

    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Fall 2026",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGamesMultiRound,
      players: samplePlayers,
    });

    // Should call addPage once (for the second round)
    expect(mockFns.addPage).toHaveBeenCalledTimes(1);
  });

  it("header includes season name", () => {
    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Spring 2026",
        weekNumber: 5,
        weekDate: "Mar 10, 2026",
      },
      games: sampleGamesRound1,
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

  it("header includes week number and date", () => {
    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 7,
        weekDate: "Feb 20, 2026",
      },
      games: sampleGamesRound1,
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

  it("renders round headers on each page", () => {
    mockFns.getNumberOfPages.mockReturnValue(2);

    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGamesMultiRound,
      players: samplePlayers,
    });

    // Verify round headers are written
    expect(mockFns.text).toHaveBeenCalledWith(
      "Round 1",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Round 2",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("renders court numbers for each game", () => {
    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGamesRound1,
      players: samplePlayers,
    });

    // Verify court numbers are in the output
    expect(mockFns.text).toHaveBeenCalledWith(
      "Court 1",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Court 2",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object)
    );
  });

  it("renders player names in court boxes", () => {
    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGamesRound1,
      players: samplePlayers,
    });

    // Verify player names are included
    expect(mockFns.text).toHaveBeenCalledWith(
      "Alice",
      expect.any(Number),
      expect.any(Number)
    );
    expect(mockFns.text).toHaveBeenCalledWith(
      "Bob",
      expect.any(Number),
      expect.any(Number)
    );
  });

  it("draws score boxes (rectangles)", () => {
    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGamesRound1,
      players: samplePlayers,
    });

    // Verify rectangles are drawn (for court boxes and score boxes)
    expect(mockFns.rect).toHaveBeenCalled();
  });

  it("saves with correct filename format", () => {
    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Fall 2026",
        weekNumber: 3,
        weekDate: "Jan 15, 2026",
      },
      games: sampleGamesRound1,
      players: samplePlayers,
    });

    expect(mockFns.save).toHaveBeenCalledTimes(1);
    expect(mockFns.save).toHaveBeenCalledWith("Fall_2026-Week3-ScoreSheets.pdf");
  });

  it("sanitizes special characters in filename", () => {
    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Fall@2026!",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGamesRound1,
      players: samplePlayers,
    });

    // Special characters become underscores
    expect(mockFns.save).toHaveBeenCalledWith("Fall_2026_-Week1-ScoreSheets.pdf");
  });

  it("adds page number footer", () => {
    exportScoreSheetsPdf({
      scheduleInfo: {
        seasonName: "Test Season",
        weekNumber: 1,
        weekDate: "Jan 1, 2026",
      },
      games: sampleGamesRound1,
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

  it("handles empty schedule without errors", () => {
    expect(() => {
      exportScoreSheetsPdf({
        scheduleInfo: {
          seasonName: "Empty Season",
          weekNumber: 1,
          weekDate: "Jan 1, 2026",
        },
        games: [],
        players: [],
      });
    }).not.toThrow();

    expect(mockFns.save).toHaveBeenCalledTimes(1);
  });
});

describe("generateCourtBox", () => {
  it("returns correct layout data for court", () => {
    const game = {
      id: "g1",
      round_number: 1,
      court_number: 3,
      team1_player1_id: "p1",
      team1_player2_id: "p2",
      team2_player1_id: "p3",
      team2_player2_id: "p4",
      team1_score: null,
      team2_score: null,
    };

    const players = [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
      { id: "p4", name: "Diana" },
    ];

    const playerMap = new Map(players.map((p) => [p.id, p.name]));

    const result = generateCourtBox(game, playerMap);

    expect(result.courtNumber).toBe(3);
    expect(result.team1.player1).toBe("Alice");
    expect(result.team1.player2).toBe("Bob");
    expect(result.team2.player1).toBe("Charlie");
    expect(result.team2.player2).toBe("Diana");
  });

  it("handles unknown player IDs gracefully", () => {
    const game = {
      id: "g1",
      round_number: 1,
      court_number: 1,
      team1_player1_id: "unknown1",
      team1_player2_id: "unknown2",
      team2_player1_id: "unknown3",
      team2_player2_id: "unknown4",
      team1_score: null,
      team2_score: null,
    };

    const playerMap = new Map<string, string>();

    const result = generateCourtBox(game, playerMap);

    expect(result.team1.player1).toBe("Unknown");
    expect(result.team1.player2).toBe("Unknown");
    expect(result.team2.player1).toBe("Unknown");
    expect(result.team2.player2).toBe("Unknown");
  });
});
