/**
 * KDP Studio — EPUB 2/3 Manuscript Parser
 * Extracts chapters and metadata from EPUB files using JSZip and DOM/XML parsing.
 */

import JSZip from 'jszip';
import { sanitizeManuscriptHtml } from './sanitizer';

export interface EpubParseResult {
  title: string;
  creator: string;
  chapters: { title: string; html: string; rawText: string }[];
  fullHtml: string;
  rawText: string;
}

export async function parseEpubFile(file: File | ArrayBuffer): Promise<EpubParseResult> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof ArrayBuffer) {
    arrayBuffer = file;
  } else {
    arrayBuffer = await file.arrayBuffer();
  }

  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Locate container.xml
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB: META-INF/container.xml not found.');
  }

  const containerXml = await containerFile.async('text');
  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/i);
  const opfPath = opfPathMatch ? opfPathMatch[1] : 'OEBPS/content.opf';

  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: Package file ${opfPath} not found.`);
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
  const opfContent = await opfFile.async('text');

  // Extract Metadata
  const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
  const creatorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
  const bookTitle = titleMatch ? titleMatch[1].trim() : 'Imported EPUB';
  const bookAuthor = creatorMatch ? creatorMatch[1].trim() : 'Author';

  // 2. Parse Manifest & Spine
  const manifestItems: Record<string, string> = {};
  const manifestRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*>/gi;
  let itemMatch: RegExpExecArray | null;
  while ((itemMatch = manifestRegex.exec(opfContent)) !== null) {
    manifestItems[itemMatch[1]] = itemMatch[2];
  }

  // Find spine itemrefs
  const spineItemIds: string[] = [];
  const spineRegex = /<itemref\s+[^>]*idref="([^"]+)"[^>]*>/gi;
  let spineMatch: RegExpExecArray | null;
  while ((spineMatch = spineRegex.exec(opfContent)) !== null) {
    spineItemIds.push(spineMatch[1]);
  }

  const chapters: { title: string; html: string; rawText: string }[] = [];
  const fullHtmlParts: string[] = [];
  const fullTextParts: string[] = [];

  // 3. Extract XHTML Chapters in Spine Order
  for (let i = 0; i < spineItemIds.length; i++) {
    const id = spineItemIds[i];
    const relativeHref = manifestItems[id];
    if (!relativeHref) continue;

    const fullFilePath = (opfDir + relativeHref).replace(/^\/+/, '');
    const chapterFile = zip.file(fullFilePath) || zip.file(relativeHref);
    if (!chapterFile) continue;

    const rawXhtml = await chapterFile.async('text');

    // Extract body content
    const bodyMatch = rawXhtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : rawXhtml;

    // Detect heading or title from chapter
    const headingMatch = bodyContent.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    let chapterTitle = `Chapter ${chapters.length + 1}`;
    if (headingMatch) {
      const cleanTitle = headingMatch[1].replace(/<[^>]+>/g, '').trim();
      if (cleanTitle && cleanTitle.length < 80) {
        chapterTitle = cleanTitle;
      }
    }

    const cleanHtml = sanitizeManuscriptHtml(bodyContent);
    const rawText = cleanHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (rawText.length > 20) {
      chapters.push({
        title: chapterTitle,
        html: cleanHtml,
        rawText,
      });
      fullHtmlParts.push(cleanHtml);
      fullTextParts.push(rawText);
    }
  }

  return {
    title: bookTitle,
    creator: bookAuthor,
    chapters,
    fullHtml: fullHtmlParts.join('<hr class="scene-break" />'),
    rawText: fullTextParts.join('\n\n'),
  };
}
