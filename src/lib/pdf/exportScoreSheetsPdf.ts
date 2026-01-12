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

// Group games by court (for printing one sheet per court)
interface CourtData {
  courtNumber: number;
  games: Game[];
}

function groupByCourt(games: Game[]): CourtData[] {
  // Find all unique court numbers
  const courtNumbers = new Set<number>();
  for (const game of games) {
    courtNumbers.add(game.court_number);
  }

  // Sort court numbers
  const sortedCourts = Array.from(courtNumbers).sort((a, b) => a - b);

  // Build court data - each court gets all rounds played on it, sorted by round
  return sortedCourts.map((courtNumber) => ({
    courtNumber,
    games: games
      .filter((g) => g.court_number === courtNumber)
      .sort((a, b) => a.round_number - b.round_number),
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
 * Generate a PDF with score sheets organized by court.
 * One page per court, with round boxes for scorekeeping.
 * Formatted for letter (8.5x11") landscape paper.
 *
 * This organization allows admins to print and place one sheet at each court,
 * where players can self-report scores for all rounds played at that court.
 *
 * Returns the jsPDF instance for testing, and triggers download.
 */
export function exportScoreSheetsPdf(data: ExportScoreSheetsData): jsPDF {
  const { scheduleInfo, games, players } = data;
  const playerMap = createPlayerNameMap(players);
  const courts = groupByCourt(games);

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

  // Calculate available height for content area
  // Header takes approximately: 22 (season) + 20 (week) + 25 (court) + 20 (line+gap) = 87pt
  // Footer needs about 30pt
  const pageHeaderHeight = 87;
  const footerSpace = 30;
  const availableHeight = pageHeight - margin - pageHeaderHeight - footerSpace;

  // Determine max games per court to calculate required rows
  const maxGamesPerCourt = Math.max(...courts.map((c) => c.games.length), 1);
  const columnsPerRow = 3;
  const rowsNeeded = Math.ceil(maxGamesPerCourt / columnsPerRow);

  // Round box dimensions - sized dynamically based on rows needed
  const boxWidth = (pageWidth - margin * 2 - 20) / columnsPerRow; // 3 columns with gaps
  const columnGap = 10;
  const rowGap = 6;

  // Calculate box height to fit all rows: rowsNeeded*boxHeight + (rowsNeeded-1)*rowGap = availableHeight
  const boxHeight = Math.floor((availableHeight - (rowsNeeded - 1) * rowGap) / rowsNeeded);

  // Score box size scales with box height (minimum 36pt for handwriting)
  const scoreBoxSize = Math.max(36, Math.min(44, Math.floor(boxHeight * 0.35)));

  // Process each court as a separate page
  courts.forEach((court, courtIndex) => {
    // Add new page for courts after the first
    if (courtIndex > 0) {
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

    // Court Number (prominent - this is what identifies the sheet for placement)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Court ${court.courtNumber}`, pageWidth / 2, y, { align: "center" });
    y += 25;

    // Horizontal line under header
    doc.setDrawColor(200);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    // ========== ROUND BOXES GRID ==========
    // Layout rounds in a grid (3 columns)
    const roundsPerRow = 3;

    court.games.forEach((game, gameIndex) => {
      const col = gameIndex % roundsPerRow;
      const row = Math.floor(gameIndex / roundsPerRow);

      const boxX = margin + col * (boxWidth + columnGap);
      const boxY = y + row * (boxHeight + rowGap);

      // Draw round box (showing round number in header instead of court number)
      drawRoundBox(doc, game, playerMap, boxX, boxY, boxWidth, boxHeight, scoreBoxSize);
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
 * Draw a single round box with team names and score boxes
 * Shows the round number in the header (since the page is organized by court)
 */
function drawRoundBox(
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

  // Scale internal dimensions based on box height
  // For a "standard" box of ~130pt, these are the baseline values
  const scaleFactor = height / 130;
  const boxHeaderHeight = Math.max(18, Math.floor(20 * scaleFactor));
  const headerFontSize = Math.max(10, Math.floor(12 * scaleFactor));
  const labelFontSize = Math.max(7, Math.floor(8 * scaleFactor));
  const nameFontSize = Math.max(8, Math.floor(10 * scaleFactor));

  // Round number header (since the page is for a specific court, show the round)
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, width, boxHeaderHeight, "F");
  doc.setDrawColor(60);
  doc.setLineWidth(0.5);
  doc.line(x, y + boxHeaderHeight, x + width, y + boxHeaderHeight);

  doc.setFontSize(headerFontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(`Round ${game.round_number}`, x + width / 2, y + boxHeaderHeight * 0.7, { align: "center" });

  // Team section positions
  const teamSectionY = y + boxHeaderHeight;
  const teamSectionHeight = (height - boxHeaderHeight) / 2;
  const playerPadding = 6;
  const nameMaxWidth = width - scoreBoxSize - playerPadding * 3;

  // Vertical spacing within team sections (scaled)
  const labelOffset = Math.max(8, Math.floor(10 * scaleFactor));
  const name1Offset = Math.max(18, Math.floor(22 * scaleFactor));
  const name2Offset = Math.max(28, Math.floor(34 * scaleFactor));

  // ========== TEAM 1 ==========
  const team1Y = teamSectionY;
  const team1Names = [
    getPlayerName(game.team1_player1_id, playerMap),
    getPlayerName(game.team1_player2_id, playerMap),
  ];

  // Team 1 label
  doc.setFontSize(labelFontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100);
  doc.text("TEAM 1", x + playerPadding, team1Y + labelOffset);

  // Team 1 player names
  doc.setFontSize(nameFontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  const player1Name1 = truncateText(doc, team1Names[0], nameMaxWidth);
  const player1Name2 = truncateText(doc, team1Names[1], nameMaxWidth);
  doc.text(player1Name1, x + playerPadding, team1Y + name1Offset);
  doc.text(player1Name2, x + playerPadding, team1Y + name2Offset);

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
  doc.setFontSize(labelFontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100);
  doc.text("TEAM 2", x + playerPadding, team2Y + labelOffset);

  // Team 2 player names
  doc.setFontSize(nameFontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  const player2Name1 = truncateText(doc, team2Names[0], nameMaxWidth);
  const player2Name2 = truncateText(doc, team2Names[1], nameMaxWidth);
  doc.text(player2Name1, x + playerPadding, team2Y + name1Offset);
  doc.text(player2Name2, x + playerPadding, team2Y + name2Offset);

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
