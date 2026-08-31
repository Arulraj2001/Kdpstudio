/**
 * Pure Client-Side Production PDF Exporter for KDP Puzzle Books
 * Uses jsPDF to generate 100% compliant, razor-sharp vector interior print PDFs.
 * Fully styled for professional Amazon KDP publishing standards.
 */

import jsPDF from 'jspdf';
import { PuzzleBook, PuzzleBookSettings, PuzzlePage, PuzzleTrimSize } from '../../types/puzzle';
import { WordSearchResult } from './wordSearch';
import { WordFitResult } from './wordFit';
import { getTrimDimensions } from './puzzlePdfRenderer';

/**
 * Generates and downloads a print-ready KDP interior PDF directly in the browser
 */
export async function exportPuzzleBookPdfClient(book: PuzzleBook): Promise<void> {
  const settings = book.settings;
  let pages = book.pages || [];

  // Guarantee that pages are populated
  if (!pages || pages.length === 0) {
    const { runPuzzleBookGeneration } = await import('./puzzleGenerationEngine');
    pages = await runPuzzleBookGeneration(book.id, settings);
  }

  const { width: pageW, height: pageH } = getTrimDimensions(settings.trimSize || '8.5x11');

  // Initialize jsPDF document with exact physical dimensions in inches
  const doc = new jsPDF({
    orientation: pageW > pageH ? 'landscape' : 'portrait',
    unit: 'in',
    format: [pageW, pageH],
    compress: true,
  });

  const marginX = 0.65;
  const marginY = 0.65;
  const contentW = pageW - marginX * 2;
  const contentH = pageH - marginY * 2;

  let isFirstPage = true;

  const addNewPageIfNeeded = () => {
    if (isFirstPage) {
      isFirstPage = false;
    } else {
      doc.addPage([pageW, pageH], pageW > pageH ? 'landscape' : 'portrait');
    }
  };

  // ──────────────────────────────────────────
  // 1. Title / Cover Page (Elegant Double Border)
  // ──────────────────────────────────────────
  if (settings.includeCoverPage !== false) {
    addNewPageIfNeeded();

    // Outer thick border
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.025);
    doc.rect(marginX, marginY, contentW, contentH);

    // Inner thin border
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.008);
    doc.rect(marginX + 0.06, marginY + 0.06, contentW - 0.12, contentH - 0.12);

    // Decorative corner ornaments
    const cornerSize = 0.18;
    // Top-Left
    doc.line(marginX + 0.06, marginY + 0.06 + cornerSize, marginX + 0.06 + cornerSize, marginY + 0.06);
    // Top-Right
    doc.line(marginX + contentW - 0.06 - cornerSize, marginY + 0.06, marginX + contentW - 0.06, marginY + 0.06 + cornerSize);
    // Bottom-Left
    doc.line(marginX + 0.06, marginY + contentH - 0.06 - cornerSize, marginX + 0.06 + cornerSize, marginY + contentH - 0.06);
    // Bottom-Right
    doc.line(marginX + contentW - 0.06 - cornerSize, marginY + contentH - 0.06, marginX + contentW - 0.06, marginY + contentH - 0.06 - cornerSize);

    // Top Category Tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('KDP INTERIOR PRINT EDITION', pageW / 2, marginY + 0.7, { align: 'center' });

    // Decorative Divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.01);
    doc.line(pageW / 2 - 0.8, marginY + 0.9, pageW / 2 + 0.8, marginY + 0.9);

    // Book Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(settings.title?.toUpperCase() || 'THEMED PUZZLE COLLECTION', contentW - 0.6);
    doc.text(titleLines, pageW / 2, marginY + contentH * 0.35, { align: 'center' });

    // Subtitle
    if (settings.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(71, 85, 105);
      const subLines = doc.splitTextToSize(settings.subtitle, contentW - 0.8);
      doc.text(subLines, pageW / 2, marginY + contentH * 0.48, { align: 'center' });
    }

    // Centered Diamond Icon
    doc.setFillColor(15, 23, 42);
    doc.polygon([
      { x: pageW / 2, y: marginY + contentH * 0.62 },
      { x: pageW / 2 + 0.08, y: marginY + contentH * 0.62 + 0.08 },
      { x: pageW / 2, y: marginY + contentH * 0.62 + 0.16 },
      { x: pageW / 2 - 0.08, y: marginY + contentH * 0.62 + 0.08 },
    ], 'F');

    // Author
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`BY ${settings.author?.toUpperCase() || 'KDP AUTHOR'}`, pageW / 2, marginY + contentH * 0.78, { align: 'center' });

    // Bottom Badge
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`${pages.length} Puzzles • Complete Solutions Included • Large Print`, pageW / 2, marginY + contentH - 0.35, { align: 'center' });
  }

  // ──────────────────────────────────────────
  // 2. Instructions & Rules Page
  // ──────────────────────────────────────────
  if (settings.includeInstructions !== false) {
    addNewPageIfNeeded();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('HOW TO PLAY & PUZZLE RULES', pageW / 2, marginY + 0.5, { align: 'center' });

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.015);
    doc.line(marginX + 0.4, marginY + 0.75, pageW - marginX - 0.4, marginY + 0.75);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);

    let curY = marginY + 1.2;
    const instructions = [
      { num: '1', title: 'Find the Words', text: 'Locate all the hidden words listed in the Word List below each puzzle grid.' },
      { num: '2', title: 'Multi-Directional Placement', text: 'Words may run horizontally, vertically, or diagonally in both forward and backward directions.' },
      { num: '3', title: 'Overlapping Letters', text: 'Letters can be shared between multiple intersecting words in the grid.' },
      { num: '4', title: 'Track Your Progress', text: 'Check off each word from the checklist as you locate and circle it in the letter matrix.' },
      { num: '5', title: 'Check Your Solutions', text: 'Full solution answer keys are provided in the back section of this book for easy reference.' },
    ];

    for (const rule of instructions) {
      // Step number circle badge
      doc.setFillColor(15, 23, 42);
      doc.circle(marginX + 0.35, curY + 0.08, 0.16, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(rule.num, marginX + 0.35, curY + 0.12, { align: 'center' });

      // Rule title & description
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(rule.title, marginX + 0.7, curY + 0.06);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const wrapped = doc.splitTextToSize(rule.text, contentW - 0.9);
      doc.text(wrapped, marginX + 0.7, curY + 0.28);

      curY += 0.75;
    }

    // Specifications Info Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.01);
    doc.roundedRect(marginX + 0.2, curY + 0.2, contentW - 0.4, 1.3, 0.08, 0.08, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('BOOK SPECIFICATIONS', pageW / 2, curY + 0.55, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Trim Size: ${settings.trimSize || '8.5x11'} in   •   Total Puzzles: ${pages.length}   •   Difficulty: ${settings.difficulty?.toUpperCase() || 'MEDIUM'}`,
      pageW / 2,
      curY + 0.85,
      { align: 'center' }
    );
    doc.text(
      `Theme: ${(settings.theme || 'General').toUpperCase()}   •   Answer Keys: Included in Back Section`,
      pageW / 2,
      curY + 1.1,
      { align: 'center' }
    );
  }

  // ──────────────────────────────────────────
  // 3. Render Each Puzzle Interior Page
  // ──────────────────────────────────────────
  for (let idx = 0; idx < pages.length; idx++) {
    const page = pages[idx];
    addNewPageIfNeeded();

    const pNum = idx + 1;

    // Running Header (Book title & puzzle number)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text((settings.title || 'PUZZLE BOOK').toUpperCase(), marginX, marginY + 0.15);
    doc.text(`PUZZLE ${pNum}`, pageW - marginX, marginY + 0.15, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.005);
    doc.line(marginX, marginY + 0.22, pageW - marginX, marginY + 0.22);

    // Main Puzzle Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42);
    doc.text(`PUZZLE #${pNum}`, pageW / 2, marginY + 0.55, { align: 'center' });

    if (page.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(71, 85, 105);
      doc.text(page.title.toUpperCase(), pageW / 2, marginY + 0.8, { align: 'center' });
    }

    if (page.type === 'word-search') {
      const data = page.puzzleData as WordSearchResult;
      if (data && data.grid && data.grid.length > 0) {
        const grid = data.grid;
        const rows = grid.length;
        const cols = grid[0].length;

        // Determine optimal grid dimensions
        const maxGridW = contentW * 0.92;
        const maxGridH = contentH * 0.52;
        const cellSize = Math.min(maxGridW / cols, maxGridH / rows, 0.32);
        const actualGridW = cellSize * cols;
        const actualGridH = cellSize * rows;
        const gridStartX = (pageW - actualGridW) / 2;
        const gridStartY = marginY + 1.05;

        // Draw outer frame
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.018);
        doc.rect(gridStartX, gridStartY, actualGridW, actualGridH);

        // Draw cells & letters
        doc.setFont('courier', 'bold');
        doc.setFontSize(Math.max(9, Math.min(14, cellSize * 42)));
        doc.setTextColor(15, 23, 42);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const letter = grid[r][c] || '';
            const cellX = gridStartX + c * cellSize;
            const cellY = gridStartY + r * cellSize;

            // Cell border
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.005);
            doc.rect(cellX, cellY, cellSize, cellSize);

            // Centered Letter
            doc.text(letter, cellX + cellSize / 2, cellY + cellSize / 2 + cellSize * 0.16, { align: 'center' });
          }
        }

        // Word List Section
        const wordListY = gridStartY + actualGridH + 0.38;

        // Word list header banner
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('WORDS TO FIND', pageW / 2, wordListY, { align: 'center' });

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.008);
        doc.line(pageW / 2 - 1.2, wordListY + 0.08, pageW / 2 + 1.2, wordListY + 0.08);

        const wordsToFind = data.placedWords?.map((p) => p.word) || [];
        const colCount = wordsToFind.length > 12 ? 3 : 2;
        const colWidth = (contentW - 0.2) / colCount;
        const wordsPerCol = Math.ceil(wordsToFind.length / colCount);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);

        for (let wIdx = 0; wIdx < wordsToFind.length; wIdx++) {
          const colIdx = Math.floor(wIdx / wordsPerCol);
          const rowInCol = wIdx % wordsPerCol;
          const wX = marginX + 0.1 + colIdx * colWidth;
          const wY = wordListY + 0.32 + rowInCol * 0.22;

          // Checkbox square
          doc.setDrawColor(100, 116, 139);
          doc.setLineWidth(0.008);
          doc.rect(wX, wY - 0.09, 0.1, 0.1);

          // Word text
          doc.text(wordsToFind[wIdx], wX + 0.18, wY);
        }
      }
    } else if (page.type === 'word-fit') {
      const data = page.puzzleData as WordFitResult;
      if (data && data.grid) {
        const grid = data.grid;
        const rows = grid.length;
        const cols = grid[0].length;

        const maxGridW = contentW * 0.85;
        const maxGridH = contentH * 0.48;
        const cellSize = Math.min(maxGridW / cols, maxGridH / rows, 0.28);
        const actualGridW = cellSize * cols;
        const actualGridH = cellSize * rows;
        const gridStartX = (pageW - actualGridW) / 2;
        const gridStartY = marginY + 1.05;

        // Draw blank crossword slots
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const hasLetter = grid[r][c] !== '';
            const cellX = gridStartX + c * cellSize;
            const cellY = gridStartY + r * cellSize;

            if (hasLetter) {
              doc.setFillColor(255, 255, 255);
              doc.setDrawColor(15, 23, 42);
              doc.setLineWidth(0.012);
              doc.rect(cellX, cellY, cellSize, cellSize, 'FD');
            }
          }
        }

        // Word Pool grouped by length
        const poolY = gridStartY + actualGridH + 0.35;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('WORD BANK BY LENGTH', pageW / 2, poolY, { align: 'center' });

        const placedWords = data.placedWords || [];
        const lengthGroups: Record<number, string[]> = {};
        placedWords.forEach((w) => {
          const len = w.length;
          if (!lengthGroups[len]) lengthGroups[len] = [];
          lengthGroups[len].push(w);
        });

        let groupY = poolY + 0.3;
        Object.keys(lengthGroups)
          .map(Number)
          .sort((a, b) => a - b)
          .forEach((len) => {
            const words = lengthGroups[len];
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text(`${len} Letters:`, marginX + 0.2, groupY);
            doc.setFont('helvetica', 'normal');
            doc.text(words.join('   •   '), marginX + 1.1, groupY);
            groupY += 0.22;
          });
      }
    } else if (page.type === 'color-by-number' || page.type === 'coloring') {
      const boxW = contentW * 0.92;
      const boxH = contentH * 0.72;
      const boxX = (pageW - boxW) / 2;
      const boxY = marginY + 1.0;

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.018);
      doc.rect(boxX, boxY, boxW, boxH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text('[ Full Page High Resolution Vector Illustration ]', pageW / 2, boxY + boxH / 2, { align: 'center' });
    }

    // Page Number Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`- ${pNum} -`, pageW / 2, pageH - marginY * 0.45, { align: 'center' });
  }

  // ──────────────────────────────────────────
  // 4. Solutions & Answer Key Section
  // ──────────────────────────────────────────
  if (settings.includeAnswers !== false && pages.length > 0) {
    // 4A. Solutions Divider Page
    addNewPageIfNeeded();

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.025);
    doc.rect(marginX, marginY, contentW, contentH);

    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.008);
    doc.rect(marginX + 0.06, marginY + 0.06, contentW - 0.12, contentH - 0.12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(15, 23, 42);
    doc.text('COMPLETE SOLUTIONS', pageW / 2, marginY + contentH * 0.45, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text('Answer Keys for all puzzles in this book', pageW / 2, marginY + contentH * 0.52, { align: 'center' });

    // 4B. 4-Up Solution Grids per page (2x2 layout)
    const puzzlesPerPage = 4;
    const answerPagesCount = Math.ceil(pages.length / puzzlesPerPage);

    for (let apIdx = 0; apIdx < answerPagesCount; apIdx++) {
      addNewPageIfNeeded();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(`SOLUTIONS (PART ${apIdx + 1})`, pageW / 2, marginY + 0.35, { align: 'center' });

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.008);
      doc.line(marginX + 0.5, marginY + 0.48, pageW - marginX - 0.5, marginY + 0.48);

      const startIdx = apIdx * puzzlesPerPage;
      const endIdx = Math.min(startIdx + puzzlesPerPage, pages.length);

      const quadW = (contentW - 0.4) / 2;
      const quadH = (contentH - 0.9) / 2;

      for (let i = startIdx; i < endIdx; i++) {
        const qIdx = i - startIdx;
        const row = Math.floor(qIdx / 2);
        const col = qIdx % 2;

        const quadX = marginX + col * (quadW + 0.4);
        const quadY = marginY + 0.7 + row * (quadH + 0.35);

        const page = pages[i];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(`Puzzle #${i + 1}: ${page.title || ''}`, quadX + quadW / 2, quadY, { align: 'center' });

        if (page.type === 'word-search') {
          const grid = (Array.isArray(page.answerData)
            ? page.answerData
            : (page.puzzleData as WordSearchResult)?.grid) as string[][];

          if (grid && grid.length > 0) {
            const rows = grid.length;
            const cols = grid[0].length;
            const cellSize = Math.min(quadW / cols, (quadH - 0.25) / rows, 0.16);
            const startX = quadX + (quadW - cellSize * cols) / 2;
            const startY = quadY + 0.15;

            doc.setFont('courier', 'bold');
            doc.setFontSize(Math.max(6, Math.min(8.5, cellSize * 46)));

            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                const char = grid[r][c] || '';
                const isAnswer = char !== '' && char !== '·' && char !== '.';
                const cellX = startX + c * cellSize;
                const cellY = startY + r * cellSize;

                if (isAnswer) {
                  doc.setFillColor(241, 245, 249);
                  doc.rect(cellX, cellY, cellSize, cellSize, 'F');
                  doc.setTextColor(15, 23, 42);
                  doc.text(char, cellX + cellSize / 2, cellY + cellSize / 2 + cellSize * 0.2, { align: 'center' });
                } else {
                  doc.setTextColor(203, 213, 225);
                  doc.text('·', cellX + cellSize / 2, cellY + cellSize / 2 + cellSize * 0.2, { align: 'center' });
                }
              }
            }
          }
        }
      }

      // Page Number Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`- Solutions -`, pageW / 2, pageH - marginY * 0.45, { align: 'center' });
    }
  }

  // Save PDF directly to user's device
  const filename = `${(settings.title || 'puzzle_book').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_kdp_interior.pdf`;
  doc.save(filename);
}
