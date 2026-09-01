/**
 * KDP Studio — Enterprise Markdown Manuscript Parser
 * Converts Markdown workbooks, fiction, and non-fiction with GFM tables, callouts, and fill-in lines.
 */

import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';
import { sanitizeManuscriptHtml } from './sanitizer';

export interface MarkdownParseResult {
  title?: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  html: string;
  rawText: string;
}

/**
 * Pre-processes Markdown before remark to convert workbook-specific formatting
 */
function preprocessWorkbookMarkdown(markdown: string): {
  processedMarkdown: string;
  detectedTitle?: string;
  detectedSubtitle?: string;
  detectedAuthor?: string;
} {
  let text = markdown;
  let detectedTitle: string | undefined;
  let detectedSubtitle: string | undefined;
  let detectedAuthor: string | undefined;

  // 1. Extract Book Title & Subtitle from top of document
  const topH1Match = text.match(/^#\s+([^\n]+)/m);
  if (topH1Match) {
    const candidateTitle = topH1Match[1].trim();
    if (!candidateTitle.toUpperCase().startsWith('PART ')) {
      detectedTitle = candidateTitle;
    }
  }

  // Check for subtitle right after title (## Subtitle) before any --- or copyright
  const topSubtitleMatch = text.match(/^#\s+[^\n]+\n+##\s+([^\n]+)/m);
  if (topSubtitleMatch) {
    const candidateSubtitle = topSubtitleMatch[1].trim();
    if (!candidateSubtitle.toUpperCase().startsWith('CHAPTER') && !candidateSubtitle.toUpperCase().startsWith('COPYRIGHT')) {
      detectedSubtitle = candidateSubtitle;
    }
  }

  // Check for Author Name: *[Author Name]* or *Author Name* or By: Author Name
  const authorMatch = text.match(/\*\[?([A-Za-z\s.'-]+(?:Author Name|[A-Z][a-z]+ [A-Z][a-z]+))\]?\*/i) ||
                      text.match(/^[Bb]y:?\s+([^\n]+)/m);
  if (authorMatch) {
    detectedAuthor = authorMatch[1].replace(/[\[\]*]/g, '').trim();
  }

  // 2. Convert fill-in blanks (\_\_\_\_ or ______) to styled HTML line placeholders
  text = text.replace(/(?:\\_|_){4,}/g, '\n\n<div class="workbook-line" style="border-bottom: 1.5px dashed #94a3b8; height: 1.75rem; margin: 0.75rem 0; width: 100%;"></div>\n\n');

  // 3. Convert page break placeholders (*[Page break...]* or <!-- pagebreak -->)
  text = text.replace(/\*\[Page break[^\]]*\]\*/gi, '\n\n<hr class="scene-break" />\n\n');

  // 4. Transform Part headers (# PART ONE: ...) so they don't break chapter splitting
  text = text.replace(/^#\s+(PART\s+(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d+)[^\n]*)/gim, '\n\n<div class="book-part-banner" style="background: #f8fafc; border-left: 4px solid #9333ea; padding: 10px 16px; margin: 24px 0 12px; font-weight: 800; font-size: 0.85rem; color: #7e22ce; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 4px;">$1</div>\n\n');

  return {
    processedMarkdown: text,
    detectedTitle,
    detectedSubtitle,
    detectedAuthor,
  };
}

export async function parseMarkdownFile(content: string): Promise<MarkdownParseResult> {
  const { processedMarkdown, detectedTitle, detectedSubtitle, detectedAuthor } = preprocessWorkbookMarkdown(content);

  // Convert markdown to clean HTML using remark + remark-gfm
  let rawHtml = '';
  try {
    const processed = await remark()
      .use(remarkGfm)
      .use(html, { sanitize: false })
      .process(processedMarkdown);
    rawHtml = String(processed);
  } catch (err) {
    console.warn('[MarkdownParser] Remark processing error, falling back:', err);
    rawHtml = processedMarkdown;
  }

  const cleanHtml = sanitizeManuscriptHtml(rawHtml);
  const rawText = cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    title: detectedTitle,
    subtitle: detectedSubtitle,
    author: detectedAuthor,
    html: cleanHtml,
    rawText,
  };
}
