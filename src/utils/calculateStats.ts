import { ContentBlock, FormatterStats, ChapterNavNode, KdpFormatSettings } from '../types/formatter';

/**
 * Calculates words, chapters, and estimated page counts for a manuscript.
 * For workbooks, page count = Math.ceil((wordCount / 250) * 1.4) (exercises add ~40% page count).
 */
export function calculateStats(blocks: ContentBlock[], rawText: string): FormatterStats {
  const words = rawText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  let chapterCount = 0;
  let partCount = 0;
  let exerciseCount = 0;
  let scenarioCount = 0;
  let tableCount = 0;

  for (const block of blocks) {
    if (block.type === 'chapter') chapterCount++;
    else if (block.type === 'part') partCount++;
    else if (block.type === 'exercise_header') exerciseCount++;
    else if (block.type === 'scenario_header') scenarioCount++;
    else if (block.type === 'table') tableCount++;
  }

  // If no chapter blocks detected, fallback to at least 1 if there is content
  const effectiveChapters = chapterCount > 0 ? chapterCount : (words > 0 ? 1 : 0);

  // Workbook formula with exercise inflation
  const estimatedPages = words > 0 ? Math.max(24, Math.ceil((words / 250) * 1.4)) : 0;

  return {
    wordCount: words,
    chapterCount: effectiveChapters,
    estimatedPages,
    partCount,
    exerciseCount,
    scenarioCount,
    tableCount,
  };
}

/**
 * Extracts list of chapters and parts for quick navigation
 */
export function extractChapterNavigation(blocks: ContentBlock[]): ChapterNavNode[] {
  const nodes: ChapterNavNode[] = [];
  blocks.forEach((block, idx) => {
    if (block.type === 'chapter' || block.type === 'part') {
      const cleanTitle = block.text
        .replace(/^#+\s*/, '')
        .replace(/\*\*/g, '')
        .trim();
      nodes.push({
        id: block.id,
        title: cleanTitle || (block.type === 'part' ? 'Part' : 'Chapter'),
        type: block.type,
        blockIndex: idx,
      });
    }
  });
  return nodes;
}

/**
 * Generates formatted clipboard string for KDP metadata
 */
export function generateMetadataClipboardString(
  settings: KdpFormatSettings,
  stats: FormatterStats
): string {
  return [
    `Title: ${settings.title || 'Untitled Manuscript'}`,
    `Subtitle: ${settings.subtitle || 'N/A'}`,
    `Author: ${settings.author || 'N/A'}`,
    `Trim Size: ${settings.trimSize} (${settings.trimWidth}" × ${settings.trimHeight}")`,
    `Chapter count: ${stats.chapterCount}`,
    `Word count: ${stats.wordCount.toLocaleString()}`,
    `Estimated pages: ${stats.estimatedPages}`,
  ].join('\n');
}
