import jsPDF from 'jspdf';
import { ContentBlock, KdpFormatSettings } from '../types/formatter';
import { cleanText } from './generateDocx';

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

  // Font mapping: jsPDF built-ins only (Times is closest to Georgia)
  const bodyFont = 'times';
  const headFont = 'times';
  const bodyFontSizePt = (settings.fontSize || 22) / 2; // half-points → pt
  const lineHeightFactor = parseFloat(settings.lineSpacing || '1.15');
  const bodyLineH = bodyFontSizePt * lineHeightFactor;

  const doc = new jsPDF({
    unit: 'pt',
    format: [pageW, pageH],
    orientation: 'portrait',
  });

  let pageNum = 1;
  let y = contentTop;

  // ── Helper: draw header/footer on current page ──
  const drawHeaderFooter = () => {
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

  // ── Helper: render body text with inline bold/italic approximation ──
  const drawBodyText = (text: string, x: number, maxW: number, fontSize: number = bodyFontSizePt) => {
    doc.setFont(bodyFont, 'normal');
    doc.setFontSize(fontSize);
    // Strip markdown formatting for PDF text (bold/italic via jsPDF is complex)
    const plain = stripMd(text);
    const lineH = fontSize * lineHeightFactor;
    const wrapped = wrapText(doc, plain, maxW);
    wrapped.forEach((line) => {
      ensureSpace(lineH);
      doc.text(line, x, y);
      y += lineH;
    });
    y += 2; // small gap after paragraph
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

  // ── Build TOC check ──
  const manuscriptHasToc = blocks.some(
    (b) => b.type === 'front_matter' && /TABLE OF CONTENTS|CONTENTS/i.test(b.text)
  );
  let tocEmitted = false;

  // ── Main rendering loop ──
  let inExercise = false;
  let inScenario = false;
  let exerciseX = marginInside;
  let exerciseW = contentW;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Close exercise/scenario context on structural boundary
    if (['title', 'part', 'chapter', 'section', 'front_matter'].includes(block.type)) {
      inExercise = false;
      inScenario = false;
      exerciseX = marginInside;
      exerciseW = contentW;
    }

    // Emit generated TOC before first part/chapter (if manuscript doesn't have one)
    if (
      settings.generateTocPlaceholder &&
      !tocEmitted &&
      !manuscriptHasToc &&
      (block.type === 'part' || block.type === 'chapter')
    ) {
      tocEmitted = true;
      newPage();
      // TOC heading
      doc.setFont(headFont, 'bold');
      doc.setFontSize(14);
      doc.text('TABLE OF CONTENTS', pageW / 2, y, { align: 'center' });
      y += 24;
      drawRule(marginInside, contentW);
      y += 4;

      const chapterList = blocks.filter((b) => b.type === 'chapter' || b.type === 'part');
      chapterList.forEach((ch) => {
        const isPart = ch.type === 'part';
        const title = stripMd(ch.text);
        doc.setFont(headFont, isPart ? 'bold' : 'normal');
        doc.setFontSize(isPart ? bodyFontSizePt : bodyFontSizePt - 0.5);
        const indent = isPart ? marginInside : marginInside + 10;
        doc.text(title, indent, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text('· · · · · [ — ]', pageW - marginOutside, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        y += bodyLineH + 2;
        ensureSpace(bodyLineH + 2);
      });
      y += 10;
    }

    switch (block.type) {
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
          doc.setFont(headFont, 'bold');
          doc.setFontSize(16);
          const chapLines = wrapText(doc, fullTitle, contentW);
          chapLines.forEach((line) => {
            doc.text(line, marginInside, y);
            y += 22;
          });
          drawRule(marginInside, contentW, [203, 213, 225]);
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
          drawBoxHeader(stripMd(block.text), exerciseX, exerciseW, 241, 245, 249, 15, 23, 42);
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
          const isBw = settings.interiorColor === 'bw';
          if (isBw) {
            drawBoxHeader(stripMd(block.text), scenarioX, scenarioW, 51, 65, 85, 255, 255, 255);
          } else {
            drawBoxHeader(stripMd(block.text), scenarioX, scenarioW, 15, 118, 110, 255, 255, 255);
          }
          doc.setDrawColor(isBw ? 226 : 204, isBw ? 232 : 251, isBw ? 240 : 241);
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
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(bodyFontSizePt);
          const plain = stripMd(block.text);
          const wrapped = wrapText(doc, plain, bodyW);
          wrapped.forEach((line) => {
            ensureSpace(bodyLineH);
            doc.text(line, bodyX, y);
            y += bodyLineH;
          });
          y += 3;
        }
        break;
      }

      case 'model_response': {
        if (settings.formatModelResponses) {
          const bodyText = stripMd(block.text).replace(/^MODEL RESPONSE[:—]?\s*/i, '');
          const lines = wrapText(doc, bodyText, contentW - 16);
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
        }
        break;
      }

      case 'debrief': {
        if (settings.formatDebriefBlocks) {
          const bodyText = stripMd(block.text).replace(/^DEBRIEF[:—]?\s*/i, '');
          const lines = wrapText(doc, bodyText, contentW - 16);
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
        }
        break;
      }

      case 'reflection': {
        if (settings.formatReflectionPrompts) {
          const bodyText = stripMd(block.text);
          const lines = wrapText(doc, bodyText, contentW - 16);
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
        }
        break;
      }

      case 'action': {
        const bodyText = stripMd(block.text).replace(/^ACTION PLAN[:—]?\s*/i, '');
        const lines = wrapText(doc, bodyText, contentW - 16);
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
        doc.text('📋 ACTION PLAN', marginInside + 8, y + 4);
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
        break;
      }

      case 'key_takeaways': {
        if (settings.formatKeyTakeaways ?? true) {
          const ktText = stripMd(block.text).replace(/^(KEY TAKEAWAYS|Key Takeaways|SUMMARY|Summary|IN SUMMARY)[:—]?\s*/i, '');
          const ktLines = wrapText(doc, ktText, contentW - 16);
          const ktH = Math.max(26, ktLines.length * bodyLineH + 20);
          ensureSpace(ktH + 6);
          y += 4;
          doc.setFillColor(236, 253, 245);
          doc.rect(marginInside, y - 4, contentW, ktH, 'F');
          doc.setDrawColor(5, 150, 105);
          doc.setLineWidth(3);
          doc.line(marginInside, y - 4, marginInside, y - 4 + ktH);
          doc.setFont(headFont, 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(6, 95, 70);
          doc.text('✦ KEY TAKEAWAYS', marginInside + 8, y + 4);
          y += 12;
          doc.setFont(bodyFont, 'normal');
          doc.setFontSize(bodyFontSizePt - 0.5);
          doc.setTextColor(30, 41, 59);
          ktLines.forEach((line) => {
            doc.text(line, marginInside + 8, y);
            y += bodyLineH;
          });
          doc.setTextColor(0, 0, 0);
          y += 6;
        }
        break;
      }

      case 'quote': {
        if (settings.formatCalloutBoxes ?? true) {
          const qText = stripMd(block.text).replace(/^>\s*/, '');
          const qLines = wrapText(doc, qText, contentW - 16);
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
        }
        break;
      }

      case 'list': {
        const listItems: string[] = block.metadata?.items ?? block.text.split('\n').filter(Boolean);
        const isOrdered = block.metadata?.ordered ?? false;
        const listX = inExercise || inScenario ? marginInside + 5 : marginInside;
        const listW = inExercise || inScenario ? contentW - 10 : contentW;
        listItems.forEach((item, idx) => {
          const prefix = isOrdered ? `${idx + 1}. ` : '\u2022  ';
          const itemLines = wrapText(doc, stripMd(prefix + item), listW - 12);
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
            const rowH = Math.max(16, maxLines * (bodyFontSizePt * 0.95) + 6);

            ensureSpace(rowH + 2);

            if (isHeader) {
              if (isBw) doc.setFillColor(244, 244, 245);
              else doc.setFillColor(30, 41, 59);
              doc.rect(marginInside, y - 11, contentW, rowH, 'F');
              if (isBw) doc.setTextColor(24, 24, 27);
              else doc.setTextColor(255, 255, 255);
            } else if (rIdx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(marginInside, y - 11, contentW, rowH, 'F');
              doc.setTextColor(51, 65, 85);
            } else {
              doc.setTextColor(51, 65, 85);
            }

            // Subtle bottom row divider
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(marginInside, y - 11 + rowH, marginInside + contentW, y - 11 + rowH);

            wrappedCells.forEach((cellLines, cIdx) => {
              let cellY = y - 11 + 10;
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
            y += rowH;
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
          drawBodyText(block.text, pX, pW);
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
