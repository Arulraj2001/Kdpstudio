/**
 * Pure Blog Utility Functions (Browser & Server Compatible)
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

import { BlogTocItem, AdPositionConfig } from '../types/blog';

export const DEFAULT_AD_POSITIONS: AdPositionConfig[] = [
  {
    id: 'header',
    name: 'Header Banner',
    description: 'Above the post title',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 0,
  },
  {
    id: 'in-article-1',
    name: 'In-Article #1',
    description: 'After first 300 words',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 600,
  },
  {
    id: 'in-article-2',
    name: 'In-Article #2',
    description: 'After middle of article',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 900,
  },
  {
    id: 'in-article-3',
    name: 'In-Article #3',
    description: 'Near end of article',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 1500,
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Sticky sidebar',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 0,
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'Below article content',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: false,
    minWordCount: 0,
  },
  {
    id: 'between-posts',
    name: 'Between Posts',
    description: 'Between related posts',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 0,
  },
  {
    id: 'above-comments',
    name: 'Above Comments',
    description: 'Above discussions area',
    adUnitId: '',
    enabled: false,
    hideForLoggedIn: false,
    hideForPaidUsers: true,
    minWordCount: 0,
  },
];

/**
 * Normalizes title into URL-friendly slug
 */
export function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Counts words in an HTML or plain text string
 */
export function countWords(htmlOrText: string): number {
  if (!htmlOrText) return 0;
  const text = htmlOrText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculates estimated reading time (238 WPM standard)
 */
export function calculateReadingTime(htmlOrText: string): number {
  const words = countWords(htmlOrText);
  return Math.max(1, Math.ceil(words / 238));
}

/**
 * Generates plain text excerpt with clean word boundary truncation
 */
export function generateExcerpt(htmlOrText: string, maxChars: number = 155): string {
  if (!htmlOrText) return '';
  const text = htmlOrText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

/**
 * Parses H2-H4 headings and creates structured Table of Contents
 */
export function generateTableOfContents(htmlContent: string): BlogTocItem[] {
  if (!htmlContent) return [];
  const toc: BlogTocItem[] = [];
  const headingRegex = /<h([2-4])(?:\s+[^>]*id=["']([^"']+)["'])?[^>]*>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1], 10) as 2 | 3 | 4;
    const existingId = match[2];
    const rawText = match[3].replace(/<[^>]*>?/gm, '').trim();
    if (!rawText) continue;

    const id = existingId || generateSlug(rawText);
    toc.push({
      id,
      text: rawText,
      level,
    });
  }

  return toc;
}
