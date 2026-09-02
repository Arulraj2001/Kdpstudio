import { BlockType, ContentBlock, TocItem } from '../types/formatter';

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

export const BLOCK_TYPES: Record<string, BlockType> = {
  TITLE: 'title',
  SUBTITLE: 'subtitle',
  FRONT_MATTER: 'front_matter',
  TOC: 'toc',
  PART_HEADER: 'part',
  CHAPTER_HEADING: 'chapter',
  SECTION_HEADING: 'section',
  SUBSECTION: 'subsection',
  EXERCISE_HEADER: 'exercise_header',
  EXERCISE_BODY: 'exercise_body',
  SCENARIO_HEADER: 'scenario_header',
  SCENARIO_BODY: 'scenario_body',
  MODEL_RESPONSE: 'model_response',
  DEBRIEF: 'debrief',
  REFLECTION: 'reflection',
  ACTION_PLAN: 'action',
  LIST: 'list',
  TABLE: 'table',
  WRITING_LINES: 'lines',
  PARAGRAPH: 'paragraph',
  DIVIDER: 'divider',
  BLANK: 'blank',
};

// Table of contents keyword pattern
const TOC_PATTERN =
  /^##?\s*(CONTENTS|TABLE OF CONTENTS)\b/i;

// Front matter keyword pattern — centralised so detectStructure can also reference it
const FRONT_MATTER_PATTERN =
  /^##?\s+(COPYRIGHT|DISCLAIMER|DEDICATION|TITLE PAGE|ABOUT THE AUTHOR|PRAISE FOR|ACKNOWLEDGEMENTS?|PREFACE|A NOTE TO THE READER|NOTE TO THE READER|HOW TO USE|INTRODUCTION[:—]?|PROLOGUE|EPILOGUE|AFTERWORD|APPENDICES|APPENDIX)\b/i;

/**
 * Calculates realistic book page numbers for every chapter, part, front matter, and appendix.
 */
export function calculateBookPagination(blocks: ContentBlock[]): Map<string, number> {
  const pageMap = new Map<string, number>();
  let currentPage = 1;

  // Title page occupies page 1
  const hasTitle = blocks.some((b) => b.type === 'title');
  if (hasTitle) {
    currentPage = 2;
  }

  for (const block of blocks) {
    if (block.type === 'toc') {
      const itemCount = block.metadata?.items?.length ?? 12;
      const tocPages = itemCount > 18 ? 2 : 1;
      pageMap.set('toc', currentPage);
      currentPage += tocPages;
      if (currentPage % 2 === 0) {
        currentPage += 1; // standard KDP odd-page start for main content
      }
    } else if (block.type === 'front_matter') {
      const clean = cleanText(block.text);
      pageMap.set(clean.toLowerCase(), currentPage);
      pageMap.set(block.id, currentPage);
      currentPage += 1;
    } else if (block.type === 'part') {
      const clean = cleanText(block.text);
      if (currentPage % 2 === 0) currentPage += 1;
      pageMap.set(clean.toLowerCase(), currentPage);
      pageMap.set(block.id, currentPage);
      currentPage += 1;
    } else if (block.type === 'chapter') {
      const clean = cleanText(block.text);
      pageMap.set(clean.toLowerCase(), currentPage);
      pageMap.set(block.id, currentPage);

      const match = clean.match(/^(CHAPTER\s+\d+|Chapter\s+\d+)/i);
      if (match) {
        pageMap.set(match[1].toLowerCase(), currentPage);
      }
    }

    // Advance estimated pages based on block density
    const words = block.text ? block.text.split(/\s+/).filter(Boolean).length : 0;
    if (block.type === 'table') {
      currentPage += 0.5;
    } else if (block.type === 'lines') {
      const count = block.metadata?.lineCount ?? 1;
      currentPage += count * 0.05;
    } else if (block.type === 'exercise_header' || block.type === 'scenario_header') {
      currentPage += 0.25;
    } else if (words > 0) {
      currentPage += words / 280; // ~280 words per page average
    }
  }

  return pageMap;
}

/**
 * Detects the block type of an individual line with high-precedence semantic matching.
 * Fixed order:
 *   H1 → Front Matter → Workbook Elements → Table → Divider (BEFORE writing-lines) →
 *   Writing Lines (underscore-only) → List Items → Blank → H2/H3/H4 → Fallbacks → Paragraph
 */
export function detectBlockType(line: string, _nextLine?: string): BlockType {
  const trimmed = line.trim();

  // 1. Markdown H1
  if (/^#\s+/.test(line)) {
    const content = line.replace(/^#\s+/, '').trim();
    if (/^PART\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d+)/i.test(content)) {
      return BLOCK_TYPES.PART_HEADER;
    }
    return BLOCK_TYPES.TITLE;
  }

  // 1.5 Table of Contents
  if (TOC_PATTERN.test(trimmed)) {
    return BLOCK_TYPES.TOC;
  }

  // 2. Front & Back Matter — checked BEFORE generic ## so "## INTRODUCTION:" stays front_matter
  if (FRONT_MATTER_PATTERN.test(trimmed)) {
    return BLOCK_TYPES.FRONT_MATTER;
  }

  // 3. Special Workbook Elements — checked BEFORE generic ### / ## headings

  // Exercise block (handles `### EXERCISE 1.1`, `**Exercise 1.1**`, `EXERCISE 1.1:`)
  if (
    /^(###?\s+|\*\*)?(EXERCISE|Exercise)\s+\d+(\.\d+)?[:—\s]/i.test(trimmed) ||
    /^(###?\s+)?\*\*(EXERCISE|Exercise)\s+\d+(\.\d+)?/i.test(trimmed)
  ) {
    return BLOCK_TYPES.EXERCISE_HEADER;
  }

  // Scenario block (handles `### SCENARIO A`, `**Scenario A**`, `SCENARIO A:`)
  if (
    /^(###?\s+|\*\*)?(SCENARIO\s+[A-Z]:?|Scenario\s+[A-Z]:?)/i.test(trimmed) ||
    /^(###?\s+)?\*\*(SCENARIO\s+[A-Z])/i.test(trimmed)
  ) {
    return BLOCK_TYPES.SCENARIO_HEADER;
  }

  // Model response (handles `**Model Response:**`, `MODEL RESPONSE:`, `--- **Model...`)
  if (
    /^(MODEL RESPONSE|Model Response|---\s*\*\*Model)/i.test(trimmed) ||
    /^\*\*(MODEL RESPONSE|Model Response)/i.test(trimmed)
  ) {
    return BLOCK_TYPES.MODEL_RESPONSE;
  }

  // Debrief (handles `**Debrief:**`, `DEBRIEF:`)
  if (
    /^(DEBRIEF|Debrief)[:—]/i.test(trimmed) ||
    /^\*\*(DEBRIEF|Debrief)/i.test(trimmed)
  ) {
    return BLOCK_TYPES.DEBRIEF;
  }

  // Reflection prompt (handles `### REFLECTION PROMPT`, `**Reflection Prompt:**`)
  if (/^(###?\s+|\*\*)?(REFLECTION PROMPT|Reflection Prompt|Reflection prompt)/i.test(trimmed)) {
    return BLOCK_TYPES.REFLECTION;
  }

  // Action plan (handles `### ACTION PLAN: CHAPTER 1`, `ACTION PLAN:`)
  if (/^(###?\s+|\*\*)?(ACTION PLAN|Action Plan|Action plan)/i.test(trimmed)) {
    return BLOCK_TYPES.ACTION_PLAN;
  }

  // Key takeaways / Summary (handles `### KEY TAKEAWAYS`, `KEY TAKEAWAYS:`, `SUMMARY:`, `IN SUMMARY:`)
  if (
    /^(###?\s+|\*\*)?(KEY TAKEAWAYS|Key Takeaways|Key takeaways|SUMMARY|Summary|IN SUMMARY|In Summary)[:—\s]/i.test(trimmed) ||
    /^(###?\s+)?\*\*(KEY TAKEAWAYS|Key Takeaways|SUMMARY|Summary)\*\*/i.test(trimmed)
  ) {
    return 'key_takeaways';
  }

  // Blockquote / pull quote (handles `> quote text`)
  if (/^>\s+/.test(trimmed)) {
    return 'quote';
  }

  // 4. Markdown Table row
  if (/^\|/.test(trimmed) && /\|/.test(trimmed)) {
    return BLOCK_TYPES.TABLE;
  }

  // 5. Horizontal rule — MUST come BEFORE writing-lines so `---` is never swallowed
  if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
    return BLOCK_TYPES.DIVIDER;
  }

  // 6. Writing lines — underscore-only (dashes handled as dividers above)
  //    Handles both plain underscores (___) and markdown-escaped (\_\_\_)
  if (
    /^(\\_+|\s){3,}$/.test(trimmed) ||   // escaped backslash-underscore sequences
    /^_{3,}$/.test(trimmed) ||             // plain underscores ___
    /^\\_+/.test(trimmed)                   // line starting with \_
  ) {
    return BLOCK_TYPES.WRITING_LINES;
  }

  // 7. List items — unordered (-, *, +), checklist (- [ ]), or ordered (1., 2., etc.)
  if (/^[-*+]\s+(\[[ xX]\]\s+)?\S/.test(trimmed) || /^\d+\.\s+\S/.test(trimmed)) {
    return BLOCK_TYPES.LIST;
  }

  // 8. Empty line
  if (trimmed === '') {
    return BLOCK_TYPES.BLANK;
  }

  // 9. Generic Markdown Headings (lower priority than workbook elements above)
  if (/^##\s+/.test(line)) {
    return BLOCK_TYPES.CHAPTER_HEADING;
  }
  if (/^###\s+/.test(line)) {
    return BLOCK_TYPES.SECTION_HEADING;
  }
  if (/^####\s+/.test(line)) {
    return BLOCK_TYPES.SUBSECTION;
  }

  // 10. Plain text fallback heuristics
  if (/^(CHAPTER\s+\d+|Chapter\s+\d+)[:\s—]/i.test(trimmed)) {
    return BLOCK_TYPES.CHAPTER_HEADING;
  }
  if (/^PART\s+(ONE|TWO|THREE|FOUR|FIVE|\d+)[:\s—]/i.test(trimmed)) {
    return BLOCK_TYPES.PART_HEADER;
  }

  // 11. Default: paragraph
  return BLOCK_TYPES.PARAGRAPH;
}

/**
 * Parses raw manuscript text into structured and grouped ContentBlocks.
 */
export function detectStructure(rawText: string): ContentBlock[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const rawLines = rawText.split(/\r?\n/);
  const blocks: ContentBlock[] = [];

  let i = 0;
  let blockCounter = 0;
  let hasTitle = false;
  let hasSubtitle = false;

  let inExercise = false;
  let inScenario = false;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const nextLine = i + 1 < rawLines.length ? rawLines[i + 1] : undefined;
    let type = detectBlockType(line, nextLine);

    // Contextual refinement: first ## line after the title that detectBlockType classified as
    // CHAPTER_HEADING (i.e. not front_matter, not part) and has no chapter/part markers
    // → promote to subtitle. Front matter is already handled by detectBlockType, so only
    // generic chapter headings that look like subtitles are promoted here.
    if (hasTitle && !hasSubtitle && /^##\s+/.test(line) && type === BLOCK_TYPES.CHAPTER_HEADING) {
      const content = line.replace(/^##\s+/, '').trim();
      if (
        !/^(CHAPTER\s+\d+|Chapter\s+\d+|PART\s+|Part\s+|\d+\.)/i.test(content) &&
        !/^(COPYRIGHT|DISCLAIMER|CONTENTS|TABLE OF CONTENTS|DEDICATION|A NOTE TO THE READER|NOTE TO THE READER|HOW TO USE|INTRODUCTION|PROLOGUE|EPILOGUE|APPENDIX)/i.test(content)
      ) {
        type = 'subtitle';
        hasSubtitle = true;
      }
    }

    if (type === 'title') {
      hasTitle = true;
    } else if (type === 'chapter' || type === 'part' || type === 'front_matter') {
      hasSubtitle = true;
    }

    // 0. Table of Contents Grouping: accumulate all entries under ## CONTENTS
    if (type === 'toc') {
      const tocLines: string[] = [];
      i++; // advance past ## CONTENTS line

      while (i < rawLines.length) {
        const curLine = rawLines[i];
        const curTrimmed = curLine.trim();

        // Break on explicit horizontal rule (--- or ***)
        if (/^---+$/.test(curTrimmed) || /^\*\*\*+$/.test(curTrimmed)) {
          i++; // consume divider
          break;
        }

        // Break on major body header: # CHAPTER or ## CHAPTER or # PART ONE (if followed by body text)
        if (/^#\s+(CHAPTER\s+\d+|Chapter\s+\d+)/i.test(curTrimmed) || /^##\s+(CHAPTER\s+\d+|Chapter\s+\d+)/i.test(curTrimmed)) {
          break;
        }

        // Break on narrative paragraphs (long lines with multiple sentences)
        if (curTrimmed.length > 120 && curTrimmed.includes('. ')) {
          break;
        }

        if (curTrimmed !== '') {
          tocLines.push(curTrimmed);
        }
        i++;
      }

      const items: TocItem[] = tocLines.map((tLine) => {
        const clean = cleanText(tLine);
        const isPart = /^(\*\*|__)?(PART\s+[A-Z0-9IVXLCDM]+|PART\s+[A-Za-z]+|Part\s+[A-Za-z0-9]+)[:\s—]/i.test(tLine) ||
                       /^PART\s+[A-Z0-9IVXLCDM]+/i.test(clean);
        const isAppendix = /^(APPENDICES|APPENDIX\s+[A-Z0-9]+|Appendix\s+[A-Z0-9]+)[:\s—]/i.test(clean) ||
                           clean.toUpperCase() === 'APPENDICES';
        const isFrontMatter = /^(A NOTE TO THE READER|NOTE TO THE READER|HOW TO USE|INTRODUCTION|PREFACE|DEDICATION|ABOUT THE AUTHOR|ACKNOWLEDGEMENTS?|FOREWORD|AFTERWORD)[:\s—]?/i.test(clean);

        return {
          title: clean,
          isPart,
          isAppendix,
          isFrontMatter,
          level: isPart || clean.toUpperCase() === 'APPENDICES' ? 1 : 2,
          pageNumber: undefined,
        };
      });

      blocks.push({
        id: `block-${++blockCounter}`,
        type: 'toc',
        text: 'TABLE OF CONTENTS',
        metadata: { items },
      });
      continue;
    }

    // 1. Table Grouping: accumulate consecutive table rows into one block
    if (type === 'table') {
      const tableLines: string[] = [line];
      while (i + 1 < rawLines.length && detectBlockType(rawLines[i + 1]) === 'table') {
        i++;
        tableLines.push(rawLines[i]);
      }
      blocks.push({
        id: `block-${++blockCounter}`,
        type: 'table',
        text: tableLines.join('\n'),
        lines: tableLines,
      });
      i++;
      continue;
    }

    // 2. Writing Lines Grouping: accumulate consecutive `___` lines into one block
    if (type === 'lines') {
      let lineCount = 1;
      while (i + 1 < rawLines.length && detectBlockType(rawLines[i + 1]) === 'lines') {
        i++;
        lineCount++;
      }
      blocks.push({
        id: `block-${++blockCounter}`,
        type: 'lines',
        text: line,
        metadata: { lineCount },
      });
      i++;
      continue;
    }

    // 3. List Item Grouping: accumulate consecutive list items into one block
    if (type === 'list') {
      const firstTrimmed = line.trim();
      const isOrdered = /^\d+\.\s+/.test(firstTrimmed);
      const items: string[] = [firstTrimmed.replace(/^[-*+]\s+|^\d+\.\s+/, '')];
      while (i + 1 < rawLines.length && detectBlockType(rawLines[i + 1]) === 'list') {
        i++;
        items.push(rawLines[i].trim().replace(/^[-*+]\s+|^\d+\.\s+/, ''));
      }
      const listBlockType = inExercise ? 'exercise_body' : inScenario ? 'scenario_body' : 'list';
      blocks.push({
        id: `block-${++blockCounter}`,
        type: listBlockType === 'list' ? 'list' : listBlockType,
        text: items.join('\n'),
        metadata: { isList: true, ordered: isOrdered, items },
      });
      i++;
      continue;
    }

    // 4. Exercise / Scenario Headers open a container context
    if (type === 'exercise_header') {
      inExercise = true;
      inScenario = false;
      blocks.push({
        id: `block-${++blockCounter}`,
        type: 'exercise_header',
        text: line.trim(),
      });
      i++;
      continue;
    }

    if (type === 'scenario_header') {
      inScenario = true;
      inExercise = false;
      blocks.push({
        id: `block-${++blockCounter}`,
        type: 'scenario_header',
        text: line.trim(),
      });
      i++;
      continue;
    }

    // Major structural boundary resets active container
    // model_response / debrief / reflection are self-contained typed blocks and
    // signal the natural end of a preceding exercise or scenario body.
    if (['title', 'part', 'chapter', 'section', 'subsection', 'front_matter', 'divider',
         'model_response', 'debrief', 'reflection', 'key_takeaways', 'action'].includes(type)) {
      inExercise = false;
      inScenario = false;
    }

    // 5. Model response: emit header block + extract inline body text after the colon
    if (type === 'model_response') {
      blocks.push({
        id: `block-${++blockCounter}`,
        type: 'model_response',
        text: line.trim(),
      });
      // Extract any inline body text appearing after "MODEL RESPONSE:" on the same line
      const inlineBody = line.trim()
        .replace(/^(---\s*\*\*Model\s+Response\*\*:?|MODEL RESPONSE|Model Response)[:—]?\s*/i, '')
        .replace(/^\*\*/, '').replace(/\*\*$/, '')
        .trim();
      if (inlineBody && inlineBody.length > 2) {
        blocks.push({
          id: `block-${++blockCounter}`,
          type: inScenario ? 'scenario_body' : inExercise ? 'exercise_body' : 'paragraph',
          text: inlineBody,
          metadata: { parentType: 'model_response' },
        });
      }
      i++;
      continue;
    }

    // 6. Paragraph Grouping — consecutive narrative lines merge, but distinct metadata/italic lines stay separated
    if (type === 'paragraph') {
      const isStandaloneMeta = (txt: string) =>
        /^(\*.*?\*|\[.*?\]|ISBN:|First edition|Published in|Copyright ©|All rights reserved|For permissions)/i.test(txt.trim()) ||
        txt.trim().length < 40 && /^(\*|_|—)/.test(txt.trim());

      const isCurrentMeta = isStandaloneMeta(line);
      const paraLines: string[] = [line.trim()];

      // Only merge if not a standalone metadata line on title/copyright page
      if (!isCurrentMeta) {
        while (
          i + 1 < rawLines.length &&
          detectBlockType(rawLines[i + 1]) === 'paragraph' &&
          rawLines[i + 1].trim() !== '' &&
          !isStandaloneMeta(rawLines[i + 1])
        ) {
          i++;
          paraLines.push(rawLines[i].trim());
        }
      }

      const combinedText = paraLines.join(' ');

      if (inExercise) {
        blocks.push({
          id: `block-${++blockCounter}`,
          type: 'exercise_body',
          text: combinedText,
        });
      } else if (inScenario) {
        blocks.push({
          id: `block-${++blockCounter}`,
          type: 'scenario_body',
          text: combinedText,
        });
      } else {
        blocks.push({
          id: `block-${++blockCounter}`,
          type: 'paragraph',
          text: combinedText,
        });
      }
      i++;
      continue;
    }

    // 7. All other block types emitted as-is
    blocks.push({
      id: `block-${++blockCounter}`,
      type,
      text: line,
    });

    i++;
  }

  // Post-processing: Calculate realistic book pagination for TOC blocks
  const paginationMap = calculateBookPagination(blocks);

  for (const b of blocks) {
    if (b.type === 'toc' && Array.isArray(b.metadata?.items)) {
      let runningPage = 7;
      b.metadata.items.forEach((item: TocItem, idx: number) => {
        const cleanKey = item.title.toLowerCase();
        const directMatch = paginationMap.get(cleanKey);
        const chapterMatch = item.title.match(/^(CHAPTER\s+\d+|Chapter\s+\d+)/i);
        const numMatch = chapterMatch ? paginationMap.get(chapterMatch[1].toLowerCase()) : undefined;

        if (directMatch !== undefined) {
          item.pageNumber = Math.max(1, Math.round(directMatch));
          runningPage = item.pageNumber + 2;
        } else if (numMatch !== undefined) {
          item.pageNumber = Math.max(1, Math.round(numMatch));
          runningPage = item.pageNumber + 2;
        } else {
          item.pageNumber = runningPage;
          runningPage += item.isPart ? 2 : Math.max(3, Math.round(3 + (idx % 3)));
        }
      });
    }
  }

  return blocks;
}

/**
 * Auto-extracts Title and Subtitle from manuscript blocks.
 */
export function extractAutoMetadata(blocks: ContentBlock[]): { title: string; subtitle: string } {
  let title = '';
  let subtitle = '';

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'title' && !title) {
      title = block.text.replace(/^#\s*/, '').replace(/\*\*/g, '').trim();
      // Look ahead for subtitle
      for (let j = i + 1; j < Math.min(blocks.length, i + 4); j++) {
        const next = blocks[j];
        if (next.type === 'subtitle') {
          subtitle = next.text.replace(/^##\s*/, '').replace(/\*\*/g, '').trim();
          break;
        } else if (next.type === 'paragraph' && next.text.length > 0 && next.text.length < 160 && !subtitle) {
          subtitle = next.text.replace(/^##\s*/, '').replace(/\*\*/g, '').trim();
          break;
        } else if (next.type === 'part' || next.type === 'chapter' || next.type === 'front_matter') {
          break;
        }
      }
      break;
    }
  }

  // Fallback to first chapter heading if no title found
  if (!title) {
    const firstChap = blocks.find((b) => b.type === 'chapter');
    if (firstChap) {
      title = firstChap.text.replace(/^##\s*/, '').replace(/\*\*/g, '').trim();
    }
  }

  return { title, subtitle };
}
