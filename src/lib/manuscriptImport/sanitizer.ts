/**
 * KDP Studio — Manuscript HTML Sanitizer
 * Cleans incoming HTML from DOCX, EPUB, and Markdown while preserving semantic formatting.
 */

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
  'blockquote', 'ul', 'ol', 'li', 'hr', 'br', 'span',
  'sub', 'sup', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'section', 'article', 'div'
];

const ALLOWED_ATTR = [
  'class', 'style', 'id', 'align', 'data-type', 'data-scene-break'
];

export function sanitizeManuscriptHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  // If running in browser environment with DOMPurify
  if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style', 'input', 'form', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'href'],
    });
  }

  // Fallback server-side regex strip
  return dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:[^"']*/gi, '');
}
