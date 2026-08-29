/**
 * KDP Studio — Puzzle Book PDF Renderer
 * Generates print-ready HTML documents for Puppeteer PDF conversion.
 * Phase 11 — KDP Studio (Word Search, Word Fit, Coloring, Color By Number)
 */

import { PuzzleBook, PuzzleBookSettings, PuzzlePage, PuzzleTrimSize } from '../../types/puzzle';
import { WordSearchResult } from './wordSearch';
import { WordFitResult, groupWordsByLength } from './wordFit';

/**
 * Returns physical page dimensions in inches
 */
export function getTrimDimensions(trimSize: PuzzleTrimSize): { width: number; height: number } {
  switch (trimSize) {
    case '8.5x11':
      return { width: 8.5, height: 11.0 };
    case '8.5x8.5':
    case '8x8':
      return { width: 8.5, height: 8.5 };
    case '8x5':
      return { width: 8.0, height: 5.0 };
    case '6x9':
    default:
      return { width: 6.0, height: 9.0 };
  }
}

/**
 * Generates the complete HTML book document string
 */
export function generatePuzzleBookHtml(
  book: PuzzleBook,
  settings: PuzzleBookSettings,
  pages: PuzzlePage[]
): string {
  const { width, height } = getTrimDimensions(settings.trimSize || '8.5x11');
  const isWhitePaper = settings.paperType !== 'cream';
  const bgColor = isWhitePaper ? '#ffffff' : '#fefaf3';

  let bodyHtml = '';

  // 1. Cover Page
  if (settings.includeCoverPage) {
    bodyHtml += generateCoverPageHtml(settings);
  }

  // 2. Instructions Page
  if (settings.includeInstructions) {
    bodyHtml += generateInstructionsHtml(settings);
  }

  // 3. Puzzle Pages
  for (const page of pages) {
    if (page.type === 'word-search') {
      bodyHtml += generateWordSearchPageHtml(page, settings);
    } else if (page.type === 'word-fit') {
      bodyHtml += generateWordFitPageHtml(page, settings);
    } else if (page.type === 'coloring') {
      bodyHtml += generateColoringPageHtml(page, settings);
      // Single-sided coloring pages with blank back page to prevent marker show-through
      bodyHtml += `
      <div class="page" style="display: flex; justify-content: center; align-items: center;">
        <div style="color: #94a3b8; font-size: 8pt; text-align: center;">This page intentionally left blank</div>
      </div>`;
    } else if (page.type === 'color-by-number') {
      bodyHtml += generateColorByNumberPageHtml(page, settings);
      bodyHtml += `
      <div class="page" style="display: flex; justify-content: center; align-items: center;">
        <div style="color: #94a3b8; font-size: 8pt; text-align: center;">This page intentionally left blank</div>
      </div>`;
    }
  }

  // 4. Answer Section (for word puzzles & color by number)
  if (settings.includeAnswers) {
    if (settings.type === 'word-search' || settings.type === 'word-fit') {
      bodyHtml += generateAnswerSectionHtml(pages, settings);
    } else if (settings.type === 'color-by-number') {
      bodyHtml += generateColorByNumberAnswerSectionHtml(pages, settings);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(settings.title || 'Puzzle Book')}</title>
  <style>
    @page {
      size: ${width}in ${height}in;
      margin: 0.5in 0.5in 0.6in 0.5in;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: ${bgColor};
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      page-break-after: always;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .page:last-child {
      page-break-after: auto;
    }

    /* Typography */
    .puzzle-title {
      font-size: 20px;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 0 0 16px 0;
      color: #0f172a;
    }
    .puzzle-subtitle {
      font-size: 12px;
      color: #475569;
      text-align: center;
      margin-top: -10px;
      margin-bottom: 16px;
    }

    /* Word Search Grid */
    .word-search-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: auto 0;
    }
    .ws-table {
      border-collapse: collapse;
      margin: 0 auto;
    }
    .ws-cell {
      width: 26px;
      height: 26px;
      text-align: center;
      vertical-align: middle;
      font-family: "Courier New", Courier, monospace;
      font-size: 15px;
      font-weight: bold;
      color: #0f172a;
      user-select: none;
    }

    /* Word Fit Crossword Grid */
    .wf-table {
      border-collapse: collapse;
      margin: 0 auto;
    }
    .wf-cell {
      width: 22px;
      height: 22px;
      text-align: center;
      vertical-align: middle;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: bold;
      border: 1px solid #0f172a;
      background-color: #ffffff;
      padding: 0;
    }
    .wf-cell-blocked {
      background-color: #0f172a !important;
      border: 1px solid #0f172a;
    }
    .wf-groups-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 16px;
      margin-top: 14px;
      border-top: 1.5px solid #0f172a;
      padding-top: 10px;
    }
    .wf-group-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .wf-group-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
      margin-bottom: 2px;
    }
    .wf-group-word {
      font-size: 10px;
      font-family: "Courier New", Courier, monospace;
      font-weight: 600;
      color: #334155;
      letter-spacing: 0.5px;
    }

    /* Word List Box */
    .word-list-box {
      margin-top: 16px;
      padding: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background-color: #f8fafc;
    }
    .word-list-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      color: #334155;
    }
    .word-list-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      text-align: left;
    }
    .word-item {
      font-size: 11px;
      font-weight: 600;
      color: #1e293b;
    }

    /* Coloring / Art Frames */
    .coloring-frame {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 75%;
      margin: 0 auto;
    }
    .coloring-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    /* Page Footer */
    .page-footer-num {
      text-align: center;
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      margin-top: 12px;
    }

    /* Answer Key Grid */
    .answer-key-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
    }
    .mini-answer-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      background: #f8fafc;
    }
    .mini-ws-cell {
      width: 11px;
      height: 11px;
      font-size: 7.5px;
      font-weight: 800;
      text-align: center;
      padding: 0;
    }
    .mini-ws-cell.dot {
      color: #cbd5e1;
      font-weight: 400;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

/**
 * 1. Book Cover / Title Page
 */
export function generateCoverPageHtml(settings: PuzzleBookSettings): string {
  return `
  <div class="page" style="justify-content: center; align-items: center; text-align: center; padding: 40px;">
    <div style="border: 4px double #0f172a; padding: 40px 24px; width: 100%; max-width: 500px; border-radius: 12px;">
      <h1 style="font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 2px;">
        ${escapeHtml(settings.title || 'PUZZLE BOOK')}
      </h1>
      ${
        settings.subtitle
          ? `<p style="font-size: 14px; font-weight: 600; color: #475569; margin: 0 0 24px 0;">${escapeHtml(
              settings.subtitle
            )}</p>`
          : ''
      }
      <div style="width: 60px; height: 2px; background: #0f172a; margin: 24px auto;"></div>
      <p style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">
        By ${escapeHtml(settings.author || 'Kindle Author')}
      </p>
    </div>
  </div>`;
}

/**
 * 2. Instructions Page
 */
export function generateInstructionsHtml(settings: PuzzleBookSettings): string {
  let instructions = '';

  if (settings.type === 'word-search') {
    instructions = `
      <p style="margin-bottom: 12px;">Find all the hidden words listed at the bottom of each puzzle.</p>
      <ul style="text-align: left; padding-left: 20px; line-height: 1.6; margin-bottom: 20px;">
        <li>Words may be placed horizontally, vertically, or diagonally.</li>
        <li>Words can be read in forward or reverse directions.</li>
        <li>Letters may overlap and be part of multiple words.</li>
        <li>Check off each word as you find it in the grid!</li>
      </ul>`;
  } else if (settings.type === 'word-fit') {
    instructions = `
      <p style="margin-bottom: 12px;">Fit all given words into the crossword grid according to their letter count.</p>
      <ul style="text-align: left; padding-left: 20px; line-height: 1.6; margin-bottom: 20px;">
        <li>Words are categorized by letter length below each puzzle.</li>
        <li>Start with word lengths that have the fewest options to establish an anchor.</li>
        <li>Intersecting letters will help you eliminate choices for crossing words.</li>
      </ul>`;
  } else if (settings.type === 'coloring') {
    instructions = `
      <p style="margin-bottom: 12px;">Relax and express your creativity with these high-contrast coloring plates.</p>
      <ul style="text-align: left; padding-left: 20px; line-height: 1.6; margin-bottom: 20px;">
        <li>Use colored pencils, gel pens, or markers of your choice.</li>
        <li>Each coloring page is single-sided to prevent show-through.</li>
        <li>Take your time, unwind, and enjoy mindfulness art.</li>
      </ul>`;
  } else if (settings.type === 'color-by-number') {
    instructions = `
      <p style="margin-bottom: 12px;">Bring each scene to life by matching numbered regions with colors.</p>
      <ul style="text-align: left; padding-left: 20px; line-height: 1.6; margin-bottom: 20px;">
        <li>Find the color palette key below each mosaic artwork plate.</li>
        <li>Fill each numbered shape with its corresponding palette color.</li>
        <li>Check the full-color answer key at the back to see the finished scenes!</li>
      </ul>`;
  }

  return `
  <div class="page" style="padding: 24px;">
    <div>
      <h2 class="puzzle-title" style="border-bottom: 2px solid #0f172a; padding-bottom: 6px;">How To Play</h2>
      <div style="font-size: 13px; color: #334155; max-width: 480px; margin: 24px auto 0; text-align: center;">
        ${instructions}
      </div>
    </div>
    <div class="page-footer-num">Instructions</div>
  </div>`;
}

/**
 * 3. Word Search Page
 */
export function generateWordSearchPageHtml(page: PuzzlePage, settings: PuzzleBookSettings): string {
  const data = page.puzzleData as WordSearchResult;
  if (!data) return '';

  const gridRowsHtml = data.grid
    .map(
      (row) => `
    <tr>
      ${row.map((cell) => `<td class="ws-cell">${escapeHtml(cell)}</td>`).join('')}
    </tr>`
    )
    .join('');

  const wordsList = data.placedWords || [];
  const wordItemsHtml = wordsList
    .map((w) => `<div class="word-item">&bull; ${escapeHtml(typeof w === 'string' ? w : w.word)}</div>`)
    .join('');

  return `
  <div class="page">
    <div>
      <div class="puzzle-title">Word Search #${page.pageNumber}</div>
      <div class="puzzle-subtitle">${escapeHtml(page.title || settings.theme || 'Theme Puzzle')}</div>
      <div class="word-search-container">
        <table class="ws-table">
          <tbody>
            ${gridRowsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <div class="word-list-box">
        <div class="word-list-title">Find These ${wordsList.length} Words:</div>
        <div class="word-list-grid">
          ${wordItemsHtml}
        </div>
      </div>
      <div class="page-footer-num">Page ${page.pageNumber + (settings.includeCoverPage ? 1 : 0) + (settings.includeInstructions ? 1 : 0)}</div>
    </div>
  </div>`;
}

/**
 * 4. Word Fit Page
 */
export function generateWordFitPageHtml(page: PuzzlePage, settings: PuzzleBookSettings): string {
  const data = page.puzzleData as WordFitResult;
  if (!data) return '';

  const gridRowsHtml = data.grid
    .map(
      (row) => `
    <tr>
      ${row
        .map((cell) => {
          if (cell.isBlocked) {
            return `<td class="wf-cell wf-cell-blocked"></td>`;
          }
          return `<td class="wf-cell">&nbsp;</td>`;
        })
        .join('')}
    </tr>`
    )
    .join('');

  const grouped = groupWordsByLength(data.placedWords);
  const lengths = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  const groupsHtml = lengths
    .map((len) => {
      const words = grouped[len];
      const wordList = words
        .map((w) => `<div class="wf-group-word">${escapeHtml(w)}</div>`)
        .join('');

      return `
      <div class="wf-group-col">
        <div class="wf-group-title">${len} Letters (${words.length})</div>
        ${wordList}
      </div>`;
    })
    .join('');

  return `
  <div class="page">
    <div>
      <div class="puzzle-title">Word Fit #${page.pageNumber}</div>
      <div class="puzzle-subtitle">${escapeHtml(page.title || settings.theme || 'Fill-In Crossword')}</div>
      <table class="wf-table">
        <tbody>
          ${gridRowsHtml}
        </tbody>
      </table>
    </div>

    <div>
      <div class="wf-groups-container">
        ${groupsHtml}
      </div>
      <div class="page-footer-num">Page ${page.pageNumber + (settings.includeCoverPage ? 1 : 0) + (settings.includeInstructions ? 1 : 0)}</div>
    </div>
  </div>`;
}

/**
 * 5. Coloring Page
 */
export function generateColoringPageHtml(page: PuzzlePage, settings: PuzzleBookSettings): string {
  return `
  <div class="page">
    <div>
      <div class="puzzle-title" style="font-size: 16px; margin-bottom: 12px;">${escapeHtml(page.title || `Illustration #${page.pageNumber}`)}</div>
      <div class="coloring-frame">
        ${
          page.imageUrl
            ? `<img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(page.title)}" class="coloring-img" />`
            : `<div style="color: #94a3b8; font-size: 13px; font-weight: 600; text-align: center;">[AI Illustration Processing: ${escapeHtml(page.title)}]</div>`
        }
      </div>
    </div>
    <div class="page-footer-num">Page ${page.pageNumber + (settings.includeCoverPage ? 1 : 0) + (settings.includeInstructions ? 1 : 0)}</div>
  </div>`;
}

/**
 * 6. Color by Number Page
 */
export function generateColorByNumberPageHtml(page: PuzzlePage, settings: PuzzleBookSettings): string {
  const palette = page.puzzleData?.palette || page.puzzleData?.scene?.colorKey || [
    { number: 1, name: 'Sky Blue', color: '#38bdf8' },
    { number: 2, name: 'Sunny Yellow', color: '#facc15' },
    { number: 3, name: 'Meadow Green', color: '#22c55e' },
    { number: 4, name: 'Warm Orange', color: '#ea580c' },
    { number: 5, name: 'Violet Purple', color: '#a855f7' },
  ];

  const paletteHtml = palette
    .map(
      (p: any) => `
    <div style="display: flex; align-items: center; gap: 6px; font-size: 10pt; font-weight: 700;">
      <span style="display: inline-block; width: 16px; height: 16px; border-radius: 3px; border: 1px solid #0f172a; background-color: ${p.color};"></span>
      <span>${p.number ?? p.num}. ${escapeHtml(p.name)}</span>
    </div>`
    )
    .join('');

  return `
  <div class="page">
    <div>
      <div class="puzzle-title">${escapeHtml(page.title || `Color By Number #${page.pageNumber}`)}</div>
      
      <div class="coloring-frame" style="height: 68%; margin: 8px auto;">
        ${
          page.imageUrl
            ? `<img src="${escapeHtml(page.imageUrl)}" alt="${escapeHtml(page.title)}" class="coloring-img" />`
            : `<div style="color: #94a3b8; font-size: 13px; font-weight: 600;">[Color By Number Plate: ${escapeHtml(page.title)}]</div>`
        }
      </div>

      <div style="margin-top: 10px; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1.5px solid #0f172a;">
        <div style="font-size: 9pt; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">COLOR PALETTE KEY:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px 18px;">
          ${paletteHtml}
        </div>
      </div>
    </div>
    <div class="page-footer-num">Page ${page.pageNumber + (settings.includeCoverPage ? 1 : 0) + (settings.includeInstructions ? 1 : 0)}</div>
  </div>`;
}

/**
 * 7. Color by Number Answer Section
 */
export function generateColorByNumberAnswerSectionHtml(pages: PuzzlePage[], settings: PuzzleBookSettings): string {
  const cbnPages = pages.filter((p) => p.type === 'color-by-number');
  let answerCards = '';

  for (let i = 0; i < cbnPages.length; i += 4) {
    const batch = cbnPages.slice(i, i + 4);
    const cardsHtml = batch
      .map((p) => {
        const answerImg = p.answerData?.imageUrl || p.puzzleData?.answerImageUrl || p.imageUrl;
        return `
        <div class="mini-answer-card">
          <div style="font-size: 10pt; font-weight: 800; margin-bottom: 4px; text-transform: uppercase;">
            Plate #${p.pageNumber} Solution
          </div>
          <div style="height: 160px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${
              answerImg
                ? `<img src="${escapeHtml(answerImg)}" alt="Answer #${p.pageNumber}" style="max-height: 100%; max-width: 100%; object-fit: contain;" />`
                : ''
            }
          </div>
        </div>`;
      })
      .join('');

    answerCards += `
    <div class="page" style="page-break-before: always;">
      <div>
        <h2 class="puzzle-title" style="border-bottom: 2px solid #0f172a; padding-bottom: 6px;">ANSWERS — DO NOT PEEK!</h2>
        <div class="answer-key-grid">
          ${cardsHtml}
        </div>
      </div>
      <div class="page-footer-num">Solutions</div>
    </div>`;
  }

  return answerCards;
}

/**
 * 8. Word Puzzle Answer Section
 */
export function generateAnswerSectionHtml(pages: PuzzlePage[], settings: PuzzleBookSettings): string {
  const answerCards = pages
    .filter((p) => p.type === 'word-search' || p.type === 'word-fit')
    .map((page) => {
      if (page.type === 'word-search') {
        const data = page.puzzleData as WordSearchResult;
        const answerGrid = page.answerData || (data ? data.grid : []);

        const rowsHtml = (answerGrid || [])
          .map(
            (row: string[]) => `
          <tr>
            ${row
              .map((cell) => {
                const isDot = cell === '·';
                return `<td class="mini-ws-cell ${isDot ? 'dot' : ''}">${escapeHtml(cell)}</td>`;
              })
              .join('')}
          </tr>`
          )
          .join('');

        return `
        <div class="mini-answer-card">
          <div style="font-size: 11px; font-weight: 800; margin-bottom: 6px; text-transform: uppercase;">
            Puzzle #${page.pageNumber} Solution
          </div>
          <table style="border-collapse: collapse; margin: 0 auto;">
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>`;
      } else {
        const data = page.puzzleData as WordFitResult;
        const grid = data?.grid || [];

        const rowsHtml = grid
          .map(
            (row) => `
          <tr>
            ${row
              .map((cell) => {
                if (cell.isBlocked) {
                  return `<td style="width: 10px; height: 10px; background: #0f172a; padding: 0;"></td>`;
                }
                return `<td style="width: 10px; height: 10px; border: 0.5px solid #0f172a; text-align: center; font-size: 7px; font-weight: bold; padding: 0; background: #ffffff;">${cell.letter || ''}</td>`;
              })
              .join('')}
          </tr>`
          )
          .join('');

        return `
        <div class="mini-answer-card">
          <div style="font-size: 11px; font-weight: 800; margin-bottom: 6px; text-transform: uppercase;">
            Word Fit #${page.pageNumber} Solution
          </div>
          <table style="border-collapse: collapse; margin: 0 auto;">
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>`;
      }
    })
    .join('');

  return `
  <div class="page" style="page-break-before: always;">
    <div>
      <h2 class="puzzle-title" style="border-bottom: 2px solid #0f172a; padding-bottom: 6px;">ANSWER KEY</h2>
      <div class="answer-key-grid">
        ${answerCards}
      </div>
    </div>
    <div class="page-footer-num">Solutions</div>
  </div>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
