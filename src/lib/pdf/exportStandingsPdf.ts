import { jsPDF } from "jspdf";
import {
  formatRank,
  formatWinPercentage,
  type RankedPlayer,
} from "@/lib/leaderboard/ranking";

// Standings information for PDF header
interface StandingsInfo {
  seasonName: string;
}

// Input data for PDF generation
interface ExportStandingsData {
  standingsInfo: StandingsInfo;
  rankedPlayers: RankedPlayer[];
}

/**
 * Generate a PDF of the season standings for printing/sharing.
 * Formatted for letter (8.5x11") / A4 paper.
 */
export function exportStandingsPdf(data: ExportStandingsData): void {
  const { standingsInfo, rankedPlayers } = data;

  // Create PDF document (portrait, letter size)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  // Page dimensions in points (letter: 612 x 792)
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Starting Y position
  let y = margin;

  // ========== HEADER ==========
  // Season Name (large, bold)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(standingsInfo.seasonName, pageWidth / 2, y, { align: "center" });
  y += 28;

  // "Standings as of [date]"
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Standings as of ${today}`, pageWidth / 2, y, { align: "center" });
  y += 30;

  // Horizontal line under header
  doc.setDrawColor(200);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // ========== TABLE ==========
  if (rankedPlayers.length === 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128);
    doc.text("No games have been played yet.", pageWidth / 2, y, {
      align: "center",
    });
    y += 20;
  } else {
    // Table configuration
    const columns = [
      { header: "Rank", width: 50, align: "center" as const },
      { header: "Player", width: contentWidth - 250, align: "left" as const },
      { header: "Points", width: 50, align: "right" as const },
      { header: "Games", width: 50, align: "right" as const },
      { header: "Wins", width: 50, align: "right" as const },
      { header: "Win%", width: 50, align: "right" as const },
    ];

    const rowHeight = 20;
    const headerHeight = 24;

    // Draw table header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, contentWidth, headerHeight, "F");

    let colX = margin;
    for (const col of columns) {
      const textX =
        col.align === "center"
          ? colX + col.width / 2
          : col.align === "right"
            ? colX + col.width - 5
            : colX + 5;
      doc.text(col.header, textX, y + 16, { align: col.align });
      colX += col.width;
    }
    y += headerHeight;

    // Draw horizontal line under header
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    // Draw table rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);

    for (let i = 0; i < rankedPlayers.length; i++) {
      const player = rankedPlayers[i];

      // Check if we need a new page
      if (y + rowHeight > pageHeight - margin - 30) {
        doc.addPage();
        y = margin;

        // Redraw header on new page
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, contentWidth, headerHeight, "F");

        let newColX = margin;
        for (const col of columns) {
          const textX =
            col.align === "center"
              ? newColX + col.width / 2
              : col.align === "right"
                ? newColX + col.width - 5
                : newColX + 5;
          doc.text(col.header, textX, y + 16, { align: col.align });
          newColX += col.width;
        }
        y += headerHeight;

        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);

        doc.setFont("helvetica", "normal");
      }

      // Alternate row background for readability
      if (i % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentWidth, rowHeight, "F");
      }

      // Draw row data
      const rowData = [
        formatRank(player.rank, player.isTied),
        player.playerName,
        String(player.totalPoints),
        String(player.gamesPlayed),
        String(player.wins),
        formatWinPercentage(player.winPercentage),
      ];

      colX = margin;
      doc.setFontSize(10);

      // Bold for top 3
      if (player.rank <= 3) {
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }

      for (let j = 0; j < columns.length; j++) {
        const col = columns[j];
        const textX =
          col.align === "center"
            ? colX + col.width / 2
            : col.align === "right"
              ? colX + col.width - 5
              : colX + 5;

        // Truncate player name if too long
        let text = rowData[j];
        if (j === 1 && doc.getTextWidth(text) > col.width - 10) {
          while (
            doc.getTextWidth(text + "...") > col.width - 10 &&
            text.length > 0
          ) {
            text = text.slice(0, -1);
          }
          text += "...";
        }

        doc.text(text, textX, y + 14, { align: col.align });
        colX += col.width;
      }

      // Draw row separator
      y += rowHeight;
      doc.setDrawColor(230);
      doc.setLineWidth(0.25);
      doc.line(margin, y, pageWidth - margin, y);
    }
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
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 20, {
      align: "right",
    });
    doc.setTextColor(0);
  }

  // ========== DOWNLOAD ==========
  // Generate filename: SeasonName_Standings.pdf
  const safeSeasonName = standingsInfo.seasonName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_");
  const filename = `${safeSeasonName}_Standings.pdf`;

  doc.save(filename);
}
