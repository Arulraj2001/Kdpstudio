/**
 * Readability & Analytics Metrics for KDP Studio Book Studio
 * Provides Flesch-Kincaid, Gunning Fog, dialogue ratio, estimated read-time, and audiobook length
 */

export interface ReadabilityResult {
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;

  fleschReadingEase: number;     // 0-100, higher = more readable
  fleschKincaidGrade: number;    // US grade level
  gunningFogIndex: number;       // Grade level
  smogIndex: number;             // Grade level

  readingTimeMinutes: number;    // avg 238 wpm
  audiobookHours: number;        // avg 150 wpm
  audiobookMinutes: number;

  dialogueWordCount: number;
  dialogueRatio: number;         // 0-1 percentage

  complexWords: string[];        // Words with 3+ syllables
  complexWordCount: number;
  avgSentenceLengthCategory: 'Very Short' | 'Short' | 'Medium' | 'Long' | 'Very Long';
  readabilityLabel: string;
  readabilityColor: string;
  targetAudience: string;
}

// Strip HTML tags from Tiptap editor content
export function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li|div|blockquote|tr)>/gi, ' ') // Block end → space
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Count syllables in a single English word
export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// Count sentences — split on ., !, ? followed by space or end
export function countSentences(text: string): number {
  const matches = text.match(/[^.!?]*[.!?]+/g);
  return matches ? matches.length : Math.max(1, Math.ceil(text.split(/\s+/).length / 20));
}

// Detect dialogue words (text within " " or " ")
export function extractDialogue(text: string): string {
  const dialogueMatches = text.match(/[""][^""]*[""]|"[^"]*"/g);
  if (!dialogueMatches) return '';
  return dialogueMatches.join(' ');
}

// Flesch Reading Ease: 206.835 - 1.015(words/sentences) - 84.6(syllables/words)
function fleschReadingEase(avgWordsPerSentence: number, avgSyllablesPerWord: number): number {
  return Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord));
}

// Flesch-Kincaid Grade Level: 0.39(words/sentences) + 11.8(syllables/words) - 15.59
function fleschKincaidGrade(avgWordsPerSentence: number, avgSyllablesPerWord: number): number {
  return Math.max(0, 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59);
}

// Gunning Fog Index: 0.4 * (avgWordsPerSentence + 100 * complexWordRatio)
function gunningFog(avgWordsPerSentence: number, complexWordCount: number, wordCount: number): number {
  if (wordCount === 0) return 0;
  const percentComplex = (complexWordCount / wordCount) * 100;
  return Math.max(0, 0.4 * (avgWordsPerSentence + percentComplex));
}

// SMOG Index (Simple Measure of Gobbledygook): 3 + sqrt(complexWordsIn30Sentences)
function smogIndex(complexWordCount: number, sentenceCount: number): number {
  if (sentenceCount < 30) return 0; // SMOG needs at least 30 sentences
  const complexPer30 = (complexWordCount / sentenceCount) * 30;
  return 3 + Math.sqrt(complexPer30);
}

function getReadabilityLabel(ease: number): { label: string; color: string; audience: string } {
  if (ease >= 90) return { label: 'Very Easy', color: '#22c55e', audience: 'Grade 5 / Children' };
  if (ease >= 80) return { label: 'Easy', color: '#4ade80', audience: 'Grade 6 / Young Readers' };
  if (ease >= 70) return { label: 'Fairly Easy', color: '#86efac', audience: 'Grade 7 / Teen Readers' };
  if (ease >= 60) return { label: 'Standard', color: '#f59e0b', audience: 'Grade 8-9 / General Adult' };
  if (ease >= 50) return { label: 'Fairly Difficult', color: '#f97316', audience: 'Grade 10-12 / High School' };
  if (ease >= 30) return { label: 'Difficult', color: '#ef4444', audience: 'College Level' };
  return { label: 'Very Difficult', color: '#dc2626', audience: 'Professional / Academic' };
}

function getSentenceLengthCategory(avg: number): ReadabilityResult['avgSentenceLengthCategory'] {
  if (avg < 10) return 'Very Short';
  if (avg < 15) return 'Short';
  if (avg < 20) return 'Medium';
  if (avg < 28) return 'Long';
  return 'Very Long';
}

/**
 * Main analysis function — accepts raw text or Tiptap HTML
 */
export function analyzeReadability(input: string, isHtml = true): ReadabilityResult {
  const text = isHtml ? stripHtml(input) : input;

  if (!text || text.trim().length === 0) {
    return emptyResult();
  }

  const words: string[] = (text.match(/\b[a-zA-Z']+\b/g) as string[]) || [];
  const wordCount = words.length;
  const sentenceCount = Math.max(1, countSentences(text));
  
  let syllableCount = 0;
  const complexWords: string[] = [];
  
  words.forEach(word => {
    const syl = countSyllables(word);
    syllableCount += syl;
    if (syl >= 3 && word.length > 4) {
      complexWords.push(word.toLowerCase());
    }
  });

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;
  
  const fre = fleschReadingEase(avgWordsPerSentence, avgSyllablesPerWord);
  const fkg = fleschKincaidGrade(avgWordsPerSentence, avgSyllablesPerWord);
  const gfi = gunningFog(avgWordsPerSentence, complexWords.length, wordCount);
  const smog = smogIndex(complexWords.length, sentenceCount);

  const dialogueText = extractDialogue(text);
  const dialogueWords = (dialogueText.match(/\b[a-zA-Z']+\b/g) || []).length;
  const dialogueRatio = wordCount > 0 ? dialogueWords / wordCount : 0;

  const readingTimeMinutes = wordCount / 238;
  const audiobookTotalMinutes = wordCount / 150;
  const audiobookHours = Math.floor(audiobookTotalMinutes / 60);
  const audiobookMinutes = Math.round(audiobookTotalMinutes % 60);

  const { label, color, audience } = getReadabilityLabel(fre);

  // De-duplicate complex words
  const uniqueComplex = [...new Set(complexWords)].slice(0, 20);

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    fleschReadingEase: Math.round(fre * 10) / 10,
    fleschKincaidGrade: Math.round(fkg * 10) / 10,
    gunningFogIndex: Math.round(gfi * 10) / 10,
    smogIndex: Math.round(smog * 10) / 10,
    readingTimeMinutes: Math.round(readingTimeMinutes * 10) / 10,
    audiobookHours,
    audiobookMinutes,
    dialogueWordCount: dialogueWords,
    dialogueRatio: Math.round(dialogueRatio * 1000) / 10, // percentage
    complexWords: uniqueComplex,
    complexWordCount: complexWords.length,
    avgSentenceLengthCategory: getSentenceLengthCategory(avgWordsPerSentence),
    readabilityLabel: label,
    readabilityColor: color,
    targetAudience: audience,
  };
}

function emptyResult(): ReadabilityResult {
  return {
    wordCount: 0, sentenceCount: 0, syllableCount: 0,
    avgWordsPerSentence: 0, avgSyllablesPerWord: 0,
    fleschReadingEase: 0, fleschKincaidGrade: 0, gunningFogIndex: 0, smogIndex: 0,
    readingTimeMinutes: 0, audiobookHours: 0, audiobookMinutes: 0,
    dialogueWordCount: 0, dialogueRatio: 0,
    complexWords: [], complexWordCount: 0,
    avgSentenceLengthCategory: 'Medium',
    readabilityLabel: 'No content', readabilityColor: '#94a3b8',
    targetAudience: '—',
  };
}

/**
 * Format audiobook time for display
 */
export function formatAudiobookTime(hours: number, minutes: number): string {
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/**
 * Get KDP genre-based readability benchmarks
 */
export function getGenreBenchmark(genre: 'literary' | 'commercial' | 'ya' | 'childrens' | 'nonfiction'): {
  fre: [number, number]; fkg: [number, number]; label: string;
} {
  const benchmarks = {
    literary: { fre: [40, 65] as [number, number], fkg: [9, 14] as [number, number], label: 'Literary Fiction' },
    commercial: { fre: [60, 80] as [number, number], fkg: [6, 10] as [number, number], label: 'Commercial Fiction' },
    ya: { fre: [65, 80] as [number, number], fkg: [5, 8] as [number, number], label: 'Young Adult' },
    childrens: { fre: [80, 100] as [number, number], fkg: [2, 5] as [number, number], label: "Children's Books" },
    nonfiction: { fre: [50, 70] as [number, number], fkg: [8, 12] as [number, number], label: 'Non-Fiction' },
  };
  return benchmarks[genre];
}
