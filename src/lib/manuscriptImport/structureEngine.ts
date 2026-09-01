/**
 * KDP Studio — Manuscript Structure & Chapter Recognition Engine
 * Intelligently identifies Front Matter, Chapters (Roman numerals, named headings), and Back Matter.
 */

import { sanitizeManuscriptHtml } from './sanitizer';

export interface ParsedSection {
  id: string;
  type: 'front-matter' | 'chapter' | 'back-matter';
  subtype?: string; // 'dedication' | 'copyright' | 'preface' | 'disclaimer' | 'toc' | 'about-author' | 'acknowledgments' | 'appendix'
  title: string;
  content: string; // HTML string
  wordCount: number;
}

export interface ParsedManuscript {
  title?: string;
  subtitle?: string;
  author?: string;
  sections: ParsedSection[];
  chapters: { id: string; title: string; content: string; wordCount: number; order: number }[];
  frontMatter: {
    dedication?: string;
    copyrightText?: string;
    preface?: string;
    disclaimer?: string;
  };
  backMatter: {
    aboutAuthor?: string;
    otherBooks?: string;
    appendix?: string;
  };
  totalWordCount: number;
  totalChapters: number;
}

// Comprehensive regex patterns for chapter & section identification
const ROMAN_NUMERALS = '(?:X{0,3})(?:IX|IV|V?I{0,3})';
const WORD_NUMBERS = '(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)';

const CHAPTER_PATTERNS = [
  new RegExp(`^chapter\\s+(?:\\d+|${ROMAN_NUMERALS}|${WORD_NUMBERS})(?:[:.-]\\s*.*)?$`, 'i'),
  new RegExp(`^ch\\.\\s*(?:\\d+|${ROMAN_NUMERALS})(?:[:.-]\\s*.*)?$`, 'i'),
  new RegExp(`^part\\s+(?:\\d+|${ROMAN_NUMERALS}|${WORD_NUMBERS})(?:[:.-]\\s*.*)?$`, 'i'),
  new RegExp(`^act\\s+(?:\\d+|${ROMAN_NUMERALS})(?:[:.-]\\s*.*)?$`, 'i'),
  new RegExp(`^book\\s+(?:\\d+|${ROMAN_NUMERALS})(?:[:.-]\\s*.*)?$`, 'i'),
  /^prologue(?:[:.-]\s*.*)?$/i,
  /^epilogue(?:[:.-]\s*.*)?$/i,
  /^introduction(?:[:.-]\s*.*)?$/i,
  /^preface(?:[:.-]\s*.*)?$/i,
  /^foreword(?:[:.-]\s*.*)?$/i,
  /^afterword(?:[:.-]\s*.*)?$/i,
  /^dedication$/i,
  /^acknowledg(?:e)?ments$/i,
  /^about the author$/i,
  /^copyright(?:\s+page)?$/i,
  /^disclaimer$/i,
  /^contents$/i,
  /^table of contents$/i,
  /^a note to the reader$/i,
  /^how to use this (?:work)?book$/i,
  /^appendix\s+[a-z0-9](?:[:.-]\s*.*)?$/i,
  /^appendices$/i,
  new RegExp(`^(?:${ROMAN_NUMERALS})\\.\\s+[A-Z]`, 'i'), // e.g. "IV. The Awakening"
  /^\d+\.\s+[A-Za-z]/, // e.g. "1. The Awakening"
  /^\d+\s*[-—]\s*[A-Za-z]/, // e.g. "1 - The Awakening"
];

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 90) return false;
  return CHAPTER_PATTERNS.some((p) => p.test(trimmed));
}

function classifySectionType(title: string): { type: 'front-matter' | 'chapter' | 'back-matter'; subtype?: string } {
  const clean = title.toLowerCase().trim();
  if (clean.includes('dedication')) return { type: 'front-matter', subtype: 'dedication' };
  if (clean.includes('copyright')) return { type: 'front-matter', subtype: 'copyright' };
  if (clean.includes('disclaimer')) return { type: 'front-matter', subtype: 'disclaimer' };
  if (clean.includes('contents') || clean.includes('table of contents')) return { type: 'front-matter', subtype: 'toc' };
  if (clean.includes('note to the reader') || clean.includes('preface') || clean.includes('foreword') || clean.includes('how to use this')) {
    return { type: 'front-matter', subtype: 'preface' };
  }
  if (clean.includes('about the author') || clean.includes('author bio')) return { type: 'back-matter', subtype: 'about-author' };
  if (clean.includes('acknowledg') || clean.includes('afterword')) return { type: 'back-matter', subtype: 'acknowledgments' };
  if (clean.includes('appendix') || clean.includes('appendices')) return { type: 'back-matter', subtype: 'appendix' };
  if (clean.includes('other books') || clean.includes('also by') || clean.includes('resources')) return { type: 'back-matter', subtype: 'other-books' };
  return { type: 'chapter' };
}

function countWords(str: string): number {
  const clean = str.replace(/<[^>]+>/g, ' ').replace(/[^\w\s-]/g, ' ');
  return clean.split(/\s+/).filter((w) => w.length > 0).length;
}

function plainTextToParagraphsHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0)
    .map((p) => {
      const trimmed = p.trim();
      if (trimmed === '* * *' || trimmed === '***' || trimmed === '---' || trimmed === '— — —') {
        return '<hr class="scene-break" />';
      }
      return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
    })
    .join('');
}

/**
 * Parses HTML or text into structured chapters & sections
 */
export function analyzeManuscriptStructure(htmlOrText: string, fallbackTitle: string = 'My Book'): ParsedManuscript {
  let isHtml = /<[a-z][\s\S]*>/i.test(htmlOrText);
  let rawContent = htmlOrText;

  const sections: ParsedSection[] = [];
  const frontMatter: ParsedManuscript['frontMatter'] = {};
  const backMatter: ParsedManuscript['backMatter'] = {};
  let detectedTitle = fallbackTitle;
  let detectedSubtitle: string | undefined;

  if (isHtml) {
    // Split HTML by H1 / H2 tags only (H3 subheadings remain inside the chapter!)
    const splitRegex = /(<h[1-2][^>]*>[\s\S]*?<\/h[1-2]>)/gi;
    const parts = rawContent.split(splitRegex);

    let currentTitle = '';
    let currentHtmlBuffer: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const headingMatch = part.match(/<h[1-2][^>]*>([\s\S]*?)<\/h[1-2]>/i);

      if (headingMatch) {
        const cleanHeading = headingMatch[1].replace(/<[^>]+>/g, '').trim();

        // Check if this heading is the top-level Book Title (first H1)
        if (!currentTitle && sections.length === 0 && cleanHeading) {
          // If first heading looks like a title rather than a chapter/front-matter
          const isStandardSection = CHAPTER_PATTERNS.some((p) => p.test(cleanHeading));
          if (!isStandardSection) {
            detectedTitle = cleanHeading;
            // Check if next part is subtitle
            currentTitle = cleanHeading;
            continue;
          }
        }

        // Save previous section if buffer has meaningful content
        const bufferHtml = currentHtmlBuffer.join('').trim();
        if (currentTitle && (bufferHtml.length > 20 || countWords(bufferHtml) > 3)) {
          const { type, subtype } = classifySectionType(currentTitle);
          sections.push({
            id: `sec_${Date.now()}_${sections.length + 1}`,
            type,
            subtype,
            title: currentTitle,
            content: sanitizeManuscriptHtml(bufferHtml),
            wordCount: countWords(bufferHtml),
          });
        }

        currentTitle = cleanHeading || `Chapter ${sections.length + 1}`;
        currentHtmlBuffer = [];
      } else {
        currentHtmlBuffer.push(part);
      }
    }

    // Push the final buffer
    const lastHtml = currentHtmlBuffer.join('').trim();
    if (currentTitle && (lastHtml.length > 20 || countWords(lastHtml) > 3)) {
      const { type, subtype } = classifySectionType(currentTitle);
      sections.push({
        id: `sec_${Date.now()}_${sections.length + 1}`,
        type,
        subtype,
        title: currentTitle,
        content: sanitizeManuscriptHtml(lastHtml),
        wordCount: countWords(lastHtml),
      });
    }
  }

  // If HTML splitting didn't yield multiple sections or input is plain text, run line-based parser
  if (sections.length <= 1) {
    sections.length = 0; // reset
    const plainText = isHtml ? rawContent.replace(/<[^>]+>/g, '\n') : rawContent;
    const lines = plainText.split('\n');

    let currentTitle = 'Chapter 1';
    let currentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (isHeadingLine(line)) {
        if (currentLines.length > 0) {
          const contentText = currentLines.join('\n').trim();
          if (contentText.length > 20) {
            const { type, subtype } = classifySectionType(currentTitle);
            const contentHtml = plainTextToParagraphsHtml(contentText);
            sections.push({
              id: `sec_${Date.now()}_${sections.length + 1}`,
              type,
              subtype,
              title: currentTitle,
              content: sanitizeManuscriptHtml(contentHtml),
              wordCount: countWords(contentHtml),
            });
          }
        }
        currentTitle = line;
        currentLines = [];
      } else {
        currentLines.push(lines[i]);
      }
    }

    // Push last section
    const contentText = currentLines.join('\n').trim();
    if (contentText.length > 0) {
      const { type, subtype } = classifySectionType(currentTitle);
      const contentHtml = plainTextToParagraphsHtml(contentText);
      sections.push({
        id: `sec_${Date.now()}_${sections.length + 1}`,
        type,
        subtype,
        title: currentTitle,
        content: sanitizeManuscriptHtml(contentHtml),
        wordCount: countWords(contentHtml),
      });
    }
  }

  // Fallback: If still only 1 or 0 sections, treat as a single chapter
  if (sections.length === 0) {
    const safeHtml = isHtml ? sanitizeManuscriptHtml(rawContent) : plainTextToParagraphsHtml(rawContent);
    sections.push({
      id: `sec_${Date.now()}_1`,
      type: 'chapter',
      title: fallbackTitle || 'Imported Manuscript',
      content: safeHtml,
      wordCount: countWords(safeHtml),
    });
  }

  // Extract chapters vs front/back matter
  const chapters: ParsedManuscript['chapters'] = [];

  sections.forEach((sec) => {
    const plain = sec.content.replace(/<[^>]+>/g, ' ').trim();
    if (sec.type === 'front-matter') {
      if (sec.subtype === 'dedication') frontMatter.dedication = plain;
      if (sec.subtype === 'copyright') frontMatter.copyrightText = plain;
      if (sec.subtype === 'preface') frontMatter.preface = (frontMatter.preface ? frontMatter.preface + '\n\n' : '') + plain;
      if (sec.subtype === 'disclaimer') frontMatter.disclaimer = plain;
    } else if (sec.type === 'back-matter') {
      if (sec.subtype === 'about-author') backMatter.aboutAuthor = plain;
      if (sec.subtype === 'other-books') backMatter.otherBooks = plain;
      if (sec.subtype === 'appendix') backMatter.appendix = plain;
    }

    // Always include as a selectable chapter in the manuscript
    chapters.push({
      id: sec.id,
      title: sec.title,
      content: sec.content,
      wordCount: sec.wordCount,
      order: chapters.length + 1,
    });
  });

  const totalWordCount = chapters.reduce((acc, c) => acc + c.wordCount, 0);

  return {
    title: detectedTitle,
    subtitle: detectedSubtitle,
    sections,
    chapters,
    frontMatter,
    backMatter,
    totalWordCount,
    totalChapters: chapters.length,
  };
}
