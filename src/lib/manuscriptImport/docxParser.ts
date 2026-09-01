/**
 * KDP Studio — Microsoft Word (.docx) Manuscript Parser
 * Uses Mammoth with custom style maps to convert Word documents into styled semantic HTML.
 */

import mammoth from 'mammoth';
import { sanitizeManuscriptHtml } from './sanitizer';

const STYLE_MAP = [
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Title'] => h1.book-title:fresh",
  "p[style-name='Subtitle'] => h2.book-subtitle:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Block Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote:fresh",
  "r[style-name='Emphasis'] => em",
  "r[style-name='Strong'] => strong",
  "r[style-name='Subtle Emphasis'] => em",
  "p[style-name='Scene Break'] => hr.scene-break:fresh",
  "p[style-name='Divider'] => hr.scene-break:fresh",
  "p[style-name='Section Header'] => h2:fresh",
  "p[style-name='Chapter Title'] => h1.chapter-title:fresh",
  "p[style-name='Dedication'] => p.dedication:fresh",
  "p[style-name='Copyright'] => p.copyright:fresh",
];

export interface DocxParseResult {
  html: string;
  rawText: string;
  warnings: string[];
}

export async function parseDocxFile(file: File | ArrayBuffer): Promise<DocxParseResult> {
  let arrayBuffer: ArrayBuffer;

  if (file instanceof ArrayBuffer) {
    arrayBuffer = file;
  } else {
    arrayBuffer = await file.arrayBuffer();
  }

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: STYLE_MAP,
      includeDefaultStyleMap: true,
      ignoreEmptyParagraphs: true,
    }
  );

  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });

  const cleanHtml = sanitizeManuscriptHtml(result.value);
  const warnings = (result.messages || [])
    .filter((m) => m.type === 'warning')
    .map((m) => m.message);

  return {
    html: cleanHtml,
    rawText: rawTextResult.value || '',
    warnings,
  };
}
