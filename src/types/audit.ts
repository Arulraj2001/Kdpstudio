/**
 * KDP Studio — Content Audit & Quality Check Types
 * Phase 16C
 */

export type AuditStatus = 'idle' | 'running' | 'complete' | 'failed';

export type AuditSeverity = 'pass' | 'warning' | 'fail' | 'info';

export type ReadingLevel =
  | 'elementary'    // Grade 1-5
  | 'middle-school' // Grade 6-8
  | 'high-school'   // Grade 9-12
  | 'college'       // Grade 13-16
  | 'academic';     // Grade 17+

export interface AuditCheck {
  id: string;
  name: string;
  description: string;
  severity: AuditSeverity;
  score: number | null; // 0-100
  details: string;
  suggestions: string[];
  affectedChapters: string[];
  passed: boolean;
}

export interface ReadingLevelCheck extends AuditCheck {
  grade: number;
  level: ReadingLevel;
  fleschScore: number;
  averageSentenceLength: number;
  averageSyllablesPerWord: number;
}

export interface GrammarQualityCheck extends AuditCheck {
  errorCount: number;
  errorTypes: { type: string; count: number }[];
  sampleErrors: {
    text: string;
    suggestion: string;
    chapter: string;
  }[];
}

export interface KdpPolicyComplianceCheck extends AuditCheck {
  flaggedTerms: string[];
  flaggedSections: {
    chapter: string;
    text: string;
    reason: string;
  }[];
  policyAreas: {
    area: string;
    status: 'clear' | 'flagged';
  }[];
}

export interface PlagiarismRiskCheck extends AuditCheck {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  note: string; // Always includes disclaimer
}

export interface GenreConsistencyCheck extends AuditCheck {
  detectedGenre: string;
  expectedGenre: string;
  consistencyScore: number;
  inconsistentChapters: string[];
  toneShifts: string[];
}

export interface ContentCompletenessCheck extends AuditCheck {
  missingElements: string[];
  frontMatterComplete: boolean;
  backMatterComplete: boolean;
  hasTableOfContents: boolean;
  hasAuthorBio: boolean;
  hasCopyrightPage: boolean;
}

export interface WordCountCheck extends AuditCheck {
  totalWords: number;
  byChapter: { title: string; words: number }[];
  averageChapterLength: number;
  shortestChapter: string;
  longestChapter: string;
  kdpMinimumMet: boolean; // KDP minimum is 2,500 words
}

export interface FormattingCheck extends AuditCheck {
  emptyChapters: string[];
  veryShortChapters: string[]; // under 200 words
  inconsistentHeadings: boolean;
  hasOrphanedContent: boolean;
}

export interface ContentAuditReport {
  id: string;
  bookId: string;
  uid: string;

  // Overall Evaluation
  overallScore: number; // 0-100 weighted average
  overallSeverity: AuditSeverity;
  kdpReadyConfidence: number; // 0-100 percentage
  summary: string;

  // Individual Quality Checks
  checks: {
    readingLevel: ReadingLevelCheck;
    grammarQuality: GrammarQualityCheck;
    kdpPolicyCompliance: KdpPolicyComplianceCheck;
    plagiarismRisk: PlagiarismRiskCheck;
    genreConsistency: GenreConsistencyCheck;
    contentCompleteness: ContentCompletenessCheck;
    wordCount: WordCountCheck;
    formatting: FormattingCheck;
  };

  // Meta
  auditType: 'basic' | 'full';
  createdAt: string; // ISO string
  processingTimeMs: number;
}
