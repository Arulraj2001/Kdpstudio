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
          ensureSpace(40);
          y += 16;
        }
        doc.setFont(headFont, 'bold');
        doc.setFontSize(16);
        const chapLines = wrapText(doc, stripMd(block.text), contentW);
        chapLines.forEach((line) => {
          doc.text(line, marginInside, y);
          y += 22;
        });
        y += 2;
        drawRule(marginInside, contentW, [50, 50, 50]);
        y += 8;
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
          drawBoxHeader(stripMd(block.text), exerciseX, exerciseW, 238, 238, 238, 0, 0, 0);
          // Draw thin border left+right to start the box
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
        } else {
          doc.setFont(headFont, 'bold');
          doc.setFontSize(bodyFontSizePt);
          doc.text(stripMd(block.text), marginInside, y);
          y += bodyLineH + 4;
        }
        break;
      }

      case 'scenario_header': {
        ensureSpace(30);
        y += 8;
        inScenario = true;
        inExercise = false;
        if (settings.formatScenarioBlocks) {
          exerciseX = marginInside;
          exerciseW = contentW;
          drawBoxHeader(stripMd(block.text), exerciseX, exerciseW, 26, 107, 114, 255, 255, 255);
        } else {
          doc.setFont(headFont, 'bold');
          doc.setFontSize(bodyFontSizePt);
          doc.text(stripMd(block.text), marginInside, y);
          y += bodyLineH + 4;
        }
        break;
      }

      case 'exercise_body':
      case 'scenario_body': {
        const bodyX = inExercise || inScenario ? marginInside + 5 : marginInside;
        const bodyW = inExercise || inScenario ? contentW - 10 : contentW;
        if (block.metadata?.isList) {
          const items: string[] = block.metadata?.items ?? block.text.split('\n').filter(Boolean);
          const isOrd = block.metadata?.ordered ?? false;
          items.forEach((item, idx) => {
            const prefix = isOrd ? `${idx + 1}. ` : '\u2022  ';
            const itemLines = wrapText(doc, stripMd(prefix + item), bodyW - 14);
            ensureSpace(itemLines.length * bodyLineH);
            doc.setFont(bodyFont, 'normal');
            doc.setFontSize(bodyFontSizePt);
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
          ensureSpace(24);
          y += 4;
          doc.setFont(headFont, 'bold');
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text('MODEL RESPONSE', marginInside + 8, y);
          doc.setTextColor(0, 0, 0);
          y += 12;
        }
        break;
      }

      case 'debrief': {
        if (settings.formatDebriefBlocks) {
          ensureSpace(20);
          y += 4;
          const debriefText = stripMd(block.text).replace(/^DEBRIEF[:—]?\s*/i, '');
          if (debriefText) {
            drawLeftBorderBlock(debriefText, marginInside, contentW, [136, 136, 136]);
          } else {
            doc.setFont(headFont, 'bold');
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text('DEBRIEF', marginInside + 8, y);
            doc.setTextColor(0, 0, 0);
            y += 14;
          }
        }
        break;
      }

      case 'reflection': {
        if (settings.formatReflectionPrompts) {
          ensureSpace(20);
          y += 4;
          doc.setFont(headFont, 'bolditalic');
          doc.setFontSize(bodyFontSizePt);
          const refText = stripMd(block.text);
          const refLines = wrapText(doc, refText, contentW - 10);
          doc.setFillColor(245, 245, 245);
          const refH = refLines.length * bodyLineH + 8;
          doc.rect(marginInside, y - 4, contentW, refH, 'F');
          refLines.forEach((line) => {
            doc.text(line, marginInside + 5, y + 4);
            y += bodyLineH;
          });
          y += 6;
        }
        break;
      }

      case 'action': {
        ensureSpace(20);
        y += 6;
        doc.setFont(headFont, 'bold');
        doc.setFontSize(bodyFontSizePt + 1);
        const actLines = wrapText(doc, stripMd(block.text), contentW);
        actLines.forEach((line) => {
          doc.text(line, marginInside, y);
          y += bodyLineH + 2;
        });
        y += 4;
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
          ensureSpace(rows.length * 18 + 4);

          rows.forEach((row, rIdx) => {
            const rowH = 16;
            ensureSpace(rowH);
            if (rIdx === 0) {
              doc.setFillColor(238, 238, 238);
              doc.rect(marginInside, y - 11, contentW, rowH, 'F');
            }
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.rect(marginInside, y - 11, contentW, rowH);

            doc.setFont(bodyFont, rIdx === 0 ? 'bold' : 'normal');
            doc.setFontSize(bodyFontSizePt - 1.5);
            row.forEach((cell, cIdx) => {
              doc.text(cell.slice(0, 30), marginInside + colW * cIdx + 3, y - 2);
              if (cIdx > 0) {
                doc.line(marginInside + colW * cIdx, y - 11, marginInside + colW * cIdx, y + 5);
              }
            });
            y += rowH;
          });
          y += 6;
        }
        break;
      }

      case 'divider': {
        ensureSpace(12);
        y += 4;
        drawRule(marginInside, contentW, [180, 180, 180]);
        y += 4;
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
