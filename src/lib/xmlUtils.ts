/**
 * XML and Sitemap Generation Utilities
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

/**
 * Escapes XML special characters safely
 */
export function escapeXml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wraps content in CDATA block if needed
 */
export function cdata(str?: string | null): string {
  if (!str) return '<![CDATA[]]>';
  return `<![CDATA[${str}]]>`;
}
