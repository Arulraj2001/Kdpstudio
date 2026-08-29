/**
 * KDP Studio — Phase 16C Content Audit Verification Script
 */

import {
  checkWordCount,
  checkCompleteness,
  checkFormatting,
  compileBasicReport,
  countWords,
} from '../src/lib/audit/localChecks';
import { Book, Chapter } from '../src/types';

function runTests() {
  console.log('=== Phase 16C Verification: Content Audit System ===\n');

  // 1. Test HTML Word Count
  const sampleHtml = `<p>Welcome to <strong>KDP Studio</strong></p><p>This is a <i>clean</i> test manuscript.</p>`;
  const words = countWords(sampleHtml);
  console.log(`1. countWords: ${words} words (expected 10)`);
  if (words !== 10) throw new Error(`countWords failed: got ${words}, expected 10`);

  // 2. Test Word Count Check
  const mockChapters: Chapter[] = [
    { id: 'ch1', title: 'Chapter 1: The Arrival', content: '<p>' + 'word '.repeat(3500) + '</p>', wordCount: 3500, order: 1 },
    { id: 'ch2', title: 'Chapter 2: The Journey', content: '<p>' + 'word '.repeat(120) + '</p>', wordCount: 120, order: 2 },
  ];

  const wordCountCheck = checkWordCount(mockChapters, 'non-fiction');
  console.log('2. Word Count Check:');
  console.log(`   - Total words: ${wordCountCheck.totalWords}`);
  console.log(`   - KDP minimum met: ${wordCountCheck.kdpMinimumMet}`);
  console.log(`   - Severity: ${wordCountCheck.severity}`);
  console.log(`   - Suggestions: ${wordCountCheck.suggestions.length}`);
  if (wordCountCheck.totalWords !== 3620) throw new Error('Word count total mismatch');
  if (!wordCountCheck.kdpMinimumMet) throw new Error('KDP minimum should be met for 3620 words');

  // 3. Test Completeness Check
  const mockBook: Book = {
    id: 'book_123',
    title: 'Self-Publishing Mastery',
    author: 'Alex Author',
    genre: 'non-fiction',
    paperType: 'white',
    trimSize: '6x9',
    chapters: mockChapters,
    frontMatter: {
      titlePage: true,
      copyrightPage: true,
      tableOfContents: true,
      dedication: '',
      preface: '',
    },
    backMatter: {
      aboutAuthor: 'Alex Author is an international bestselling author who has written dozens of books on self-publishing.',
      otherBooks: '',
      resources: '',
    },
    subtitle: '',
    language: 'English',
    status: 'draft',
    metadata: {
      description: 'A comprehensive step-by-step masterclass covering every detail of Amazon KDP publishing from manuscript to launch.',
      keywords: ['self-publishing', 'kdp guide', 'amazon kindle', 'author business'],
      categories: ['Business & Money', 'Self-Help'],
      price: 9.99,
      royaltyPlan: '70',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const completenessCheck = checkCompleteness(mockBook);
  console.log('\n3. Completeness Check:');
  console.log(`   - Score: ${completenessCheck.score}`);
  console.log(`   - Missing elements: ${completenessCheck.missingElements.length}`);
  console.log(`   - Front matter complete: ${completenessCheck.frontMatterComplete}`);
  if (completenessCheck.score < 90) throw new Error('Completeness score should be >= 90 for fully configured book');

  // 4. Test Formatting Check
  const formattingCheck = checkFormatting(mockChapters);
  console.log('\n4. Formatting Check:');
  console.log(`   - Score: ${formattingCheck.score}`);
  console.log(`   - Very short chapters: ${formattingCheck.veryShortChapters.length}`);
  console.log(`   - Empty chapters: ${formattingCheck.emptyChapters.length}`);
  if (formattingCheck.veryShortChapters.length !== 1) throw new Error('Should detect 1 short chapter (<200 words)');

  // 5. Test compileBasicReport
  const basicReport = compileBasicReport(mockBook, 'user_test_123', 150);
  console.log('\n5. Compiled Basic Audit Report:');
  console.log(`   - Report ID: ${basicReport.id}`);
  console.log(`   - Overall Score: ${basicReport.overallScore}`);
  console.log(`   - KDP Ready Confidence: ${basicReport.kdpReadyConfidence}%`);
  console.log(`   - Summary: ${basicReport.summary}`);
  console.log(`   - Audit Type: ${basicReport.auditType}`);
  if (!basicReport.id.startsWith('audit_')) throw new Error('Invalid report ID format');
  if (basicReport.overallScore < 70) throw new Error('Overall score should be healthy for complete book');

  console.log('\n✅ All Phase 16C Content Audit assertions PASSED successfully!');
}

runTests();
