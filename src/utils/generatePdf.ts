import jsPDF from 'jspdf';
import { ContentBlock, KdpFormatSettings, TocItem } from '../types/formatter';
import { cleanText } from './generateDocx';
import { calculateBookPagination } from './parseManuscript';

/**
 * Strips markdown heading markers from text
 */
function stripMd(text: string): string {
  return cleanText(text);
}

/**
 * Wraps text to fit within a given width in PDF units.
 * Returns an array of lines.
 */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

/**
 * Programmatically generates a KDP-formatted PDF document from parsed blocks.
 * Uses jsPDF (no html2canvas required).
 *
 * Page size: 7 × 10 inches at 72 pt/inch = 504 × 720 pt
 * Margins: inside 0.75", outside 0.625", top/bottom 0.75"
 */
export async function generatePdf(
  blocks: ContentBlock[],
  settings: KdpFormatSettings
): Promise<jsPDF> {
  const INCH = 72; // pt per inch for jsPDF
  const pageW = (settings.trimWidth || 7) * INCH;    // 504 pt
  const pageH = (settings.trimHeight || 10) * INCH;  // 720 pt

  const marginTop = (settings.margins?.top ?? 0.75) * INCH;
  const marginBottom = (settings.margins?.bottom ?? 0.75) * INCH;
  const marginInside = (settings.margins?.inside ?? 0.75) * INCH;
  const marginOutside = (settings.margins?.outside ?? 0.625) * INCH;

  const contentW = pageW - marginInside - marginOutside;
  const contentTop = marginTop + 14; // extra room for header
  const contentBottom = pageH - marginBottom - 14; // room for footer
  const usableH = contentBottom - contentTop;

  // Font mapping: jsPDF built-ins only (Times is closest to Georgia/Garamond/Palatino)
  const bodyFont = 'times';
  const headFont = 'times';
  const bodyFontSizePt = (settings.fontSize || 22) / 2; // half-points → pt
  const lineHeightFactor = parseFloat(settings.lineSpacing || '1.15');
  const bodyLineH = bodyFontSizePt * lineHeightFactor;

  // M2/M3: Resolve accent color from settings.accentTheme (same map as DOCX)
  const accentRgbMap: Record<string, [number, number, number]> = {
    teal:     [15, 118, 110],
    purple:   [124, 58, 237],
    navy:     [30, 58, 138],
    burgundy: [153, 27, 27],
    charcoal: [51, 65, 85],
    green:    [22, 101, 52],
  };
  const accentRgb = accentRgbMap[settings.accentTheme ?? 'teal'] ?? [15, 118, 110];

  const doc = new jsPDF({
    unit: 'pt',
    format: [pageW, pageH],
    orientation: 'portrait',
  });

  let pageNum = 1;
  let y = contentTop;

  // ── Helper: draw header/footer on current page ──
  // M5: Only draws when headerFooterFolios toggle is on
  const drawHeaderFooter = () => {
    if (!(settings.headerFooterFolios ?? true)) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    // Header: title centered
    const titleText = settings.title || 'KDP Studio';
    doc.text(titleText, pageW / 2, marginTop - 4, { align: 'center' });
    doc.setDrawColor(200, 200, 200);
    doc.line(marginInside, marginTop - 2, pageW - marginOutside, marginTop - 2);
    // Footer: page number
    doc.line(marginInside, pageH - marginBottom + 2, pageW - marginOutside, pageH - marginBottom + 2);
    doc.text(String(pageNum), pageW / 2, pageH - marginBottom + 12, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  // ── Helper: add new page ──
  const newPage = () => {
    drawHeaderFooter();
    doc.addPage([pageW, pageH]);
    pageNum++;
    y = contentTop;
  };

  // ── Helper: ensure there's enough vertical space, else add page ──
  const ensureSpace = (needed: number) => {
    if (y + needed > contentBottom) {
      newPage();
    }
  };

  // ── Helper: render body text with inline bold/italic support ──
  // Parses **bold** and *italic* markdown tokens and switches jsPDF font style per segment.
  const drawRichText = (text: string, x: number, maxW: number, fontSize: number = bodyFontSizePt) => {
    doc.setFontSize(fontSize);
    const lineH = fontSize * lineHeightFactor;

    // Clean escape sequences first (same as parseInlineFormatting in DOCX)
    const clean = text
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      .replace(/\\\*/g, '*')
      .replace(/\\_/g, '_');

    // Split on **bold** and *italic* tokens
    const parts = clean.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);

    // Collect word-wrapped segments with their styles
    type Segment = { word: string; bold: boolean; italic: boolean };
    const segments: Segment[] = [];

    parts.forEach((part) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const inner = part.slice(2, -2);
        inner.split(/\s+/).forEach((w) => w && segments.push({ word: w, bold: true, italic: false }));
      } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        const inner = part.slice(1, -1);
        inner.split(/\s+/).forEach((w) => w && segments.push({ word: w, bold: false, italic: true }));
      } else {
        part.split(/\s+/).forEach((w) => w && segments.push({ word: w, bold: false, italic: false }));
      }
    });

    if (segments.length === 0) {
      y += lineH;
      return;
    }

    // Word-wrap segments into lines, switching font style mid-line
    let lineWords: Segment[] = [];
    let lineWidth = 0;

    const flushLine = () => {
      if (lineWords.length === 0) return;
      ensureSpace(lineH);
      let cx = x;
      lineWords.forEach((seg) => {
        const style = seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal';
        doc.setFont(bodyFont, style);
        doc.setFontSize(fontSize);
        doc.text(seg.word, cx, y);
        cx += doc.getTextWidth(seg.word + ' ');
      });
      y += lineH;
      lineWords = [];
      lineWidth = 0;
    };

    segments.forEach((seg) => {
      const style = seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal';
      doc.setFont(bodyFont, style);
      doc.setFontSize(fontSize);
      const ww = doc.getTextWidth(seg.word + ' ');
      if (lineWidth + ww > maxW && lineWords.length > 0) {
        flushLine();
      }
      lineWords.push(seg);
      lineWidth += ww;
    });
    flushLine();

    y += 2; // small gap after paragraph
    // Reset to normal
    doc.setFont(bodyFont, 'normal');
  };

  // ── Helper: draw a horizontal rule ──
  const drawRule = (x: number, w: number, color: number[] = [180, 180, 180]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.line(x, y, x + w, y);
    y += 6;
  };

  // ── Helper: draw a writing line ──
  const drawWritingLine = (x: number, w: number) => {
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.4);
    doc.line(x, y + 12, x + w, y + 12);
    y += 20;
  };

  // ── Helper: draw a filled box header (exercise/scenario) ──
  const drawBoxHeader = (
    text: string,
    x: number,
    w: number,
    fillR: number,
    fillG: number,
    fillB: number,
    textR: number,
    textG: number,
    textB: number
  ) => {
    const boxH = 18;
    doc.setFillColor(fillR, fillG, fillB);
    doc.rect(x, y, w, boxH, 'F');
    doc.setFont(headFont, 'bold');
    doc.setFontSize(bodyFontSizePt - 1);
    doc.setTextColor(textR, textG, textB);
    doc.text(text.toUpperCase(), x + 5, y + 13);
    doc.setTextColor(0, 0, 0);
    y += boxH;
  };

  // ── Helper: draw a left-border block (model response, debrief) ──
  const drawLeftBorderBlock = (text: string, x: number, w: number, barColor: number[]) => {
    const plain = stripMd(text).replace(/^MODEL RESPONSE[:—]?\s*/i, '').replace(/^DEBRIEF[:—]?\s*/i, '');
    doc.setFont(bodyFont, 'italic');
    doc.setFontSize(bodyFontSizePt - 0.5);
    const wrapped = wrapText(doc, plain, w - 10);
    const blockH = wrapped.length * bodyLineH + 8;
    ensureSpace(blockH);
    doc.setDrawColor(barColor[0], barColor[1], barColor[2]);
    doc.setLineWidth(2.5);
    doc.line(x + 1, y, x + 1, y + blockH);
    doc.setLineWidth(0.5);
    wrapped.forEach((line) => {
      doc.text(line, x + 8, y + bodyFontSizePt);
      y += bodyLineH;
    });
    y += 6;
  };

  // ── Build TOC check & Pagination Map ──
  const manuscriptHasToc = blocks.some(
    (b) => b.type === 'toc' || (b.type === 'front_matter' && /TABLE OF CONTENTS|CONTENTS/i.test(b.text))
  );
  const paginationMap = calculateBookPagination(blocks);
  let tocEmitted = false;

  const drawPdfToc = (items: (TocItem | ContentBlock)[]) => {
    newPage();
    doc.setFont(headFont, 'bold');
    doc.setFontSize(14);
    doc.text('TABLE OF CONTENTS', pageW / 2, y, { align: 'center' });
    y += 20;
    drawRule(marginInside, contentW);
    y += 10;

    let runningPage = 7;
    items.forEach((item, idx) => {
      const isBlock = 'type' in item;
      const title = stripMd(isBlock ? (item as ContentBlock).text : (item as TocItem).title);
      const isPart = isBlock
        ? (item as ContentBlock).type === 'part'
        : (item as TocItem).isPart || title.toUpperCase() === 'APPENDICES';

      let pageNum = !isBlock ? (item as TocItem).pageNumber : undefined;
      if (pageNum === undefined) {
        const cleanKey = title.toLowerCase();
        const directMatch = paginationMap.get(cleanKey);
        const chapterMatch = title.match(/^(CHAPTER\s+\d+|Chapter\s+\d+)/i);
        const numMatch = chapterMatch ? paginationMap.get(chapterMatch[1].toLowerCase()) : undefined;
        if (directMatch !== undefined) {
          pageNum = directMatch;
          runningPage = directMatch + 2;
        } else if (numMatch !== undefined) {
          pageNum = numMatch;
          runningPage = numMatch + 2;
        } else {
          pageNum = runningPage;
          runningPage += isPart ? 2 : Math.max(3, Math.round(3 + (idx % 3)));
        }
      }

      const pageStr = String(pageNum);
      ensureSpace(bodyLineH + 4);

      doc.setFont(headFont, isPart ? 'bold' : 'normal');
      doc.setFontSize(isPart ? bodyFontSizePt : bodyFontSizePt - 0.5);
      doc.setTextColor(isPart ? 15 : 51, isPart ? 23 : 65, isPart ? 42 : 85);

      const indent = isPart ? marginInside : marginInside + 12;
      const maxTitleW = contentW - 40;
      const truncatedTitle = doc.getTextWidth(title) > maxTitleW ? title.slice(0, 45) + '…' : title;
      doc.text(truncatedTitle, indent, y);

      const titleW = doc.getTextWidth(truncatedTitle);
      const pageNumW = doc.getTextWidth(pageStr);
      const rightEdge = pageW - marginOutside;

      // Draw page number right-aligned
      doc.setFont(bodyFont, isPart ? 'bold' : 'normal');
      doc.text(pageStr, rightEdge, y, { align: 'right' });

      // Draw dot leaders in between title and page number
      const leaderStartX = indent + titleW + 4;
      const leaderEndX = rightEdge - pageNumW - 4;
      if (leaderEndX > leaderStartX + 10) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);

        const dotChar = '· ';
        const dotW = doc.getTextWidth(dotChar);
        const dotCount = Math.floor((leaderEndX - leaderStartX) / dotW);
        if (dotCount > 0) {
          const dots = dotChar.repeat(dotCount);
          doc.text(dots, leaderStartX, y);
        }
      }

      doc.setTextColor(0, 0, 0);
      y += bodyLineH + (isPart ? 4 : 2);
    });
    y += 10;
  };

  // ── Main rendering loop ──
  let inExercise = false;
  let inScenario = false;
  let exerciseX = marginInside;
  let exerciseW = contentW;
  let scenarioX = marginInside;
  let scenarioW = contentW;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // C6: Close exercise/scenario context on all structural boundaries
    // Matches the expanded reset list in parseManuscript and generateDocx
    if (['title', 'part', 'chapter', 'section', 'subsection', 'front_matter', 'toc',
         'divider', 'model_response', 'debrief', 'reflection',
         'key_takeaways', 'action'].includes(block.type)) {
      inExercise = false;
      inScenario = false;
      exerciseX = marginInside;
      exerciseW = contentW;
      scenarioX = marginInside;
      scenarioW = contentW;
    }

    // Emit generated TOC before first part/chapter (if manuscript doesn't have one)
    if (
      settings.generateTocPlaceholder &&
      !tocEmitted &&
      !manuscriptHasToc &&
      (block.type === 'part' || block.type === 'chapter')
    ) {
      tocEmitted = true;
      const chapterList = blocks.filter((b) => b.type === 'chapter' || b.type === 'part');
      if (chapterList.length > 0) {
        drawPdfToc(chapterList);
      }
    }

    switch (block.type) {
      case 'toc': {
        const items: TocItem[] = block.metadata?.items ?? [];
        const tocList = items.length > 0 ? items : blocks.filter((b) => b.type === 'chapter' || b.type === 'part');
        drawPdfToc(tocList);
        break;
      }
      case 'title': {
        // Title page — centered large text
        newPage();
        y = pageH * 0.3;
        doc.setFont(headFont, 'bold');
        doc.setFontSize(22);
        const titleStr = stripMd(block.text);
        const titleLines = wrapText(doc, titleStr, contentW);
        titleLines.forEach((line) => {
          doc.text(line, pageW / 2, y, { align: 'center' });
          y += 28;
        });
        break;
      }

      case 'subtitle': {
        doc.setFont(headFont, 'italic');
        doc.setFontSize(13);
        const subLines = wrapText(doc, stripMd(block.text), contentW);
        subLines.forEach((line) => {
          doc.text(line, pageW / 2, y + 8, { align: 'center' });
          y += 18;
        });
        y += 10;
        break;
      }

      case 'front_matter': {
        newPage();
        doc.setFont(headFont, 'bold');
        doc.setFontSize(14);
        doc.text(stripMd(block.text).toUpperCase(), pageW / 2, y + 30, { align: 'center' });
        y += 50;
        drawRule(marginInside, contentW, [180, 180, 180]);
        y += 6;
        break;
      }

      case 'part': {
        newPage();
        y = pageH * 0.35;
        doc.setFont(headFont, 'bold');
        doc.setFontSize(20);
        const partLines = wrapText(doc, stripMd(block.text).toUpperCase(), contentW);
        partLines.forEach((line) => {
          doc.text(line, pageW / 2, y, { align: 'center' });
          y += 26;
        });
        y += 20;
        break;
      }

      case 'chapter': {
        if (settings.chapterPageBreaks) {
          newPage();
        } else {
          ensureSpace(50);
          y += 18;
        }
        const fullTitle = stripMd(block.text);
        const match = fullTitle.match(/^(CHAPTER\s+\d+|Chapter\s+\d+|PROLOGUE|EPILOGUE|CONCLUSION|INTRODUCTION)[:—\-]\s*(.*)$/i);
        if (match) {
          doc.setFont(headFont, 'bold');
          doc.setFontSize(9);
          doc.setTextColor(124, 58, 237);
          doc.text(match[1].toUpperCase(), pageW / 2, y, { align: 'center' });
          y += 14;
          doc.setFont(headFont, 'bold');
          doc.setFontSize(15);
          doc.setTextColor(15, 23, 42);
          const titleLines = wrapText(doc, match[2] || match[1], contentW);
          titleLines.forEach((line) => {
            doc.text(line, pageW / 2, y, { align: 'center' });
            y += 18;
          });
          doc.setTextColor(0, 0, 0);
          drawRule(pageW / 2 - 20, 40, [203, 213, 225]);
          y += 10;
        } else {
          // M4: Center-align plain chapter titles to match preview + DOCX
          doc.setFont(headFont, 'bold');
          doc.setFontSize(16);
          const chapLines = wrapText(doc, fullTitle, contentW);
          chapLines.forEach((line) => {
            doc.text(line, pageW / 2, y, { align: 'center' });
            y += 22;
          });
          drawRule(pageW / 2 - contentW / 4, contentW / 2, [203, 213, 225]);
          y += 8;
        }
        break;
      }

      case 'section': {
        ensureSpace(20);
        y += 8;
        doc.setFont(headFont, 'bold');
        doc.setFontSize(13);
        const sectLines = wrapText(doc, stripMd(block.text), contentW);
        sectLines.forEach((line) => {
          doc.text(line, marginInside, y);
          y += 18;
        });
        y += 4;
        break;
      }

      case 'subsection': {
        ensureSpace(16);
        y += 6;
        doc.setFont(headFont, 'bolditalic');
        doc.setFontSize(bodyFontSizePt + 0.5);
        const ssLines = wrapText(doc, stripMd(block.text), contentW);
        ssLines.forEach((line) => {
          doc.text(line, marginInside, y);
          y += bodyLineH;
        });
        y += 3;
        break;
      }

      case 'exercise_header': {
        ensureSpace(30);
        y += 8;
        inExercise = true;
        inScenario = false;
        if (settings.formatExerciseBoxes) {
          exerciseX = marginInside;
          exerciseW = contentW;
          // M3: Use accent color for exercise header (matches DOCX left-border accent)
          const isBwEx = settings.interiorColor === 'bw';
          const exFill = isBwEx ? [241, 245, 249] : [accentRgb[0], accentRgb[1], accentRgb[2]];
          const exText = isBwEx ? [15, 23, 42] : [255, 255, 255];
          drawBoxHeader(stripMd(block.text), exerciseX, exerciseW, exFill[0], exFill[1], exFill[2], exText[0], exText[1], exText[2]);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
        } else {
          doc.setFont(headFont, 'bold');
          doc.setFontSize(bodyFontSizePt);
          doc.text(stripMd(block.text), marginInside, y);
          y += 14;
        }
        break;
      }

      case 'scenario_header': {
        ensureSpace(30);
        y += 8;
        inScenario = true;
        inExercise = false;
        if (settings.formatScenarioBlocks) {
          scenarioX = marginInside;
          scenarioW = contentW;
          // M2: Use accent color from settings.accentTheme (matches DOCX accentColorMap)
          const isBwSc = settings.interiorColor === 'bw';
          const scFill = isBwSc ? [51, 65, 85] : [accentRgb[0], accentRgb[1], accentRgb[2]];
          drawBoxHeader(stripMd(block.text), scenarioX, scenarioW, scFill[0], scFill[1], scFill[2], 255, 255, 255);
          doc.setDrawColor(isBwSc ? 226 : 204, isBwSc ? 232 : 251, isBwSc ? 240 : 241);
          doc.setLineWidth(0.5);
        } else {
          doc.setFont(headFont, 'bold');
          doc.setFontSize(bodyFontSizePt);
          doc.text(stripMd(block.text), marginInside, y);
          y += 14;
        }
        break;
      }

      case 'exercise_body':
      case 'scenario_body': {
        const bodyX = inExercise ? exerciseX + 6 : inScenario ? scenarioX + 6 : marginInside;
        const bodyW = inExercise ? exerciseW - 12 : inScenario ? scenarioW - 12 : contentW;

        if (block.metadata?.isList && Array.isArray(block.metadata.items)) {
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(bodyFontSizePt);
          block.metadata.items.forEach((item: string, idx: number) => {
            const prefix = block.metadata?.ordered ? `${idx + 1}. ` : '\u2022  ';
            const itemLines = wrapText(doc, stripMd(prefix + item), bodyW - 12);
            ensureSpace(itemLines.length * bodyLineH);
            itemLines.forEach((line, li) => {
              doc.text(line, bodyX + (li === 0 ? 0 : 12), y);
              y += bodyLineH;
            });
          });
          y += 3;
        } else {
          drawRichText(block.text, bodyX, bodyW);
        }
        break;
      }

      case 'model_response': {
        const mrBodyText = stripMd(block.text).replace(/^MODEL RESPONSE[:—]?\s*/i, '');
        if (settings.formatModelResponses) {
          const lines = wrapText(doc, mrBodyText, contentW - 16);
          const boxH = lines.length * bodyLineH + 18;
          ensureSpace(boxH + 4);
          y += 4;
          doc.setFillColor(248, 250, 252);
          doc.rect(marginInside, y - 4, contentW, boxH, 'F');
          doc.setDrawColor(56, 189, 248);
          doc.setLineWidth(2.5);
          doc.line(marginInside, y - 4, marginInside, y - 4 + boxH);
          doc.setFont(headFont, 'bold');
          doc.setFontSize(8);
          doc.setTextColor(2, 132, 199);
          doc.text('MODEL RESPONSE', marginInside + 8, y + 4);
          y += 12;
          doc.setFont(bodyFont, 'italic');
          doc.setFontSize(bodyFontSizePt - 0.5);
          doc.setTextColor(51, 65, 85);
          lines.forEach((l) => {
            doc.text(l, marginInside + 8, y);
            y += bodyLineH;
          });
          doc.setTextColor(0, 0, 0);
          y += 4;
        } else {
          // C3: Fallback — render as plain italic paragraph when toggle is off
          doc.setFont(bodyFont, 'italic');
          drawRichText(mrBodyText, marginInside, contentW);
        }
        break;
      }

      case 'debrief': {
        const dbBodyText = stripMd(block.text).replace(/^DEBRIEF[:—]?\s*/i, '');
        if (settings.formatDebriefBlocks) {
          const lines = wrapText(doc, dbBodyText, contentW - 16);
          const boxH = lines.length * bodyLineH + 18;
          ensureSpace(boxH + 4);
          y += 4;
          doc.setFillColor(250, 245, 255);
          doc.rect(marginInside, y - 4, contentW, boxH, 'F');
          doc.setDrawColor(168, 85, 247);
          doc.setLineWidth(2.5);
          doc.line(marginInside, y - 4, marginInside, y - 4 + boxH);
          doc.setFont(headFont, 'bold');
          doc.setFontSize(8);
          doc.setTextColor(147, 51, 234);
          doc.text('DEBRIEF', marginInside + 8, y + 4);
          y += 12;
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(bodyFontSizePt - 0.5);
          doc.setTextColor(51, 65, 85);
          lines.forEach((l) => {
            doc.text(l, marginInside + 8, y);
            y += bodyLineH;
          });
          doc.setTextColor(0, 0, 0);
          y += 4;
        } else {
          // C4: Fallback — render as plain paragraph when toggle is off
          drawRichText(dbBodyText, marginInside, contentW);
        }
        break;
      }

      case 'reflection': {
        const rfBodyText = stripMd(block.text);
        if (settings.formatReflectionPrompts) {
          const lines = wrapText(doc, rfBodyText, contentW - 16);
          const boxH = lines.length * bodyLineH + 18;
          ensureSpace(boxH + 4);
          y += 4;
          doc.setFillColor(255, 251, 235);
          doc.rect(marginInside, y - 4, contentW, boxH, 'F');
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(2.5);
          doc.line(marginInside, y - 4, marginInside, y - 4 + boxH);
          doc.setFont(headFont, 'bold');
          doc.setFontSize(8);
          doc.setTextColor(217, 119, 6);
          doc.text('REFLECTION PROMPT', marginInside + 8, y + 4);
          y += 12;
          doc.setFont(bodyFont, 'italic');
          doc.setFontSize(bodyFontSizePt - 0.5);
          doc.setTextColor(51, 65, 85);
          lines.forEach((l) => {
            doc.text(l, marginInside + 8, y);
            y += bodyLineH;
          });
          doc.setTextColor(0, 0, 0);
          y += 4;
        } else {
          // C5: Fallback — render as plain italic paragraph when toggle is off
          doc.setFont(bodyFont, 'italic');
          drawRichText(rfBodyText, marginInside, contentW);
        }
        break;
      }

      case 'action': {
        const acBodyText = stripMd(block.text).replace(/^ACTION PLAN[:—]?\s*/i, '');
        if (settings.formatActionPlans ?? true) {
          // C2: Respect formatActionPlans toggle
          const lines = wrapText(doc, acBodyText, contentW - 16);
          const boxH = lines.length * bodyLineH + 18;
          ensureSpace(boxH + 4);
          y += 4;
          doc.setFillColor(254, 243, 199);
          doc.rect(marginInside, y - 4, contentW, boxH, 'F');
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(2.5);
          doc.line(marginInside, y - 4, marginInside, y - 4 + boxH);
          doc.setFont(headFont, 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(180, 83, 9);
          doc.text('ACTION PLAN', marginInside + 8, y + 4);
          y += 12;
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(bodyFontSizePt - 0.5);
          doc.setTextColor(30, 41, 59);
          lines.forEach((l) => {
            doc.text(l, marginInside + 8, y);
            y += bodyLineH;
          });
          doc.setTextColor(0, 0, 0);
          y += 4;
        } else {
          drawRichText(acBodyText, marginInside, contentW);
        }
        break;
      }

      case 'key_takeaways': {
        const ktBodyText = block.text.replace(/^(KEY TAKEAWAYS|Key Takeaways|SUMMARY|Summary|IN SUMMARY)[:—]?\s*/i, '');
        if (settings.formatKeyTakeaways ?? true) {
          // Pre-calculate height using stripped text for layout, then drawRichText for actual render
          const ktStripped = stripMd(ktBodyText);
          const ktLines = wrapText(doc, ktStripped, contentW - 24);
          const ktH = Math.max(32, ktLines.length * bodyLineH + 24);
          ensureSpace(ktH + 6);
          const ktStartY = y;
          y += 4;
          doc.setFillColor(236, 253, 245);
          doc.rect(marginInside, ktStartY, contentW, ktH, 'F');
          doc.setDrawColor(5, 150, 105);
          doc.setLineWidth(3);
          doc.line(marginInside, ktStartY, marginInside, ktStartY + ktH);
          doc.setFont(headFont, 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(6, 95, 70);
          doc.text('✦ KEY TAKEAWAYS', marginInside + 10, y + 4);
          y += 14;
          doc.setTextColor(30, 41, 59);
          // M6: Use drawRichText to preserve bold/italic inside the box body
          drawRichText(ktBodyText, marginInside + 10, contentW - 20, bodyFontSizePt - 0.5);
          doc.setTextColor(0, 0, 0);
          y = Math.max(y, ktStartY + ktH + 4); // ensure y doesn't go backwards
        } else {
          // Fallback: render as plain paragraph when toggle is off
          drawRichText(ktBodyText, marginInside, contentW);
        }
        break;
      }

      case 'quote': {
        const qBodyText = block.text.replace(/^>\s*/, '');
        if (settings.formatCalloutBoxes ?? true) {
          const qStripped = stripMd(qBodyText);
          const qLines = wrapText(doc, qStripped, contentW - 16);
          const qH = qLines.length * bodyLineH + 10;
          ensureSpace(qH + 4);
          y += 3;
          doc.setFillColor(248, 250, 252);
          doc.rect(marginInside, y - 4, contentW, qH, 'F');
          doc.setDrawColor(124, 58, 237);
          doc.setLineWidth(2.5);
          doc.line(marginInside, y - 4, marginInside, y - 4 + qH);
          doc.setFont(bodyFont, 'italic');
          doc.setFontSize(bodyFontSizePt);
          doc.setTextColor(51, 65, 85);
          qLines.forEach((line) => {
            doc.text(line, marginInside + 8, y + 4);
            y += bodyLineH;
          });
          doc.setTextColor(0, 0, 0);
          y += 6;
        } else {
          // C1: Fallback — render as plain italic paragraph when toggle is off
          doc.setFont(bodyFont, 'italic');
          drawRichText(qBodyText, marginInside, contentW);
        }
        break;
      }

      case 'list': {
        // T1: Detect [x]/[ ] checkbox prefixes and substitute Unicode symbols
        const listItems: string[] = block.metadata?.items ?? block.text.split('\n').filter(Boolean);
        const isOrdered = block.metadata?.ordered ?? false;
        const listX = inExercise || inScenario ? marginInside + 5 : marginInside;
        const listW = inExercise || inScenario ? contentW - 10 : contentW;
        listItems.forEach((item, idx) => {
          const isChecked   = /^\[[xX]\]\s*/.test(item);
          const isUnchecked = /^\[\s*\]\s*/.test(item);
          const cleanItem   = item.replace(/^\[[ xX]\]\s*/, '');
          let prefix: string;
          if (isChecked)        prefix = '\u2713  '; // ✓
          else if (isUnchecked) prefix = '\u25A1  '; // □
          else if (isOrdered)   prefix = `${idx + 1}. `;
          else                  prefix = '\u2022  '; // •
          const itemLines = wrapText(doc, stripMd(prefix + cleanItem), listW - 12);
          ensureSpace(itemLines.length * bodyLineH);
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(bodyFontSizePt);
          itemLines.forEach((line, li) => {
            doc.text(line, listX + (li === 0 ? 0 : 12), y);
            y += bodyLineH;
          });
        });
        y += 4;
        break;
      }

      case 'lines': {
        if (settings.addWritingLines) {
          const lineCount = block.metadata?.lineCount ?? 1;
          const lineX = inExercise || inScenario ? marginInside + 5 : marginInside;
          const lineW = inExercise || inScenario ? contentW - 10 : contentW;
          ensureSpace(lineCount * 20 + 4);
          for (let l = 0; l < lineCount; l++) {
            drawWritingLine(lineX, lineW);
          }
        }
        break;
      }

      case 'table': {
        const tableLines = block.lines ?? block.text.split('\n');
        const separatorLine = tableLines.find((line) => line.match(/^\|[\s\-:]+\|/));
        const alignments: ('left' | 'center' | 'right')[] = [];

        if (separatorLine) {
          const segs = separatorLine.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
          segs.forEach((seg) => {
            const trimmed = seg.trim();
            if (trimmed.startsWith(':') && trimmed.endsWith(':')) alignments.push('center');
            else if (trimmed.endsWith(':')) alignments.push('right');
            else alignments.push('left');
          });
        }

        const rows = tableLines
          .filter((line) => !line.match(/^\|[\s\-:]+\|/))
          .map((line) =>
            line
              .split('|')
              .filter((_, ci, arr) => ci > 0 && ci < arr.length - 1)
              .map((cell) => cell.trim())
          )
          .filter((row) => row.length > 0);

        if (rows.length > 0) {
          const colCount = rows[0].length;
          const colW = contentW / colCount;
          const cellPad = 5;
          const cellInnerW = colW - cellPad * 2;
          const isBw = settings.interiorColor === 'bw';

          rows.forEach((row, rIdx) => {
            doc.setFont(bodyFont, rIdx === 0 ? 'bold' : 'normal');
            doc.setFontSize(bodyFontSizePt - 1.5);
            const isHeader = rIdx === 0;

            const wrappedCells = row.map((cell) => wrapText(doc, cell, cellInnerW));
            const maxLines = Math.max(1, ...wrappedCells.map((lines) => lines.length));
            const rowH = Math.max(18, maxLines * (bodyFontSizePt * 0.95) + cellPad * 2 + 2);

            ensureSpace(rowH + 2);
            const rowStartY = y;  // capture exact top of this row BEFORE drawing

            if (isHeader) {
              if (isBw) doc.setFillColor(244, 244, 245);
              else doc.setFillColor(30, 41, 59);
              doc.rect(marginInside, rowStartY, contentW, rowH, 'F');
              if (isBw) doc.setTextColor(24, 24, 27);
              else doc.setTextColor(255, 255, 255);
            } else if (rIdx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(marginInside, rowStartY, contentW, rowH, 'F');
              doc.setTextColor(51, 65, 85);
            } else {
              doc.setTextColor(51, 65, 85);
            }

            // Subtle bottom row divider
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(marginInside, rowStartY + rowH, marginInside + contentW, rowStartY + rowH);

            wrappedCells.forEach((cellLines, cIdx) => {
              let cellY = rowStartY + cellPad + bodyFontSizePt * 0.85; // consistent top-padding from row top
              const align = alignments[cIdx] || 'left';
              cellLines.forEach((cline: string) => {
                if (align === 'center') {
                  doc.text(cline, marginInside + colW * cIdx + colW / 2, cellY, { align: 'center' });
                } else if (align === 'right') {
                  doc.text(cline, marginInside + colW * (cIdx + 1) - cellPad, cellY, { align: 'right' });
                } else {
                  doc.text(cline, marginInside + colW * cIdx + cellPad, cellY);
                }
                cellY += bodyFontSizePt * 0.95;
              });
            });

            doc.setTextColor(0, 0, 0);
            y = rowStartY + rowH; // advance y by exact row height
          });
          y += 6;
        }
        break;
      }

      case 'divider': {
        if (settings.ornamentalDividers) {
          ensureSpace(16);
          y += 4;
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(10);
          doc.setTextColor(148, 163, 184);
          doc.text('✦   ✦   ✦', pageW / 2, y, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          y += 10;
        } else {
          ensureSpace(12);
          y += 4;
          drawRule(marginInside, contentW, [226, 232, 240]);
          y += 4;
        }
        break;
      }

      case 'blank': {
        y += bodyLineH * 0.5;
        break;
      }

      case 'paragraph':
      default: {
        if (block.text?.trim()) {
          const pX = inExercise || inScenario ? marginInside + 5 : marginInside;
          const pW = inExercise || inScenario ? contentW - 10 : contentW;
          drawRichText(block.text, pX, pW);
        }
        break;
      }
    }
  }

  // Draw header/footer on last page
  drawHeaderFooter();

  return doc;
}

/**
 * Triggers browser download of the generated PDF file.
 */
export async function downloadPdfFile(
  blocks: ContentBlock[],
  settings: KdpFormatSettings
): Promise<void> {
  const doc = await generatePdf(blocks, settings);
  const safeTitle = (settings.title || 'manuscript')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
  doc.save(`${safeTitle}_KDP_formatted.pdf`);
}
