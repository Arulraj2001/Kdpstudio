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
      spacing: { before: 80, after: 80 },
      border: {
        bottom: { color: '333333', space: 1, style: BorderStyle.SINGLE, size: 6 },
      },
    });
  }

  // Helper: exercise box with grey header (#EEEEEE)
  function exerciseBox(headerText: string, bodyParagraphs: Paragraph[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
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
                      color: '111111',
                    }),
                  ],
                  spacing: { before: 80, after: 80 },
                }),
              ],
              shading: { type: ShadingType.CLEAR, fill: 'EEEEEE' },
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

  // Helper: scenario box with teal header (#1A6B72 for color, #333333 for B&W) and white text
  function scenarioBox(headerText: string, bodyParagraphs: Paragraph[]): Table {
    const isBw = settings.interiorColor === 'bw';
    const headerFill = isBw ? '333333' : '1A6B72';
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
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

  // Helper: converts markdown table rows to native DOCX Table
  function markdownTableToDocx(tableLines: string[]): Table {
    const rows = tableLines
      .filter((line) => !line.match(/^\|[\s\-:]+\|/)) // Remove separator row
      .map((line) =>
        line
          .split('|')
          .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          .map((cell) => cell.trim())
      );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map((cells, rowIndex) =>
        new TableRow({
          children: cells.map(
            (cell) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cell,
                        bold: rowIndex === 0,
                        font: fontName,
                        size: Math.max(16, fontSize - 4),
                      }),
                    ],
                    spacing: { after: 40 },
                  }),
                ],
                shading:
                  rowIndex === 0
                    ? { type: ShadingType.CLEAR, fill: 'EEEEEE' }
                    : { type: ShadingType.CLEAR, fill: 'FFFFFF' },
                margins: {
                  top: convertInchesToTwip(0.06),
                  bottom: convertInchesToTwip(0.06),
                  left: convertInchesToTwip(0.08),
                  right: convertInchesToTwip(0.08),
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
            text: cleanText(block.text),
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 480, after: 240 },
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
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 360 },
          })
        );
        break;

      case 'front_matter':
        docElements.push(new Paragraph({ children: [new PageBreak()] }));
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(block.text),
                bold: true,
                font: fontName,
                size: 28, // 14pt
                allCaps: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 720, after: 360 },
          })
        );
        break;

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

      case 'chapter':
        if (settings.chapterPageBreaks) {
          docElements.push(new Paragraph({ children: [new PageBreak()] }));
        }
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText(block.text),
                bold: true,
                font: fontName,
                size: 36, // 18pt
              }),
            ],
            spacing: { before: 720, after: 360 },
            border: {
              bottom: { color: '333333', style: BorderStyle.SINGLE, size: 6, space: 6 },
            },
          })
        );
        break;

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
        if (settings.formatModelResponses) {
          const p = new Paragraph({
            children: [
              new TextRun({
                text: 'MODEL RESPONSE',
                bold: true,
                font: fontName,
                size: Math.max(16, fontSize - 4),
                allCaps: true,
                color: '666666',
              }),
            ],
            spacing: { before: 180, after: 60 },
            border: {
              left: { color: 'AAAAAA', style: BorderStyle.SINGLE, size: 18, space: 8 },
            },
          });
          if (inScenario) currentScenarioBuffer.push(p);
          else docElements.push(p);
        } else {
          // Toggle off: render as plain bold heading
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
        if (settings.formatDebriefBlocks) {
          const p = new Paragraph({
            children: [
              new TextRun({
                text: 'DEBRIEF',
                bold: true,
                font: fontName,
                size: Math.max(16, fontSize - 4),
                allCaps: true,
                color: '555555',
              }),
            ],
            spacing: { before: 180, after: 60 },
            border: {
              left: { color: '888888', style: BorderStyle.SINGLE, size: 18, space: 8 },
            },
          });
          if (inScenario) currentScenarioBuffer.push(p);
          else docElements.push(p);
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

      case 'reflection':
        if (settings.formatReflectionPrompts) {
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Reflection Prompt',
                  bold: true,
                  italics: true,
                  font: fontName,
                  size: fontSize,
                }),
              ],
              spacing: { before: 240, after: 80 },
              shading: { type: ShadingType.CLEAR, fill: 'F5F5F5' },
            })
          );
        } else {
          docElements.push(
            new Paragraph({
              children: [new TextRun({ text: cleanText(block.text), bold: true, font: fontName, size: fontSize })],
              spacing: { before: 180, after: 60 },
            })
          );
        }
        break;

      case 'action': {
        const actionPara = new Paragraph({
          children: [
            new TextRun({
              text: cleanText(block.text),
              bold: true,
              font: fontName,
              size: fontSize + 2,
            }),
          ],
          spacing: { before: 200, after: 100 },
        });
        if (inExercise) currentExerciseBuffer.push(actionPara);
        else if (inScenario) currentScenarioBuffer.push(actionPara);
        else docElements.push(actionPara);
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
        docElements.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            border: {
              bottom: { color: 'CCCCCC', style: BorderStyle.SINGLE, size: 6, space: 4 },
            },
            spacing: { before: 120, after: 120 },
          })
        );
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
