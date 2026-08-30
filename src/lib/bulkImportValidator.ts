/**
 * Bulk Blog Post Import Validator & Markdown-to-HTML Parser
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

import {
  BulkImportPost,
  BulkImportResult,
  BulkImportError,
  BlogStatus,
  BlogSchemaType,
} from '../types/blog';
import { generateSlug } from './blogUtils';

const VALID_STATUSES: BlogStatus[] = ['draft', 'review', 'published', 'archived'];
const VALID_SCHEMA_TYPES: BlogSchemaType[] = [
  'Article',
  'HowToArticle',
  'FAQPage',
  'NewsArticle',
  'Review',
];

// Helper to check if string is a valid URL
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Simple markdown to HTML parser for blog import
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headings
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and Italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
    .replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>')
    // Blockquotes
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Wrap consecutive list items in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);

  // Wrap paragraphs (lines not already wrapped in HTML tags)
  const lines = html.split('\n\n');
  const processed = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<p') ||
        trimmed.startsWith('<div')
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return processed;
}

// Detect whether content contains markdown signatures
export function isMarkdownContent(content: string): boolean {
  if (!content) return false;
  // If content contains standard HTML block tags, treat as HTML
  if (/<(h[1-6]|p|div|ul|ol|li|blockquote|table)[\s>]/i.test(content)) {
    return false;
  }
  // Check for common markdown syntax markers
  const mdPatterns = [
    /^#{1,6}\s+/m,       // # Headings
    /\*\*[^*]+\*\*/,     // **bold**
    /\[[^\]]+\]\([^)]+\)/, // [link](url)
    /^\s*[-*]\s+/m,      // - bullet items
    /^>\s+/m,            // > blockquotes
  ];
  return mdPatterns.some((pattern) => pattern.test(content));
}

export function validateBulkImport(
  rawPosts: any[],
  existingSlugs: string[] = []
): BulkImportResult {
  const errors: BulkImportError[] = [];
  const preview: BulkImportPost[] = [];
  const processedSlugs = new Set<string>(existingSlugs.map((s) => s.toLowerCase()));
  let validCount = 0;
  let invalidCount = 0;
  let duplicateSlugsCount = 0;

  if (!Array.isArray(rawPosts)) {
    return {
      totalRows: 0,
      valid: 0,
      invalid: 0,
      duplicateSlugs: 0,
      errors: [{ row: 0, field: 'root', message: 'Input must be a JSON array of blog post objects' }],
      preview: [],
    };
  }

  rawPosts.forEach((raw, idx) => {
    const rowNum = idx + 1;
    const rowErrors: BulkImportError[] = [];

    if (!raw || typeof raw !== 'object') {
      errors.push({ row: rowNum, field: 'row', message: 'Row must be a valid JSON object' });
      invalidCount++;
      return;
    }

    // 1. Required: Title (10–200 chars)
    if (!raw.title || typeof raw.title !== 'string') {
      rowErrors.push({ row: rowNum, field: 'title', message: 'Title is required and must be a string', value: raw.title });
    } else if (raw.title.trim().length < 10) {
      rowErrors.push({ row: rowNum, field: 'title', message: 'Title must be at least 10 characters long', value: raw.title });
    } else if (raw.title.trim().length > 200) {
      rowErrors.push({ row: rowNum, field: 'title', message: 'Title must not exceed 200 characters', value: raw.title });
    }

    // 2. Required: Content (min 100 chars)
    if (!raw.content || typeof raw.content !== 'string') {
      rowErrors.push({ row: rowNum, field: 'content', message: 'Content is required and must be a string' });
    } else if (raw.content.trim().length < 100) {
      rowErrors.push({ row: rowNum, field: 'content', message: 'Content must be at least 100 characters long' });
    }

    // 3. Required: Category (not empty)
    if (!raw.category || typeof raw.category !== 'string' || !raw.category.trim()) {
      rowErrors.push({ row: rowNum, field: 'category', message: 'Category is required', value: raw.category });
    }

    // 4. Slug Validation & Deduplication
    let slug = raw.slug ? String(raw.slug).trim().toLowerCase() : '';
    if (slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug)) {
        rowErrors.push({ row: rowNum, field: 'slug', message: 'Slug can only contain lowercase letters, numbers, and hyphens', value: slug });
      }
    } else if (raw.title) {
      slug = generateSlug(raw.title);
    }

    if (slug) {
      if (processedSlugs.has(slug)) {
        duplicateSlugsCount++;
        rowErrors.push({ row: rowNum, field: 'slug', message: `Duplicate slug detected: "${slug}". A unique slug is required.`, value: slug });
      }
    }

    // 5. Optional Status Validation
    if (raw.status && !VALID_STATUSES.includes(raw.status)) {
      rowErrors.push({ row: rowNum, field: 'status', message: `Invalid status "${raw.status}". Must be draft, review, published, or archived.`, value: raw.status });
    }

    // 6. Optional PublishedAt Validation
    if (raw.publishedAt) {
      const date = new Date(raw.publishedAt);
      if (isNaN(date.getTime())) {
        rowErrors.push({ row: rowNum, field: 'publishedAt', message: 'publishedAt must be a valid ISO date string', value: raw.publishedAt });
      }
    }

    // 7. Optional SchemaType Validation
    if (raw.schemaType && !VALID_SCHEMA_TYPES.includes(raw.schemaType)) {
      rowErrors.push({ row: rowNum, field: 'schemaType', message: `Invalid schemaType "${raw.schemaType}". Must be Article, HowToArticle, FAQPage, NewsArticle, or Review.`, value: raw.schemaType });
    }

    // 8. Optional Tags Validation
    if (raw.tags && (!Array.isArray(raw.tags) || !raw.tags.every((t: any) => typeof t === 'string'))) {
      rowErrors.push({ row: rowNum, field: 'tags', message: 'Tags must be an array of strings' });
    }

    // 9. Optional FAQ Items Validation
    if (raw.faqItems) {
      if (!Array.isArray(raw.faqItems)) {
        rowErrors.push({ row: rowNum, field: 'faqItems', message: 'faqItems must be an array of { question, answer } objects' });
      } else {
        raw.faqItems.forEach((faq: any, fIdx: number) => {
          if (!faq.question || !faq.answer) {
            rowErrors.push({ row: rowNum, field: `faqItems[${fIdx}]`, message: 'Each FAQ item must contain both question and answer strings' });
          }
        });
      }
    }

    // 10. Optional Sources Validation
    if (raw.sources) {
      if (!Array.isArray(raw.sources)) {
        rowErrors.push({ row: rowNum, field: 'sources', message: 'sources must be an array of { title, url } objects' });
      } else {
        raw.sources.forEach((src: any, sIdx: number) => {
          if (!src.title || !src.url) {
            rowErrors.push({ row: rowNum, field: `sources[${sIdx}]`, message: 'Each source must contain title and url strings' });
          } else if (!isValidUrl(src.url)) {
            rowErrors.push({ row: rowNum, field: `sources[${sIdx}].url`, message: `Invalid source URL "${src.url}"`, value: src.url });
          }
        });
      }
    }

    // 11. Optional Featured Image URL Validation
    if (raw.featuredImageUrl && !isValidUrl(raw.featuredImageUrl) && !raw.featuredImageUrl.startsWith('/')) {
      rowErrors.push({ row: rowNum, field: 'featuredImageUrl', message: 'featuredImageUrl must be a valid URL or path', value: raw.featuredImageUrl });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      invalidCount++;
    } else {
      validCount++;
      if (slug) {
        processedSlugs.add(slug);
      }

      // Convert content if markdown
      let finalContent = raw.content;
      if (isMarkdownContent(raw.content)) {
        finalContent = parseMarkdownToHtml(raw.content);
      }

      const cleanPost: BulkImportPost = {
        title: raw.title.trim(),
        slug,
        content: finalContent,
        excerpt: raw.excerpt ? String(raw.excerpt).trim() : undefined,
        category: raw.category.trim(),
        tags: Array.isArray(raw.tags) ? raw.tags.map((t: string) => String(t).trim()) : [],
        authorId: raw.authorId || undefined,
        authorName: raw.authorName || undefined,
        status: raw.status || 'draft',
        publishedAt: raw.publishedAt || undefined,
        metaTitle: raw.metaTitle || undefined,
        metaDescription: raw.metaDescription || undefined,
        focusKeyword: raw.focusKeyword || undefined,
        secondaryKeywords: Array.isArray(raw.secondaryKeywords) ? raw.secondaryKeywords : [],
        featuredImageUrl: raw.featuredImageUrl || undefined,
        featuredImageAlt: raw.featuredImageAlt || raw.title,
        featuredImageCaption: raw.featuredImageCaption || undefined,
        schemaType: raw.schemaType || 'Article',
        faqItems: Array.isArray(raw.faqItems) ? raw.faqItems : [],
        sources: Array.isArray(raw.sources) ? raw.sources : [],
        isExpertReviewed: Boolean(raw.isExpertReviewed),
        reviewedBy: raw.reviewedBy || undefined,
      };

      if (preview.length < 5) {
        preview.push(cleanPost);
      }
    }
  });

  return {
    totalRows: rawPosts.length,
    valid: validCount,
    invalid: invalidCount,
    duplicateSlugs: duplicateSlugsCount,
    errors,
    preview,
  };
}
