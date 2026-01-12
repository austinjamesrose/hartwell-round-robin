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

interface Bye {
  player_id: string;
  round_number: number;
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
interface ExportScheduleData {
  scheduleInfo: ScheduleInfo;
  games: Game[];
  byes: Bye[];
  players: PlayerInfo[];
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

// Group games and byes by round
interface DisplayRound {
  roundNumber: number;
  games: Game[];
  byePlayerIds: string[];
}

function groupByRound(games: Game[], byes: Bye[]): DisplayRound[] {
  // Find all unique round numbers
  const roundNumbers = new Set<number>();
  for (const game of games) {
    roundNumbers.add(game.round_number);
  }
  for (const bye of byes) {
    roundNumbers.add(bye.round_number);
  }

  // Sort round numbers
  const sortedRounds = Array.from(roundNumbers).sort((a, b) => a - b);

  // Build display rounds
  return sortedRounds.map((roundNumber) => ({
    roundNumber,
    games: games
      .filter((g) => g.round_number === roundNumber)
      .sort((a, b) => a.court_number - b.court_number),
    byePlayerIds: byes
      .filter((b) => b.round_number === roundNumber)
      .map((b) => b.player_id),
  }));
}

/**
 * Generate a PDF of the weekly schedule for printing.
 * Formatted for letter (8.5x11") / A4 paper.
 */
export function exportSchedulePdf(data: ExportScheduleData): void {
  const { scheduleInfo, games, byes, players } = data;
  const playerMap = createPlayerNameMap(players);
  const rounds = groupByRound(games, byes);

  // Create PDF document (landscape, letter size)
  // Landscape gives more horizontal space for player names
  // jsPDF uses 'letter' for US letter size (8.5 x 11 inches)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt", // points (72 per inch)
    format: "letter",
  });

  // Page dimensions in points (letter: 612 x 792)
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40; // 40pt margin (~0.55 inches)
  const contentWidth = pageWidth - margin * 2;

  // Starting Y position
  let y = margin;

  // Helper to check if we need a new page
  function checkNewPage(heightNeeded: number): void {
    if (y + heightNeeded > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // ========== HEADER ==========
  // Season Name (large, bold)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(scheduleInfo.seasonName, pageWidth / 2, y, { align: "center" });
  y += 28;

  // Week Number and Date
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Week ${scheduleInfo.weekNumber} - ${scheduleInfo.weekDate}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 30;

  // Horizontal line under header
  doc.setDrawColor(200);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // ========== ROUNDS ==========
  const roundsPerRow = 1; // One round per row for easier reading
  const columnWidth = contentWidth / roundsPerRow;
  const courtLineHeight = 16;
  const byeLineHeight = 14;
  const roundHeaderHeight = 24;
  const roundPadding = 12;

  // Process rounds in pairs (two columns per row)
  for (let i = 0; i < rounds.length; i += roundsPerRow) {
    const rowRounds = rounds.slice(i, i + roundsPerRow);

    // Calculate height needed for this row
    const maxGamesInRow = Math.max(...rowRounds.map((r) => r.games.length));
    const maxByesInRow = Math.max(...rowRounds.map((r) => r.byePlayerIds.length > 0 ? 1 : 0));
    const rowHeight =
      roundHeaderHeight +
      maxGamesInRow * courtLineHeight +
      maxByesInRow * byeLineHeight +
      roundPadding * 2;

    checkNewPage(rowHeight);

    // Draw each round in this row
    rowRounds.forEach((round, colIndex) => {
      const colX = margin + colIndex * columnWidth;

      // Round header
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Round ${round.roundNumber}`, colX + 5, y + 5);

      // Draw border around round section
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.rect(colX, y - 8, columnWidth - 10, rowHeight);

      let roundY = y + roundHeaderHeight;

      // Court assignments
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      for (const game of round.games) {
        const team1 = `${getPlayerName(game.team1_player1_id, playerMap)} & ${getPlayerName(game.team1_player2_id, playerMap)}`;
        const team2 = `${getPlayerName(game.team2_player1_id, playerMap)} & ${getPlayerName(game.team2_player2_id, playerMap)}`;

        // Court label
        doc.setFont("helvetica", "bold");
        doc.text(`Ct ${game.court_number}:`, colX + 8, roundY);

        // Team matchup
        doc.setFont("helvetica", "normal");
        const matchupX = colX + 35;
        const maxMatchupWidth = columnWidth - 50;

        // Truncate if necessary
        const matchupText = `${team1}  vs  ${team2}`;
        const truncatedMatchup = truncateText(doc, matchupText, maxMatchupWidth);
        doc.text(truncatedMatchup, matchupX, roundY);

        roundY += courtLineHeight;
      }

      // Bye players
      if (round.byePlayerIds.length > 0) {
        roundY += 4; // Small gap before byes
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);

        const byeNames = round.byePlayerIds
          .map((id) => getPlayerName(id, playerMap))
          .join(", ");
        const byeText = `Bye: ${byeNames}`;
        const truncatedBye = truncateText(doc, byeText, columnWidth - 20);
        doc.text(truncatedBye, colX + 8, roundY);

        doc.setTextColor(0); // Reset to black
      }
    });

    y += rowHeight + 10; // Move to next row
  }

  // ========== FOOTER ==========
  // Add footer with timestamp on each page
  const totalPages = doc.getNumberOfPages();
  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128);
    doc.text(`Generated: ${timestamp}`, margin, pageHeight - 20);
    doc.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 20,
      { align: "right" }
    );
    doc.setTextColor(0); // Reset to black
  }

  // ========== DOWNLOAD ==========
  // Generate filename: SeasonName_Week1_Schedule.pdf
  const safeSeasonName = scheduleInfo.seasonName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_");
  const filename = `${safeSeasonName}_Week${scheduleInfo.weekNumber}_Schedule.pdf`;

  doc.save(filename);
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
