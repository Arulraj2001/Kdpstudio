/**
 * KDP Studio — Local Audit Quality Checks (Client-Side & Offline)
 * Phase 16C
 */

import {
  WordCountCheck,
  ContentCompletenessCheck,
  FormattingCheck,
  ContentAuditReport,
  ReadingLevelCheck,
  GrammarQualityCheck,
  KdpPolicyComplianceCheck,
  PlagiarismRiskCheck,
  GenreConsistencyCheck,
} from '../../types/audit';
import { Book, Chapter } from '../../types';

/**
 * Strip HTML and count words cleanly
 */
export function countWords(html: string = ''): number {
  if (!html) return 0;
  const stripped = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ');
  const words = stripped.trim().split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

/**
 * 1. Local Word Count Check
 */
export function checkWordCount(
  chapters: Chapter[] = [],
  genre: string = 'non-fiction'
): WordCountCheck {
  const byChapter = chapters.map((c, i) => {
    const words = c.wordCount || countWords(c.content);
    return {
      title: c.title || `Chapter ${i + 1}`,
      words,
    };
  });

  const totalWords = byChapter.reduce((acc, c) => acc + c.words, 0);
  const averageChapterLength =
    byChapter.length > 0 ? Math.round(totalWords / byChapter.length) : 0;

  let shortestChapter = 'N/A';
  let longestChapter = 'N/A';

  if (byChapter.length > 0) {
    const sorted = [...byChapter].sort((a, b) => a.words - b.words);
    shortestChapter = `${sorted[0].title} (${sorted[0].words.toLocaleString()} words)`;
    longestChapter = `${sorted[sorted.length - 1].title} (${sorted[sorted.length - 1].words.toLocaleString()} words)`;
  }

  const kdpMinimumMet = totalWords >= 2500;
  const lowerGenre = (genre || '').toLowerCase();

  // Determine genre target
  let recommendedMin = 2500;
  if (lowerGenre.includes('fiction') || lowerGenre.includes('novel') || lowerGenre.includes('thriller') || lowerGenre.includes('romance')) {
    recommendedMin = 40000;
  } else if (lowerGenre.includes('children') || lowerGenre.includes('picture')) {
    recommendedMin = 500;
  } else if (lowerGenre.includes('color') || lowerGenre.includes('activity') || lowerGenre.includes('puzzle')) {
    recommendedMin = 100;
  } else {
    recommendedMin = 5000; // non-fiction standard
  }

  const suggestions: string[] = [];
  const affectedChapters: string[] = [];

  let score = 95;
  let severity: 'pass' | 'warning' | 'fail' = 'pass';
  let passed = true;

  if (totalWords < 2500 && recommendedMin >= 2500) {
    severity = 'fail';
    passed = false;
    score = 40;
    suggestions.push(
      `Your book has ${totalWords.toLocaleString()} words. Amazon KDP recommends at least 2,500 words for standard text publishing.`
    );
  } else if (totalWords < recommendedMin) {
    severity = 'warning';
    passed = true;
    score = 75;
    suggestions.push(
      `Your total word count (${totalWords.toLocaleString()}) is below the typical ${recommendedMin.toLocaleString()} word threshold for ${genre}.`
    );
  }

  // Check for outlier chapters
  byChapter.forEach((ch) => {
    if (ch.words < 200 && recommendedMin >= 2500) {
      affectedChapters.push(ch.title);
      suggestions.push(`${ch.title} is very brief (${ch.words} words) — consider expanding it.`);
    }
  });

  return {
    id: 'check_word_count',
    name: 'Word Count Analysis',
    description: 'Validates book length and chapter balance against KDP and genre standards.',
    severity,
    score,
    details: `${totalWords.toLocaleString()} total words across ${chapters.length} chapter${chapters.length === 1 ? '' : 's'}. Average ${averageChapterLength.toLocaleString()} words/chapter.`,
    suggestions: suggestions.slice(0, 3),
    affectedChapters,
    passed,
    totalWords,
    byChapter,
    averageChapterLength,
    shortestChapter,
    longestChapter,
    kdpMinimumMet,
  };
}

/**
 * 2. Local Completeness Check
 */
export function checkCompleteness(book: Book): ContentCompletenessCheck {
  const missingElements: string[] = [];
  const suggestions: string[] = [];

  const hasTitle = (book.title || '').trim().length > 0;
  const hasAuthor = (book.author || '').trim().length > 0;
  const hasChapters = (book.chapters || []).length > 0;
  const hasCopyrightPage = Boolean(book.frontMatter?.copyrightPage);
  const hasTableOfContents = Boolean(book.frontMatter?.tableOfContents);
  const hasAuthorBio = (book.backMatter?.aboutAuthor || '').trim().length > 40;
  const hasDescription = (book.metadata?.description || '').trim().length >= 100;
  const hasKeywords = (book.metadata?.keywords || []).length >= 3;
  const hasCategories = (book.metadata?.categories || []).length >= 1;

  if (!hasTitle) missingElements.push('Book Title');
  if (!hasAuthor) missingElements.push('Author Name');
  if (!hasChapters) missingElements.push('Manuscript Chapters');
  if (!hasCopyrightPage) {
    missingElements.push('Copyright Page');
    suggestions.push('Add a Copyright Page in Front Matter to protect intellectual property on Amazon.');
  }
  if (!hasTableOfContents && (book.chapters || []).length > 3) {
    missingElements.push('Table of Contents');
    suggestions.push('Enable Table of Contents for seamless reader navigation.');
  }
  if (!hasAuthorBio) {
    missingElements.push('Author Biography');
    suggestions.push('Add an Author Bio (50+ words) in Back Matter to build reader connection and brand.');
  }
  if (!hasDescription) {
    missingElements.push('Full Book Description');
    suggestions.push('Expand your KDP book description to at least 100 words for optimal Amazon SEO.');
  }
  if (!hasKeywords) {
    missingElements.push('KDP Search Keywords');
    suggestions.push('Select at least 3-7 Amazon search keywords to improve discovery.');
  }

  let score = 100;
  let severity: 'pass' | 'warning' | 'fail' = 'pass';
  let passed = true;

  if (!hasTitle || !hasAuthor || !hasChapters) {
    severity = 'fail';
    passed = false;
    score = 30;
  } else if (missingElements.length > 0) {
    severity = 'warning';
    passed = true;
    score = Math.max(50, 100 - missingElements.length * 10);
  }

  const frontMatterComplete = Boolean(
    book.frontMatter?.titlePage && book.frontMatter?.copyrightPage
  );
  const backMatterComplete = Boolean(book.backMatter?.aboutAuthor);

  return {
    id: 'check_completeness',
    name: 'Content Completeness',
    description: 'Checks for essential publishing elements including metadata, front and back matter.',
    severity,
    score,
    details:
      missingElements.length === 0
        ? 'All essential and recommended publishing components are present.'
        : `Missing ${missingElements.length} recommended element${missingElements.length > 1 ? 's' : ''}: ${missingElements.join(', ')}.`,
    suggestions,
    affectedChapters: [],
    passed,
    missingElements,
    frontMatterComplete,
    backMatterComplete,
    hasTableOfContents,
    hasAuthorBio,
    hasCopyrightPage,
  };
}

/**
 * 3. Local Formatting Check
 */
export function checkFormatting(chapters: Chapter[] = []): FormattingCheck {
  const emptyChapters: string[] = [];
  const veryShortChapters: string[] = [];
  const suggestions: string[] = [];
  const affectedChapters: string[] = [];

  let hasOrphanedContent = false;
  let numberedCount = 0;
  let unnumberedCount = 0;

  chapters.forEach((c, idx) => {
    const title = (c.title || '').trim();
    const words = c.wordCount || countWords(c.content);

    if (!title && words > 0) {
      hasOrphanedContent = true;
    }

    if (words === 0) {
      emptyChapters.push(title || `Chapter ${idx + 1}`);
      affectedChapters.push(title || `Chapter ${idx + 1}`);
    } else if (words < 200) {
      veryShortChapters.push(title || `Chapter ${idx + 1}`);
    }

    if (/^chapter\s+\d+/i.test(title)) {
      numberedCount++;
    } else if (title.length > 0) {
      unnumberedCount++;
    }
  });

  const inconsistentHeadings =
    numberedCount > 0 && unnumberedCount > 0 && numberedCount !== chapters.length;

  let score = 100;
  let severity: 'pass' | 'warning' | 'fail' = 'pass';
  let passed = true;

  if (emptyChapters.length > 0) {
    severity = 'fail';
    passed = false;
    score = Math.max(30, 100 - emptyChapters.length * 25);
    suggestions.push(`Found ${emptyChapters.length} empty chapter(s) with 0 words. Add content or delete them.`);
  } else if (veryShortChapters.length > 0 || inconsistentHeadings || hasOrphanedContent) {
    severity = 'warning';
    passed = true;
    score = 80;
    if (inconsistentHeadings) {
      suggestions.push('Inconsistent chapter heading style (mix of "Chapter X" and custom titles).');
    }
    if (hasOrphanedContent) {
      suggestions.push('Some chapters are missing titles.');
    }
  }

  return {
    id: 'check_formatting',
    name: 'Structure & Formatting',
    description: 'Audits chapter hierarchy, detects empty nodes, and ensures uniform heading styling.',
    severity,
    score,
    details:
      emptyChapters.length === 0 && !inconsistentHeadings
        ? 'Chapter layout is structured cleanly with no empty sections.'
        : `Found structural issues: ${emptyChapters.length} empty chapter(s), ${veryShortChapters.length} short chapter(s).`,
    suggestions,
    affectedChapters,
    passed,
    emptyChapters,
    veryShortChapters,
    inconsistentHeadings,
    hasOrphanedContent,
  };
}

/**
 * Helper to compile a basic report with 3 local checks
 */
export function compileBasicReport(
  book: Book,
  uid: string,
  processingTimeMs: number = 250
): ContentAuditReport {
  const wordCount = checkWordCount(book.chapters || [], book.genre);
  const contentCompleteness = checkCompleteness(book);
  const formatting = checkFormatting(book.chapters || []);

  const avgScore = Math.round(
    ((wordCount.score || 80) * 0.4 +
      (contentCompleteness.score || 80) * 0.4 +
      (formatting.score || 80) * 0.2)
  );

  let overallSeverity: 'pass' | 'warning' | 'fail' = 'pass';
  if (!wordCount.passed || !contentCompleteness.passed || !formatting.passed) {
    overallSeverity = 'fail';
  } else if (
    wordCount.severity === 'warning' ||
    contentCompleteness.severity === 'warning' ||
    formatting.severity === 'warning'
  ) {
    overallSeverity = 'warning';
  }

  const kdpReadyConfidence = overallSeverity === 'pass' ? 90 : overallSeverity === 'warning' ? 75 : 45;

  const defaultReadingLevel: ReadingLevelCheck = {
    id: 'check_reading_level',
    name: 'Reading Level Analysis',
    description: 'Flesch-Kincaid grade level and sentence complexity metrics.',
    severity: 'info',
    score: null,
    details: 'Run Full AI Audit to analyze reading grade level and vocabulary complexity.',
    suggestions: ['Upgrade to Pro for full AI reading grade calculation.'],
    affectedChapters: [],
    passed: true,
    grade: 9,
    level: 'high-school',
    fleschScore: 65,
    averageSentenceLength: 15,
    averageSyllablesPerWord: 1.5,
  };

  const defaultGrammar: GrammarQualityCheck = {
    id: 'check_grammar',
    name: 'Grammar & Style Quality',
    description: 'Deep proofreading pass identifying run-ons, tense shifts, and syntax anomalies.',
    severity: 'info',
    score: null,
    details: 'Run Full AI Audit for grammar evaluation and error samples.',
    suggestions: ['Full AI Audit provides automated syntax and consistency checking.'],
    affectedChapters: [],
    passed: true,
    errorCount: 0,
    errorTypes: [],
    sampleErrors: [],
  };

  const defaultKdpPolicy: KdpPolicyComplianceCheck = {
    id: 'check_kdp_policy',
    name: 'Amazon KDP Policy Compliance',
    description: 'Scans for prohibited content, copyright triggers, and metadata compliance.',
    severity: 'info',
    score: null,
    details: 'Run Full AI Audit for KDP compliance scanning.',
    suggestions: ['Ensures your manuscript meets all Amazon publishing guidelines.'],
    affectedChapters: [],
    passed: true,
    flaggedTerms: [],
    flaggedSections: [],
    policyAreas: [
      { area: 'Appropriate Adult Disclosures', status: 'clear' },
      { area: 'No Hate Speech / Defamation', status: 'clear' },
      { area: 'No Medical Misinformation', status: 'clear' },
      { area: 'Spam & Low-Quality Standards', status: 'clear' },
    ],
  };

  const defaultPlagiarism: PlagiarismRiskCheck = {
    id: 'check_plagiarism',
    name: 'Originality & Plagiarism Risk',
    description: 'Evaluates formulaic tropes and writing originality indicators.',
    severity: 'info',
    score: null,
    details: 'Run Full AI Audit to evaluate originality risk factors.',
    suggestions: ['Always use dedicated plagiarism checkers like Copyscape for final DMCA clearance.'],
    affectedChapters: [],
    passed: true,
    riskLevel: 'low',
    riskFactors: [],
    note: '⚠️ AI-assisted originality risk indicators only. Not a formal DMCA verification.',
  };

  const defaultGenre: GenreConsistencyCheck = {
    id: 'check_genre',
    name: 'Genre Tone Consistency',
    description: 'Verifies narrative voice and style fidelity to declared book genre.',
    severity: 'info',
    score: null,
    details: 'Run Full AI Audit for genre tone evaluation.',
    suggestions: ['AI Audit checks tone consistency across all chapters.'],
    affectedChapters: [],
    passed: true,
    detectedGenre: book.genre || 'General',
    expectedGenre: book.genre || 'General',
    consistencyScore: 90,
    inconsistentChapters: [],
    toneShifts: [],
  };

  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    bookId: book.id,
    uid,
    overallScore: avgScore,
    overallSeverity,
    kdpReadyConfidence,
    summary: `Basic Content Audit complete: ${wordCount.totalWords.toLocaleString()} words across ${book.chapters?.length || 0} chapters. ${
      missingElementsCount(contentCompleteness) === 0 ? 'All structural elements present.' : 'Some recommended metadata missing.'
    }`,
    checks: {
      wordCount,
      contentCompleteness,
      formatting,
      readingLevel: defaultReadingLevel,
      grammarQuality: defaultGrammar,
      kdpPolicyCompliance: defaultKdpPolicy,
      plagiarismRisk: defaultPlagiarism,
      genreConsistency: defaultGenre,
    },
    auditType: 'basic',
    createdAt: new Date().toISOString(),
    processingTimeMs,
  };
}

function missingElementsCount(check: ContentCompletenessCheck): number {
  return check.missingElements ? check.missingElements.length : 0;
}
