import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  PageBreak,
  ShadingType,
  WidthType,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber,
} from 'docx';
import { ContentBlock, KdpFormatSettings } from '../types/formatter';

/**
 * Strips markdown marker symbols while preserving textual content
 */
export function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // bold markers
    .replace(/\*(.*?)\*/g, '$1')      // italic markers
    .replace(/`(.*?)`/g, '$1')        // code markers
    .replace(/^#+\s*/, '')            // heading markers
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\\*/g, '*')
    .replace(/\\_/g, '_')
    .trim();
}

/**
 * Splits markdown text on **bold** and *italic* tokens into formatted TextRun elements
 */
export function parseInlineFormatting(text: string, baseStyle: Record<string, any> = {}): TextRun[] {
  if (!text) return [new TextRun({ text: '', ...baseStyle })];

  const clean = text
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\\*/g, '*');

  const runs: TextRun[] = [];
  const parts = clean.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  parts.forEach((part) => {
    if (!part) return;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2).replace(/\\_/g, '_'),
          bold: true,
          ...baseStyle,
        })
      );
    } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1).replace(/\\_/g, '_'),
          italics: true,
          ...baseStyle,
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part.replace(/\\_/g, '_'),
          ...baseStyle,
        })
      );
    }
  });

  return runs.length ? runs : [new TextRun({ text: clean.replace(/\\_/g, '_'), ...baseStyle })];
}

/**
 * Builds a publication-ready KDP DOCX Document with exact print typography and boxes
 */
export async function generateDocx(
  blocks: ContentBlock[],
  settings: KdpFormatSettings
): Promise<Document> {
  const trimW = settings.trimWidth || 7;
  const trimH = settings.trimHeight || 10;
  const fontSize = settings.fontSize || 22; // half-points (11pt = 22)
  const fontName = settings.font || 'Georgia';
  const lineSpacing = settings.lineSpacingValue || 276; // 1.15 line spacing

  const insideMargin = convertInchesToTwip(settings.margins?.inside ?? 0.75);
  const outsideMargin = convertInchesToTwip(settings.margins?.outside ?? 0.625);
  const topMargin = convertInchesToTwip(settings.margins?.top ?? 0.75);
  const bottomMargin = convertInchesToTwip(settings.margins?.bottom ?? 0.75);

  // Helper: standard body paragraph (justified for KDP best practice)
  function bodyParagraph(text: string, options: Record<string, any> = {}): Paragraph {
    return new Paragraph({
      children: parseInlineFormatting(text, {
        font: fontName,
        size: fontSize,
      }),
      spacing: { after: 120, line: lineSpacing }, // 6pt after, 1.15 line spacing
      alignment: AlignmentType.JUSTIFIED,
      ...options,
    });
  }

  // Helper: ruled writing line with bottom border
  function writingLine(): Paragraph {
    return new Paragraph({
      children: [new TextRun({ text: '', size: 36, font: fontName })],
      spacing: { before: 100, after: 100 },
      border: {
        bottom: { color: 'CBD5E1', space: 1, style: BorderStyle.SINGLE, size: 6 },
      },
    });
  }

  // Helper: exercise box with clean header and border
  function exerciseBox(headerText: string, bodyParagraphs: Paragraph[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        left: { style: BorderStyle.SINGLE, size: 18, color: '64748B' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: headerText,
                      bold: true,
                      font: fontName,
                      size: Math.max(16, fontSize - 4),
                      allCaps: true,
                      color: '0F172A',
                    }),
                  ],
                  spacing: { before: 100, after: 100 },
                }),
              ],
              shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
              margins: {
                top: convertInchesToTwip(0.09),
                bottom: convertInchesToTwip(0.09),
                left: convertInchesToTwip(0.14),
                right: convertInchesToTwip(0.14),
              },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: bodyParagraphs.length ? bodyParagraphs : [bodyParagraph('')],
              margins: {
                top: convertInchesToTwip(0.12),
                bottom: convertInchesToTwip(0.12),
                left: convertInchesToTwip(0.14),
                right: convertInchesToTwip(0.14),
              },
            }),
          ],
        }),
      ],
    });
  }

  // Helper: scenario box with teal header (#1A6B72 for color, #333333 for B&W) and white text
  function scenarioBox(headerText: string, bodyParagraphs: Paragraph[]): Table {
    const isBw = settings.interiorColor === 'bw';
    const headerFill = isBw ? '333333' : '0F766E';
    const borderColor = isBw ? '64748B' : '0F766E';
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        left: { style: BorderStyle.SINGLE, size: 18, color: borderColor },
        right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: headerText,
                      bold: true,
                      font: fontName,
                      size: Math.max(16, fontSize - 4),
                      allCaps: true,
                      color: 'FFFFFF',
                    }),
                  ],
                  spacing: { before: 80, after: 80 },
                }),
              ],
              shading: { type: ShadingType.CLEAR, fill: headerFill },
              margins: {
                top: convertInchesToTwip(0.08),
                bottom: convertInchesToTwip(0.08),
                left: convertInchesToTwip(0.12),
                right: convertInchesToTwip(0.12),
              },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: bodyParagraphs.length ? bodyParagraphs : [bodyParagraph('')],
              margins: {
                top: convertInchesToTwip(0.12),
                bottom: convertInchesToTwip(0.12),
                left: convertInchesToTwip(0.14),
                right: convertInchesToTwip(0.14),
              },
            }),
          ],
        }),
      ],
    });
  }

  // Helper: creates a 1-cell container table with a background fill and colored accent
  function calloutCard(
    title: string,
    body: string,
    fillColor: string,
    borderColor: string,
    titleColor: string
  ): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: title,
                      bold: true,
                      font: fontName,
                      size: Math.max(14, fontSize - 4),
                      allCaps: true,
                      color: titleColor,
                    }),
                  ],
                  spacing: { before: 60, after: 40 },
                }),
                new Paragraph({
                  children: parseInlineFormatting(body, {
                    font: fontName,
                    size: fontSize,
                  }),
                  spacing: { before: 40, after: 60, line: lineSpacing },
                  alignment: AlignmentType.LEFT,
                }),
              ],
              shading: { type: ShadingType.CLEAR, fill: fillColor },
              margins: {
                top: convertInchesToTwip(0.08),
                bottom: convertInchesToTwip(0.08),
                left: convertInchesToTwip(0.12),
                right: convertInchesToTwip(0.12),
              },
            }),
          ],
        }),
      ],
    });
  }

  // Helper: converts markdown table rows to native DOCX Table with modern editorial styling
  function markdownTableToDocx(tableLines: string[]): Table {
    const isBw = settings.interiorColor === 'bw';
    const headerBg = isBw ? 'F4F4F5' : '1E293B';
    const headerTextColor = isBw ? '18181B' : 'FFFFFF';
    const altRowBg = isBw ? 'FAFAFA' : 'F8FAFC';

    const separatorLine = tableLines.find((line) => line.match(/^\|[\s\-:]+\|/));
    const alignments: AlignmentType[] = [];

    if (separatorLine) {
      const segs = separatorLine.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      segs.forEach((seg) => {
        const trimmed = seg.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) alignments.push(AlignmentType.CENTER);
        else if (trimmed.endsWith(':')) alignments.push(AlignmentType.RIGHT);
        else alignments.push(AlignmentType.LEFT);
      });
    }

    const rows = tableLines
      .filter((line) => !line.match(/^\|[\s\-:]+\|/))
      .map((line) =>
        line
          .split('|')
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          .map((cell) => cell.trim())
      );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: 'CBD5E1' },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: 'CBD5E1' },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: rows.map((cells, rowIndex) =>
        new TableRow({
          children: cells.map(
            (cell, colIndex) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cell,
                        bold: rowIndex === 0,
                        font: fontName,
                        size: Math.max(16, fontSize - 4),
                        color: rowIndex === 0 ? headerTextColor : '333333',
                      }),
                    ],
                    alignment: alignments[colIndex] || AlignmentType.LEFT,
                    spacing: { after: 60, before: 60 },
                  }),
                ],
                shading: {
                  type: ShadingType.CLEAR,
                  fill:
                    rowIndex === 0
                      ? headerBg
                      : rowIndex % 2 === 1
                      ? altRowBg
                      : 'FFFFFF',
                },
                margins: {
                  top: convertInchesToTwip(0.08),
                  bottom: convertInchesToTwip(0.08),
                  left: convertInchesToTwip(0.12),
                  right: convertInchesToTwip(0.12),
                },
              })
          ),
        })
      ),
    });
  }

  // ─────────────────────────────────────────────
  // Transform Blocks into DOCX Elements
  // ─────────────────────────────────────────────
  const docElements: (Paragraph | Table)[] = [];
  let i = 0;
  let currentExerciseBuffer: Paragraph[] = [];
  let exerciseHeaderTitle = '';
  let inExercise = false;

  let currentScenarioBuffer: Paragraph[] = [];
  let scenarioHeaderTitle = '';
  let inScenario = false;

  let tableBuffer: string[] = [];

  const flushBuffers = () => {
    if (inExercise && exerciseHeaderTitle) {
      if (settings.formatExerciseBoxes) {
        docElements.push(exerciseBox(exerciseHeaderTitle, currentExerciseBuffer));
      } else {
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exerciseHeaderTitle,
                bold: true,
                font: fontName,
                size: fontSize,
              }),
            ],
            spacing: { before: 240, after: 120 },
          })
        );
        docElements.push(...currentExerciseBuffer);
      }
      currentExerciseBuffer = [];
      exerciseHeaderTitle = '';
      inExercise = false;
    }

    if (inScenario && scenarioHeaderTitle) {
      if (settings.formatScenarioBlocks) {
        docElements.push(scenarioBox(scenarioHeaderTitle, currentScenarioBuffer));
      } else {
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: scenarioHeaderTitle,
                bold: true,
                font: fontName,
                size: fontSize,
              }),
            ],
            spacing: { before: 240, after: 120 },
          })
        );
        docElements.push(...currentScenarioBuffer);
      }
      currentScenarioBuffer = [];
      scenarioHeaderTitle = '';
      inScenario = false;
    }

    if (tableBuffer.length > 0) {
      docElements.push(markdownTableToDocx(tableBuffer));
      tableBuffer = [];
    }
  };

  let hasEmittedToc = false;

  while (i < blocks.length) {
    const block = blocks[i];

    // Check if buffer should flush
    if (inExercise && !['exercise_body', 'paragraph', 'lines', 'blank', 'list', 'debrief', 'reflection', 'action'].includes(block.type)) {
      flushBuffers();
    }

    if (
      inScenario &&
      !['scenario_body', 'paragraph', 'lines', 'blank', 'list', 'model_response', 'debrief', 'reflection', 'action'].includes(block.type)
    ) {
      flushBuffers();
    }

    if (tableBuffer.length > 0 && block.type !== 'table') {
      docElements.push(markdownTableToDocx(tableBuffer));
      tableBuffer = [];
    }

    // Emit TOC Placeholder before first chapter or part
    // Suppressed if manuscript already has a TABLE OF CONTENTS front_matter block
    const manuscriptHasToc = blocks.some(
      (b) => b.type === 'front_matter' && /TABLE OF CONTENTS|CONTENTS/i.test(b.text)
    );
    if (
      settings.generateTocPlaceholder &&
      !hasEmittedToc &&
      !manuscriptHasToc &&
      (block.type === 'part' || block.type === 'chapter')
    ) {
      hasEmittedToc = true;
      const chapterList = blocks.filter((b) => b.type === 'chapter' || b.type === 'part');
      if (chapterList.length > 0) {
        docElements.push(new Paragraph({ children: [new PageBreak()] }));
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'TABLE OF CONTENTS',
                bold: true,
                font: fontName,
                size: 32, // 16pt
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 480, after: 240 },
          })
        );
        chapterList.forEach((ch) => {
          const title = cleanText(ch.text);
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  bold: ch.type === 'part',
                  font: fontName,
                  size: Math.max(16, fontSize - 2),
                }),
                new TextRun({
                  text: ' ................................................................ ',
                  color: 'AAAAAA',
                  font: fontName,
                  size: Math.max(14, fontSize - 4),
                }),
                new TextRun({
                  text: '[ ... ]',
                  font: fontName,
                  size: Math.max(16, fontSize - 2),
                }),
              ],
              spacing: { after: 100 },
            })
          );
        });
      }
    }

    switch (block.type) {
      case 'title':
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(block.text),
                bold: true,
                font: fontName,
                size: 48, // 24pt
                color: '0F172A',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 1440, after: 200 },
          })
        );
        break;

      case 'subtitle':
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(block.text),
                italics: true,
                font: fontName,
                size: fontSize + 2,
                color: '475569',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 480 },
          })
        );
        break;

      case 'front_matter': {
        const fmText = cleanText(block.text);
        const isDedication = /DEDICATION/i.test(fmText);
        docElements.push(new Paragraph({ children: [new PageBreak()] }));
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: fmText,
                bold: true,
                font: fontName,
                size: 24, // 12pt
                allCaps: true,
                color: '475569',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: isDedication ? 1800 : 720, after: 360 },
          })
        );
        break;
      }

      case 'part':
        docElements.push(new Paragraph({ children: [new PageBreak()] }));
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(block.text),
                bold: true,
                font: fontName,
                size: 44, // 22pt
                allCaps: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 720, after: 360 },
          })
        );
        break;

      case 'chapter': {
        if (settings.chapterPageBreaks) {
          docElements.push(new Paragraph({ children: [new PageBreak()] }));
        }
        const fullTitle = cleanText(block.text);
        const match = fullTitle.match(/^(CHAPTER\s+\d+|Chapter\s+\d+|PROLOGUE|EPILOGUE|CONCLUSION|INTRODUCTION)[:—\-]\s*(.*)$/i);
        if (match) {
          // Tier 1: Category Tracker
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: match[1].toUpperCase(),
                  bold: true,
                  font: fontName,
                  size: 20, // 10pt
                  allCaps: true,
                  color: '7C3AED',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 720, after: 80 },
              keepWithNext: true,
            })
          );
          // Tier 2: Chapter Title
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: match[2] || match[1],
                  bold: true,
                  font: fontName,
                  size: 36, // 18pt
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 360 },
              border: {
                bottom: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 6, space: 8 },
              },
              keepWithNext: true,
            })
          );
        } else {
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: fullTitle,
                  bold: true,
                  font: fontName,
                  size: 36,
                }),
              ],
              spacing: { before: 720, after: 360 },
              border: {
                bottom: { color: '333333', style: BorderStyle.SINGLE, size: 6, space: 6 },
              },
              keepWithNext: true,
            })
          );
        }
        break;
      }

      case 'section':
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(block.text),
                bold: true,
                font: fontName,
                size: 28, // 14pt
              }),
            ],
            spacing: { before: 360, after: 120 },
          })
        );
        break;

      case 'subsection':
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(block.text),
                bold: true,
                italics: true,
                font: fontName,
                size: 24, // 12pt
              }),
            ],
            spacing: { before: 240, after: 120 },
          })
        );
        break;

      case 'exercise_header':
        flushBuffers();
        inExercise = true;
        exerciseHeaderTitle = cleanText(block.text);
        break;

      case 'exercise_body':
        if (inExercise) {
          if (block.text.trim()) {
            currentExerciseBuffer.push(bodyParagraph(block.text));
          }
        } else {
          docElements.push(bodyParagraph(block.text));
        }
        break;

      case 'scenario_header':
        flushBuffers();
        inScenario = true;
        scenarioHeaderTitle = cleanText(block.text);
        break;

      case 'scenario_body':
        if (inScenario) {
          if (block.text.trim()) {
            currentScenarioBuffer.push(bodyParagraph(block.text));
          }
        } else {
          docElements.push(bodyParagraph(block.text));
        }
        break;

      case 'model_response': {
        const bodyText = cleanText(block.text).replace(/^MODEL RESPONSE[:—]?\s*/i, '');
        if (settings.formatModelResponses) {
          const card = calloutCard('MODEL RESPONSE', bodyText, 'F8FAFC', '0284C7', '0369A1');
          if (inScenario) currentScenarioBuffer.push(card as any);
          else docElements.push(card);
        } else {
          const p = new Paragraph({
            children: [new TextRun({ text: cleanText(block.text), bold: true, font: fontName, size: fontSize })],
            spacing: { before: 120, after: 60 },
          });
          if (inScenario) currentScenarioBuffer.push(p);
          else docElements.push(p);
        }
        break;
      }

      case 'debrief': {
        const bodyText = cleanText(block.text).replace(/^DEBRIEF[:—]?\s*/i, '');
        if (settings.formatDebriefBlocks) {
          const card = calloutCard('DEBRIEF', bodyText, 'FAF5FF', '9333EA', '6B21A8');
          if (inScenario) currentScenarioBuffer.push(card as any);
          else docElements.push(card);
        } else {
          const p = new Paragraph({
            children: [new TextRun({ text: cleanText(block.text), bold: true, font: fontName, size: fontSize })],
            spacing: { before: 120, after: 60 },
          });
          if (inScenario) currentScenarioBuffer.push(p);
          else docElements.push(p);
        }
        break;
      }

      case 'reflection': {
        if (settings.formatReflectionPrompts) {
          const card = calloutCard('REFLECTION PROMPT', block.text, 'FFFBEB', 'D97706', '92400E');
          docElements.push(card);
        } else {
          docElements.push(
            new Paragraph({
              children: [new TextRun({ text: cleanText(block.text), bold: true, font: fontName, size: fontSize })],
              spacing: { before: 180, after: 60 },
            })
          );
        }
        break;
      }

      case 'action': {
        const bodyText = cleanText(block.text).replace(/^ACTION PLAN[:—]?\s*/i, '');
        const card = calloutCard('📋 ACTION PLAN', bodyText, 'FEF3C7', 'F59E0B', '78350F');
        if (inExercise) currentExerciseBuffer.push(card as any);
        else if (inScenario) currentScenarioBuffer.push(card as any);
        else docElements.push(card);
        break;
      }

      case 'key_takeaways': {
        const bodyText = cleanText(block.text).replace(/^(KEY TAKEAWAYS|Key Takeaways|SUMMARY|Summary|IN SUMMARY)[:—]?\s*/i, '');
        const card = calloutCard('✦ KEY TAKEAWAYS', bodyText, 'ECFDF5', '059669', '065F46');
        docElements.push(card);
        break;
      }

      case 'quote': {
        const bodyText = cleanText(block.text).replace(/^>\s*/, '');
        const card = calloutCard('QUOTE', bodyText, 'F8FAFC', '7C3AED', '475569');
        docElements.push(card);
        break;
      }

      case 'lines': {
        if (settings.addWritingLines) {
          const lineCount = block.metadata?.lineCount ?? 1;
          const writingLines = Array.from({ length: lineCount }, () => writingLine());
          if (inExercise) currentExerciseBuffer.push(...writingLines);
          else if (inScenario) currentScenarioBuffer.push(...writingLines);
          else docElements.push(...writingLines);
        }
        break;
      }

      case 'list': {
        // Render list items as indented paragraphs with bullet/number prefix
        const listItems: string[] = block.metadata?.items ?? block.text.split('\n').filter(Boolean);
        const isOrdered = block.metadata?.ordered ?? false;
        const listParas = listItems.map((item, idx) =>
          new Paragraph({
            children: parseInlineFormatting((isOrdered ? `${idx + 1}. ` : '\u2022  ') + item, {
              font: fontName,
              size: fontSize,
            }),
            spacing: { after: 80, line: lineSpacing },
            alignment: AlignmentType.LEFT,
            indent: { left: convertInchesToTwip(0.25) },
          })
        );
        if (inExercise) currentExerciseBuffer.push(...listParas);
        else if (inScenario) currentScenarioBuffer.push(...listParas);
        else docElements.push(...listParas);
        break;
      }

      case 'table':
        if (block.lines) {
          tableBuffer.push(...block.lines);
        } else {
          tableBuffer.push(block.text);
        }
        break;

      case 'divider':
        if (settings.ornamentalDividers) {
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '✦   ✦   ✦',
                  color: '888888',
                  font: fontName,
                  size: fontSize,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 240, after: 240 },
            })
          );
        } else {
          docElements.push(
            new Paragraph({
              children: [new TextRun({ text: '' })],
              border: {
                bottom: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 6, space: 4 },
              },
              spacing: { before: 120, after: 120 },
            })
          );
        }
        break;

      case 'blank':
        docElements.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { after: 60 },
          })
        );
        break;

      case 'paragraph':
      default:
        if (block.text?.trim()) {
          const p = bodyParagraph(block.text);
          if (inExercise) currentExerciseBuffer.push(p);
          else if (inScenario) currentScenarioBuffer.push(p);
          else docElements.push(p);
        }
        break;
    }

    i++;
  }

  // Flush any lingering buffers at the end of the manuscript
  flushBuffers();

  // ─────────────────────────────────────────────
  // Assemble the Master Document
  // ─────────────────────────────────────────────
  const doc = new Document({
    creator: 'KDP Studio',
    description: 'KDP-formatted manuscript',
    title: settings.title || 'Manuscript',

    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(trimW),
              height: convertInchesToTwip(trimH),
            },
            margin: {
              top: topMargin,
              bottom: bottomMargin,
              left: insideMargin,   // inside (gutter)
              right: outsideMargin, // outside
            },
          },
        },

        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: settings.title || '',
                    font: fontName,
                    size: 18, // 9pt
                    color: '888888',
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
          }),
        },

        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: fontName,
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },

        children: docElements.length > 0 ? docElements : [bodyParagraph('Your formatted manuscript starts here.')],
      },
    ],
  });

  return doc;
}

/**
 * Triggers browser download of the generated DOCX file
 */
export async function downloadDocxFile(
  blocks: ContentBlock[],
  settings: KdpFormatSettings
): Promise<void> {
  const doc = await generateDocx(blocks, settings);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (settings.title || 'manuscript')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
  a.download = `${safeTitle}_KDP_formatted.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
