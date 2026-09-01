/**
 * KDP Studio — Enterprise SaaS Manuscript Importer
 * Single unified entry point for importing DOCX, EPUB, Markdown, and TXT manuscripts.
 */

import { parseDocxFile } from './docxParser';
import { parseEpubFile } from './epubParser';
import { analyzeManuscriptStructure, ParsedManuscript } from './structureEngine';
import { sanitizeManuscriptHtml } from './sanitizer';

export * from './docxParser';
export * from './epubParser';
export * from './structureEngine';
export * from './sanitizer';

export interface ImportOptions {
  autoSplit?: boolean;
  bookTitle?: string;
  onProgress?: (percent: number, statusText: string) => void;
}

export async function importManuscriptFile(
  file: File,
  options: ImportOptions = {}
): Promise<ParsedManuscript> {
  const { onProgress, bookTitle } = options;
  const fileName = file.name.toLowerCase();
  const titleFallback = bookTitle || file.name.replace(/\.[^.]+$/, '');

  onProgress?.(10, `Reading ${file.name}...`);

  let rawHtmlOrText = '';
  let detectedTitle = titleFallback;
  let detectedAuthor = '';

  if (fileName.endsWith('.docx')) {
    onProgress?.(30, 'Parsing Word document typography and headings...');
    const result = await parseDocxFile(file);
    rawHtmlOrText = result.html;
  } else if (fileName.endsWith('.epub')) {
    onProgress?.(30, 'Unpacking EPUB spine and chapters...');
    const result = await parseEpubFile(file);
    rawHtmlOrText = result.fullHtml;
    if (result.title) detectedTitle = result.title;
    if (result.creator) detectedAuthor = result.creator;
  } else if (fileName.endsWith('.md')) {
    onProgress?.(30, 'Parsing Markdown formatting...');
    const text = await file.text();
    // Convert markdown to clean HTML
    try {
      const { remark } = await import('remark');
      const { default: html } = await import('remark-html');
      const processed = await remark().use(html).process(text);
      rawHtmlOrText = sanitizeManuscriptHtml(String(processed));
    } catch {
      rawHtmlOrText = text;
    }
  } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
    onProgress?.(30, 'Reading HTML document...');
    const htmlText = await file.text();
    rawHtmlOrText = sanitizeManuscriptHtml(htmlText);
  } else {
    // Plain text .txt
    onProgress?.(30, 'Reading plain text...');
    rawHtmlOrText = await file.text();
  }

  onProgress?.(60, 'Analyzing book structure and detecting chapters...');
  const parsed = analyzeManuscriptStructure(rawHtmlOrText, detectedTitle);
  if (detectedAuthor) parsed.author = detectedAuthor;

  onProgress?.(100, 'Import ready for review!');
  return parsed;
}
