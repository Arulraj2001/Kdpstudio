/**
 * KDP Studio — Enterprise SaaS Manuscript Importer
 * Single unified entry point for importing DOCX, EPUB, Markdown, and TXT manuscripts.
 */

import { parseDocxFile } from './docxParser';
import { parseEpubFile } from './epubParser';
import { parseMarkdownFile } from './markdownParser';
import { analyzeManuscriptStructure, ParsedManuscript } from './structureEngine';
import { sanitizeManuscriptHtml } from './sanitizer';

export * from './docxParser';
export * from './epubParser';
export * from './markdownParser';
export * from './structureEngine';
export * from './sanitizer';

export interface ImportOptions {
  autoSplit?: boolean;
  bookTitle?: string;
  onProgress?: (percent: number, statusText: string) => void;
}

export async function importManuscriptString(
  content: string,
  format: 'md' | 'txt' | 'html',
  options: ImportOptions = {}
): Promise<ParsedManuscript> {
  const { onProgress, bookTitle } = options;
  const titleFallback = bookTitle || 'Imported Manuscript';

  onProgress?.(10, 'Processing pasted manuscript content...');

  let rawHtmlOrText = '';
  let detectedTitle = titleFallback;
  let detectedSubtitle: string | undefined;
  let detectedAuthor: string | undefined;

  if (format === 'md') {
    onProgress?.(40, 'Parsing Markdown structure, GFM tables & formatting...');
    const result = await parseMarkdownFile(content);
    rawHtmlOrText = result.html;
    if (result.title) detectedTitle = result.title;
    if (result.subtitle) detectedSubtitle = result.subtitle;
    if (result.author) detectedAuthor = result.author;
  } else if (format === 'html') {
    onProgress?.(40, 'Sanitizing HTML manuscript...');
    rawHtmlOrText = sanitizeManuscriptHtml(content);
  } else {
    onProgress?.(40, 'Reading text...');
    rawHtmlOrText = content;
  }

  onProgress?.(70, 'Detecting chapters and structure...');
  const parsed = analyzeManuscriptStructure(rawHtmlOrText, detectedTitle);
  if (detectedSubtitle) parsed.subtitle = detectedSubtitle;
  if (detectedAuthor) parsed.author = detectedAuthor;

  onProgress?.(100, 'Import ready for review!');
  return parsed;
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
  let detectedSubtitle: string | undefined;
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
    onProgress?.(30, 'Parsing Markdown typography & tables...');
    const text = await file.text();
    const result = await parseMarkdownFile(text);
    rawHtmlOrText = result.html;
    if (result.title) detectedTitle = result.title;
    if (result.subtitle) detectedSubtitle = result.subtitle;
    if (result.author) detectedAuthor = result.author;
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
  if (detectedSubtitle) parsed.subtitle = detectedSubtitle;
  if (detectedAuthor) parsed.author = detectedAuthor;

  onProgress?.(100, 'Import ready for review!');
  return parsed;
}
