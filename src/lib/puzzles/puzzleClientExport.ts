/**
 * Pure Client-Side Production PDF Exporter for KDP Puzzle Books
 * Uses jsPDF to generate 100% compliant, razor-sharp vector interior print PDFs.
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

  const marginX = 0.6;
  const marginY = 0.6;
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

  // 1. Cover / Title Page
  if (settings.includeCoverPage !== false) {
    addNewPageIfNeeded();

    // Decorative frame
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.02);
    doc.rect(marginX, marginY, contentW, contentH);
    doc.setLineWidth(0.008);
    doc.rect(marginX + 0.05, marginY + 0.05, contentW - 0.1, contentH - 0.1);

    // Book Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(settings.title || 'THEMED PUZZLE BOOK', contentW - 0.4);
    doc.text(titleLines, pageW / 2, marginY + contentH * 0.35, { align: 'center' });

    // Subtitle
    if (settings.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(71, 85, 105);
      const subLines = doc.splitTextToSize(settings.subtitle, contentW - 0.4);
      doc.text(subLines, pageW / 2, marginY + contentH * 0.48, { align: 'center' });
    }

    // Author
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`BY ${settings.author?.toUpperCase() || 'KDP AUTHOR'}`, pageW / 2, marginY + contentH * 0.78, { align: 'center' });
  }

  // 2. Instructions Page
  if (settings.includeInstructions !== false) {
    addNewPageIfNeeded();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('HOW TO PLAY', pageW / 2, marginY + 0.4, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.015);
    doc.line(marginX + 0.5, marginY + 0.6, pageW - marginX - 0.5, marginY + 0.6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);

    let curY = marginY + 1.0;
    const instructions = [
      '• Find all the hidden words listed at the bottom of each puzzle.',
      '• Words can run horizontally, vertically, or diagonally in any direction.',
      '• Words may cross or overlap other words in the grid.',
      '• As you discover each word, circle or highlight it and check it off the word list.',
      '• Complete solutions and answer keys are located at the back of this book.',
      '• Take your time, relax, and have fun sharpening your mind!',
    ];

    for (const rule of instructions) {
      const wrapped = doc.splitTextToSize(rule, contentW - 0.4);
      doc.text(wrapped, marginX + 0.2, curY);
      curY += wrapped.length * 0.24 + 0.12;
    }

    // Difficulty Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX + 0.5, curY + 0.4, contentW - 1.0, 1.2, 0.1, 0.1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('PUZZLE SPECIFICATIONS', pageW / 2, curY + 0.75, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Difficulty: ${settings.difficulty?.toUpperCase() || 'STANDARD'}   •   Total Puzzles: ${pages.length}   •   Solutions Included`,
      pageW / 2,
      curY + 1.1,
      { align: 'center' }
    );
  }

  // 3. Render Each Puzzle Page
  for (let idx = 0; idx < pages.length; idx++) {
    const page = pages[idx];
    addNewPageIfNeeded();

    const pNum = idx + 1;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`PUZZLE #${pNum}`, pageW / 2, marginY + 0.35, { align: 'center' });

    if (page.title) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(page.title, pageW / 2, marginY + 0.6, { align: 'center' });
    }

    if (page.type === 'word-search') {
      const data = page.puzzleData as WordSearchResult;
      if (data && data.grid && data.grid.length > 0) {
        const grid = data.grid;
        const rows = grid.length;
        const cols = grid[0].length;

        // Determine optimal grid dimensions
        const maxGridW = contentW * 0.9;
        const maxGridH = contentH * 0.55;
        const cellSize = Math.min(maxGridW / cols, maxGridH / rows, 0.32);
        const actualGridW = cellSize * cols;
        const actualGridH = cellSize * rows;
        const gridStartX = (pageW - actualGridW) / 2;
        const gridStartY = marginY + 0.85;

        // Draw grid border
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.015);
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

            // Draw subtle cell lines
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.005);
            doc.rect(cellX, cellY, cellSize, cellSize);

            // Centered letter
            doc.text(letter, cellX + cellSize / 2, cellY + cellSize / 2 + cellSize * 0.16, { align: 'center' });
          }
        }

        // Draw Word List below grid
        const wordListY = gridStartY + actualGridH + 0.4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('WORD LIST', pageW / 2, wordListY, { align: 'center' });

        const wordsToFind = data.placedWords?.map((p) => p.word) || [];
        const colCount = wordsToFind.length > 12 ? 3 : 2;
        const colWidth = contentW / colCount;
        const wordsPerCol = Math.ceil(wordsToFind.length / colCount);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);

        for (let wIdx = 0; wIdx < wordsToFind.length; wIdx++) {
          const colIdx = Math.floor(wIdx / wordsPerCol);
          const rowInCol = wIdx % wordsPerCol;
          const wX = marginX + colIdx * colWidth + 0.2;
          const wY = wordListY + 0.28 + rowInCol * 0.22;

          // Checkbox + Word
          doc.setDrawColor(148, 163, 184);
          doc.setLineWidth(0.008);
          doc.rect(wX, wY - 0.09, 0.1, 0.1);
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
        const maxGridH = contentH * 0.5;
        const cellSize = Math.min(maxGridW / cols, maxGridH / rows, 0.28);
        const actualGridW = cellSize * cols;
        const actualGridH = cellSize * rows;
        const gridStartX = (pageW - actualGridW) / 2;
        const gridStartY = marginY + 0.85;

        // Draw blank crossword-style slots
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

        // Draw length-grouped words at bottom
        const listY = gridStartY + actualGridH + 0.35;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('FIT THE WORDS INTO THE GRID', pageW / 2, listY, { align: 'center' });

        const groups = (data as any).lengthGroups || {};
        let groupY = listY + 0.3;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        Object.keys(groups)
          .sort((a, b) => Number(a) - Number(b))
          .forEach((len) => {
            const words = groups[len] || [];
            doc.setFont('helvetica', 'bold');
            doc.text(`${len} Letters:`, marginX + 0.2, groupY);
            doc.setFont('helvetica', 'normal');
            doc.text(words.join('   •   '), marginX + 1.1, groupY);
            groupY += 0.22;
          });
      }
    } else if (page.type === 'color-by-number' || page.type === 'coloring') {
      // Vector image or SVG placeholder centered
      const boxW = contentW * 0.9;
      const boxH = contentH * 0.75;
      const boxX = (pageW - boxW) / 2;
      const boxY = marginY + 0.85;

      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.015);
      doc.rect(boxX, boxY, boxW, boxH);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text('[ High Resolution Line Illustration ]', pageW / 2, boxY + boxH / 2, { align: 'center' });
    }

    // Page Number Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`- ${pNum} -`, pageW / 2, pageH - marginY * 0.5, { align: 'center' });
  }

  // 4. Solutions & Answer Key Section
  if (settings.includeAnswers !== false && pages.length > 0) {
    addNewPageIfNeeded();

    // Section Divider
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('SOLUTIONS & ANSWERS', pageW / 2, marginY + 0.6, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.015);
    doc.line(marginX + 0.5, marginY + 0.85, pageW - marginX - 0.5, marginY + 0.85);

    // 4 solutions per page (2x2 layout)
    const puzzlesPerPage = 4;
    const answerPagesCount = Math.ceil(pages.length / puzzlesPerPage);

    for (let apIdx = 0; apIdx < answerPagesCount; apIdx++) {
      if (apIdx > 0) {
        addNewPageIfNeeded();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('SOLUTIONS (CONTINUED)', pageW / 2, marginY + 0.35, { align: 'center' });
      }

      const startIdx = apIdx * puzzlesPerPage;
      const endIdx = Math.min(startIdx + puzzlesPerPage, pages.length);

      const quadW = (contentW - 0.4) / 2;
      const quadH = (contentH - (apIdx === 0 ? 1.4 : 0.8)) / 2;

      for (let i = startIdx; i < endIdx; i++) {
        const qIdx = i - startIdx;
        const row = Math.floor(qIdx / 2);
        const col = qIdx % 2;

        const quadX = marginX + col * (quadW + 0.4);
        const quadY = marginY + (apIdx === 0 ? 1.1 : 0.6) + row * (quadH + 0.3);

        const page = pages[i];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`Puzzle #${i + 1}`, quadX + quadW / 2, quadY, { align: 'center' });

        if (page.type === 'word-search' && page.answerData) {
          const grid = page.answerData as string[][];
          if (grid && grid.length > 0) {
            const rows = grid.length;
            const cols = grid[0].length;
            const cellSize = Math.min(quadW / cols, (quadH - 0.2) / rows, 0.16);
            const startX = quadX + (quadW - cellSize * cols) / 2;
            const startY = quadY + 0.15;

            doc.setFont('courier', 'bold');
            doc.setFontSize(Math.max(6, Math.min(8, cellSize * 45)));

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
    }
  }

  // Save PDF directly to user's device
  const filename = `${(settings.title || 'puzzle_book').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_kdp_interior.pdf`;
  doc.save(filename);
}
