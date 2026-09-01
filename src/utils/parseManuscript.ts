import { BlockType, ContentBlock } from '../types/formatter';

export const BLOCK_TYPES: Record<string, BlockType> = {
  TITLE: 'title',
  SUBTITLE: 'subtitle',
  FRONT_MATTER: 'front_matter',
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
  TABLE: 'table',
  WRITING_LINES: 'lines',
  PARAGRAPH: 'paragraph',
  DIVIDER: 'divider',
  BLANK: 'blank',
};

/**
 * Detects the block type of an individual line with 15-level precedence rules
 */
export function detectBlockType(line: string, nextLine?: string): BlockType {
  const trimmed = line.trim();

  // 1. Markdown H1
  if (/^#\s+/.test(line)) {
    const content = line.replace(/^#\s+/, '').trim();
    if (/^PART\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d+)/i.test(content)) {
      return BLOCK_TYPES.PART_HEADER;
    }
    return BLOCK_TYPES.TITLE;
  }

  // 2. Front Matter Detection (e.g. ## COPYRIGHT PAGE, ## DISCLAIMER, ## CONTENTS, ## DEDICATION)
  if (
    /^##?\s+(COPYRIGHT|DISCLAIMER|CONTENTS|TABLE OF CONTENTS|DEDICATION|TITLE PAGE|ABOUT THE AUTHOR|PRAISE FOR|ACKNOWLEDGEMENTS?|PREFACE)\b/i.test(
      trimmed
    )
  ) {
    return BLOCK_TYPES.FRONT_MATTER;
  }

  // 3. Markdown H2 = chapter
  if (/^##\s+/.test(line)) {
    return BLOCK_TYPES.CHAPTER_HEADING;
  }

  // 4. Markdown H3 = section
  if (/^###\s+/.test(line)) {
    return BLOCK_TYPES.SECTION_HEADING;
  }

  // 5. Markdown H4 = subsection
  if (/^####\s+/.test(line)) {
    return BLOCK_TYPES.SUBSECTION;
  }

  // 6. Exercise block
  if (
    /^(EXERCISE|Exercise)\s+\d+(\.\d+)?[:—]/i.test(trimmed) ||
    /^\*\*(EXERCISE|Exercise)\s+\d+(\.\d+)?/i.test(trimmed)
  ) {
    return BLOCK_TYPES.EXERCISE_HEADER;
  }

  // 7. Scenario block
  if (
    /^(SCENARIO\s+[A-Z]:?|Scenario\s+[A-Z]:?)/i.test(trimmed) ||
    /^\*\*(SCENARIO\s+[A-Z])/i.test(trimmed)
  ) {
    return BLOCK_TYPES.SCENARIO_HEADER;
  }

  // 8. Model response
  if (
    /^(MODEL RESPONSE|Model Response|---\s*\*\*Model)/i.test(trimmed) ||
    /^\*\*(MODEL RESPONSE|Model Response)/i.test(trimmed)
  ) {
    return BLOCK_TYPES.MODEL_RESPONSE;
  }

  // 9. Debrief
  if (
    /^(DEBRIEF|Debrief)[:—]/i.test(trimmed) ||
    /^\*\*(DEBRIEF|Debrief)/i.test(trimmed)
  ) {
    return BLOCK_TYPES.DEBRIEF;
  }

  // 10. Reflection prompt
  if (/^(REFLECTION PROMPT|Reflection Prompt|Reflection prompt)/i.test(trimmed)) {
    return BLOCK_TYPES.REFLECTION;
  }

  // 11. Action plan
  if (/^(ACTION PLAN|Action Plan)/i.test(trimmed)) {
    return BLOCK_TYPES.ACTION_PLAN;
  }

  // 12. Table row
  if (/^\|/.test(trimmed) && /\|/.test(trimmed)) {
    return BLOCK_TYPES.TABLE;
  }

  // 13. Writing lines (3+ underscores, escaped underscores \_\_\_\_, or continuous dashes)
  if (
    /^(\\_{1,}|_{1,}|\s){3,}$/.test(trimmed) ||
    /^_{3,}$/.test(trimmed) ||
    /^\\_{3,}/.test(trimmed) ||
    /^[_\-—\s]{4,}$/.test(trimmed)
  ) {
    return BLOCK_TYPES.WRITING_LINES;
  }

  // 14. Horizontal rule
  if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
    return BLOCK_TYPES.DIVIDER;
  }

  // 15. Empty line
  if (trimmed === '') {
    return BLOCK_TYPES.BLANK;
  }

  // Non-markdown plain text fallback heuristics:
  if (/^(CHAPTER\s+\d+|Chapter\s+\d+)[:\s—]/i.test(trimmed)) {
    return BLOCK_TYPES.CHAPTER_HEADING;
  }
  if (/^PART\s+(ONE|TWO|THREE|FOUR|FIVE|\d+)[:\s—]/i.test(trimmed)) {
    return BLOCK_TYPES.PART_HEADER;
  }

  // 16. Default: paragraph
  return BLOCK_TYPES.PARAGRAPH;
}

/**
 * Parses raw manuscript text into structured and grouped ContentBlocks
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

    // Contextual refinement for Subtitle following Title (before front matter / chapters)
    if (hasTitle && !hasSubtitle && /^##\s+/.test(line)) {
      const content = line.replace(/^##\s+/, '').trim();
      if (
        !/^(CHAPTER\s+\d+|Chapter\s+\d+|PART\s+|Part\s+|\d+\.)/i.test(content) &&
        !/^(COPYRIGHT|DISCLAIMER|CONTENTS|TABLE OF CONTENTS|DEDICATION)\b/i.test(content)
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

    // 1. Table Grouping: Accumulate consecutive table rows
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

    // 2. Headings & Container Boundaries
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

    // Check if new major structural boundary breaks active container
    if (['title', 'part', 'chapter', 'section', 'subsection', 'front_matter', 'divider'].includes(type)) {
      inExercise = false;
      inScenario = false;
    }

    // 3. Writing lines detection (including within exercises or body text)
    if (type === 'lines') {
      blocks.push({
        id: `block-${++blockCounter}`,
        type: 'lines',
        text: line,
      });
      i++;
      continue;
    }

    // 4. Paragraph Grouping
    if (type === 'paragraph') {
      const paraLines: string[] = [line.trim()];
      while (
        i + 1 < rawLines.length &&
        detectBlockType(rawLines[i + 1]) === 'paragraph' &&
        rawLines[i + 1].trim() !== ''
      ) {
        i++;
        paraLines.push(rawLines[i].trim());
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

    // 5. Standalone Special Blocks (Front Matter, Model Response, Debrief, Reflection, Divider, Blank)
    blocks.push({
      id: `block-${++blockCounter}`,
      type,
      text: line,
    });

    i++;
  }

  return blocks;
}

/**
 * Auto-extracts Title and Subtitle from manuscript blocks
 */
export function extractAutoMetadata(blocks: ContentBlock[]): { title: string; subtitle: string } {
  let title = '';
  let subtitle = '';

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'title' && !title) {
      title = block.text.replace(/^#\s*/, '').replace(/\*\*/g, '').trim();
      // If next block is a subtitle or short non-heading paragraph, use as subtitle
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

  // Fallback to first chapter heading if no title
  if (!title) {
    const firstChap = blocks.find((b) => b.type === 'chapter');
    if (firstChap) {
      title = firstChap.text.replace(/^##\s*/, '').replace(/\*\*/g, '').trim();
    }
  }

  return { title, subtitle };
}
