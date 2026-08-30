/**
 * In-Article Ad Placement Injector
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

import { countWords } from './blogUtils';

/**
 * Splits article HTML into sections at optimal reading milestones (~300 words, ~60%, ~85%)
 * for inserting compliant in-article advertisements.
 *
 * @param html Full article HTML string
 * @param wordCount Total word count of the article
 * @returns Array of HTML chunks. Ad components are placed between adjacent chunks.
 */
export function injectAdMarkers(html: string, wordCount: number = 0): string[] {
  if (!html) return [];
  const actualWordCount = wordCount || countWords(html);

  // If short article (< 450 words), do not split into multiple in-article slots
  if (actualWordCount < 450) {
    return [html];
  }

  // Split by closing paragraph tags, retaining the </p>
  const paragraphs = html.split(/(<\/p>)/i);
  const fullParagraphs: string[] = [];

  for (let i = 0; i < paragraphs.length; i += 2) {
    const text = paragraphs[i] || '';
    const closing = paragraphs[i + 1] || '';
    if (text || closing) {
      fullParagraphs.push(text + closing);
    }
  }

  if (fullParagraphs.length <= 3) {
    return [html];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  let accumulatedWords = 0;

  // Target word thresholds
  const targetAd1Words = 300;
  const targetAd2Words = Math.round(actualWordCount * 0.6);
  const targetAd3Words = Math.round(actualWordCount * 0.85);

  let ad1Inserted = false;
  let ad2Inserted = false;
  let ad3Inserted = false;

  for (let i = 0; i < fullParagraphs.length; i++) {
    const p = fullParagraphs[i];
    currentChunk += p;
    accumulatedWords += countWords(p);

    // Check Slot 1 (~300 words, and at least 2 paragraphs in)
    if (!ad1Inserted && accumulatedWords >= targetAd1Words && i >= 1 && i < fullParagraphs.length - 2) {
      chunks.push(currentChunk);
      currentChunk = '';
      ad1Inserted = true;
      continue;
    }

    // Check Slot 2 (~60% mark, only if article > 900 words)
    if (
      ad1Inserted &&
      !ad2Inserted &&
      actualWordCount >= 900 &&
      accumulatedWords >= targetAd2Words &&
      i < fullParagraphs.length - 2
    ) {
      chunks.push(currentChunk);
      currentChunk = '';
      ad2Inserted = true;
      continue;
    }

    // Check Slot 3 (~85% mark, only if long-form > 1600 words)
    if (
      ad2Inserted &&
      !ad3Inserted &&
      actualWordCount >= 1600 &&
      accumulatedWords >= targetAd3Words &&
      i < fullParagraphs.length - 1
    ) {
      chunks.push(currentChunk);
      currentChunk = '';
      ad3Inserted = true;
      continue;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [html];
}
