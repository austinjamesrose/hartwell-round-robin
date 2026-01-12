import { jsPDF } from "jspdf";

// Types matching the database schema
interface Game {
  id: string;
  round_number: number;
  court_number: number;
  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
  team1_score: number | null;
  team2_score: number | null;
}

interface PlayerInfo {
  id: string;
  name: string;
}

// Schedule information needed for PDF header
interface ScheduleInfo {
  seasonName: string;
  weekNumber: number;
  weekDate: string; // formatted date string
}

// Input data for PDF generation
interface ExportScoreSheetsData {
  scheduleInfo: ScheduleInfo;
  games: Game[];
  players: PlayerInfo[];
}

// Data structure for a single court box
interface CourtBoxData {
  courtNumber: number;
  team1: { player1: string; player2: string };
  team2: { player1: string; player2: string };
}

// Helper to create player name lookup map
function createPlayerNameMap(players: PlayerInfo[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const player of players) {
    map.set(player.id, player.name);
  }
  return map;
}

// Helper to get player name by ID
function getPlayerName(playerId: string, playerMap: Map<string, string>): string {
  return playerMap.get(playerId) || "Unknown";
}

// Group games by round
interface RoundData {
  roundNumber: number;
  games: Game[];
}

function groupByRound(games: Game[]): RoundData[] {
  // Find all unique round numbers
  const roundNumbers = new Set<number>();
  for (const game of games) {
    roundNumbers.add(game.round_number);
  }

  // Sort round numbers
  const sortedRounds = Array.from(roundNumbers).sort((a, b) => a - b);

  // Build round data
  return sortedRounds.map((roundNumber) => ({
    roundNumber,
    games: games
      .filter((g) => g.round_number === roundNumber)
      .sort((a, b) => a.court_number - b.court_number),
  }));
}

/**
 * Generate court box layout data for a game
 */
export function generateCourtBox(
  game: Game,
  playerMap: Map<string, string>
): CourtBoxData {
  return {
    courtNumber: game.court_number,
    team1: {
      player1: getPlayerName(game.team1_player1_id, playerMap),
      player2: getPlayerName(game.team1_player2_id, playerMap),
    },
    team2: {
      player1: getPlayerName(game.team2_player1_id, playerMap),
      player2: getPlayerName(game.team2_player2_id, playerMap),
    },
  };
}

/**
 * Generate a PDF with score sheets for each round.
 * One page per round, with court boxes for scorekeeping.
 * Formatted for letter (8.5x11") landscape paper.
 *
 * Returns the jsPDF instance for testing, and triggers download.
 */
export function exportScoreSheetsPdf(data: ExportScoreSheetsData): jsPDF {
  const { scheduleInfo, games, players } = data;
  const playerMap = createPlayerNameMap(players);
  const rounds = groupByRound(games);

  // Create PDF document (landscape, letter size)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt", // points (72 per inch)
    format: "letter",
  });

  // Page dimensions in points (landscape letter: 792 x 612)
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40; // 40pt margin (~0.55 inches)

  // Court box dimensions
  const boxWidth = (pageWidth - margin * 2 - 30) / 3; // 3 columns with gaps
  const boxHeight = 170; // Height for each court box
  const columnGap = 15;
  const rowGap = 15;

  // Score box size (minimum 0.75 inch = 54pt, using 60pt for comfort)
  const scoreBoxSize = 60;

  // Process each round as a separate page
  rounds.forEach((round, roundIndex) => {
    // Add new page for rounds after the first
    if (roundIndex > 0) {
      doc.addPage();
    }

    let y = margin;

    // ========== HEADER ==========
    // Season Name (large, bold)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(scheduleInfo.seasonName, pageWidth / 2, y, { align: "center" });
    y += 22;

    // Week Number and Date
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Week ${scheduleInfo.weekNumber} - ${scheduleInfo.weekDate}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 20;

    // Round Number (prominent)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Round ${round.roundNumber}`, pageWidth / 2, y, { align: "center" });
    y += 25;

    // Horizontal line under header
    doc.setDrawColor(200);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    // ========== COURT BOXES GRID ==========
    // Layout courts in a grid (3 columns)
    const courtsPerRow = 3;

    round.games.forEach((game, gameIndex) => {
      const col = gameIndex % courtsPerRow;
      const row = Math.floor(gameIndex / courtsPerRow);

      const boxX = margin + col * (boxWidth + columnGap);
      const boxY = y + row * (boxHeight + rowGap);

      // Draw court box
      drawCourtBox(doc, game, playerMap, boxX, boxY, boxWidth, boxHeight, scoreBoxSize);
    });
  });

  // ========== FOOTER ==========
  // Add footer with page numbers on each page
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 20, {
      align: "right",
    });
    doc.setTextColor(0); // Reset to black
  }

  // ========== DOWNLOAD ==========
  // Generate filename: [SeasonName]-Week[X]-ScoreSheets.pdf
  const safeSeasonName = scheduleInfo.seasonName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_");
  const filename = `${safeSeasonName}-Week${scheduleInfo.weekNumber}-ScoreSheets.pdf`;

  doc.save(filename);

  return doc;
}

/**
 * Draw a single court box with team names and score boxes
 */
function drawCourtBox(
  doc: jsPDF,
  game: Game,
  playerMap: Map<string, string>,
  x: number,
  y: number,
  width: number,
  height: number,
  scoreBoxSize: number
): void {
  // Draw outer border
  doc.setDrawColor(60);
  doc.setLineWidth(1.5);
  doc.rect(x, y, width, height);

  // Court number header
  const headerHeight = 28;
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, width, headerHeight, "F");
  doc.setDrawColor(60);
  doc.setLineWidth(0.5);
  doc.line(x, y + headerHeight, x + width, y + headerHeight);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(`Court ${game.court_number}`, x + width / 2, y + 19, { align: "center" });

  // Team section positions
  const teamSectionY = y + headerHeight;
  const teamSectionHeight = (height - headerHeight) / 2;
  const playerPadding = 10;
  const nameMaxWidth = width - scoreBoxSize - playerPadding * 3;

  // ========== TEAM 1 ==========
  const team1Y = teamSectionY;
  const team1Names = [
    getPlayerName(game.team1_player1_id, playerMap),
    getPlayerName(game.team1_player2_id, playerMap),
  ];

  // Team 1 label
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100);
  doc.text("TEAM 1", x + playerPadding, team1Y + 14);

  // Team 1 player names
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  const player1Name1 = truncateText(doc, team1Names[0], nameMaxWidth);
  const player1Name2 = truncateText(doc, team1Names[1], nameMaxWidth);
  doc.text(player1Name1, x + playerPadding, team1Y + 30);
  doc.text(player1Name2, x + playerPadding, team1Y + 45);

  // Team 1 score box
  const scoreBoxX = x + width - scoreBoxSize - playerPadding;
  const scoreBox1Y = team1Y + (teamSectionHeight - scoreBoxSize) / 2;
  doc.setDrawColor(0);
  doc.setLineWidth(1);
  doc.rect(scoreBoxX, scoreBox1Y, scoreBoxSize, scoreBoxSize);

  // Divider line between teams
  doc.setDrawColor(180);
  doc.setLineWidth(0.5);
  doc.line(x + 5, teamSectionY + teamSectionHeight, x + width - 5, teamSectionY + teamSectionHeight);

  // ========== TEAM 2 ==========
  const team2Y = teamSectionY + teamSectionHeight;
  const team2Names = [
    getPlayerName(game.team2_player1_id, playerMap),
    getPlayerName(game.team2_player2_id, playerMap),
  ];

  // Team 2 label
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100);
  doc.text("TEAM 2", x + playerPadding, team2Y + 14);

  // Team 2 player names
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  const player2Name1 = truncateText(doc, team2Names[0], nameMaxWidth);
  const player2Name2 = truncateText(doc, team2Names[1], nameMaxWidth);
  doc.text(player2Name1, x + playerPadding, team2Y + 30);
  doc.text(player2Name2, x + playerPadding, team2Y + 45);

  // Team 2 score box
  const scoreBox2Y = team2Y + (teamSectionHeight - scoreBoxSize) / 2;
  doc.setDrawColor(0);
  doc.setLineWidth(1);
  doc.rect(scoreBoxX, scoreBox2Y, scoreBoxSize, scoreBoxSize);
}

/**
 * Truncate text to fit within a given width
 */
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  const textWidth = doc.getTextWidth(text);
  if (textWidth <= maxWidth) {
    return text;
  }

  // Binary search for the right truncation point
  let truncated = text;
  while (doc.getTextWidth(truncated + "...") > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }

  return truncated + "...";
}
