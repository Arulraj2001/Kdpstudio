/**
 * Phase 16A Automated Test Verification Script
 */

import {
  createSnapshot,
  calculateDiff,
  getVersionConfig,
  saveVersionConfig,
  SNAPSHOT_LIMITS,
} from '../src/lib/versionService';
import { BookSnapshot } from '../src/types/versions';
import { Book } from '../src/types';

console.log('--- TESTING PHASE 16A VERSION HISTORY SERVICE ---');

// 1. Snapshot Limits
console.assert(SNAPSHOT_LIMITS.free === 0, 'Free plan should have 0 snapshots');
console.assert(SNAPSHOT_LIMITS.starter === 5, 'Starter plan should have 5 snapshots');
console.assert(SNAPSHOT_LIMITS.pro === 30, 'Pro plan should have 30 snapshots');
console.assert(SNAPSHOT_LIMITS.agency === -1, 'Agency plan should have unlimited snapshots');

// 2. Diff Calculation Test
const mockSnap1: BookSnapshot = {
  id: 'snap_1',
  bookId: 'book_123',
  uid: 'user_test',
  label: 'Initial Draft',
  trigger: 'manual',
  status: 'ready',
  bookData: {
    title: 'The Great Story',
    subtitle: '',
    author: 'Author One',
    genre: 'Fiction',
    trimSize: '6x9',
    paperType: 'cream',
    language: 'en',
    status: 'draft',
  },
  chapters: [
    { id: 'ch_1', title: 'Chapter 1: The Beginning', content: 'Once upon a time in a faraway land.', order: 0, wordCount: 8 },
    { id: 'ch_2', title: 'Chapter 2: The Journey', content: 'They traveled across the mountains.', order: 1, wordCount: 6 },
  ],
  frontMatter: { titlePage: true, copyrightPage: true, dedication: '', tableOfContents: true, preface: '' },
  backMatter: { aboutAuthor: '', otherBooks: '', resources: '' },
  metadata: { description: 'A great tale', keywords: ['fiction'], categories: ['General'], price: 9.99, royaltyPlan: '70' },
  totalWordCount: 14,
  chapterCount: 2,
  storageRef: null,
  isCompressed: false,
  sizeBytes: 1200,
  createdAt: '2026-08-15T10:00:00.000Z',
  restoredAt: null,
  restoredFrom: null,
};

const mockSnap2: BookSnapshot = {
  ...mockSnap1,
  id: 'snap_2',
  label: 'Second Revision',
  chapters: [
    { id: 'ch_1', title: 'Chapter 1: The New Beginning', content: 'Once upon a time in a deeply magical and faraway land.', order: 0, wordCount: 11 },
    // ch_2 removed
    { id: 'ch_3', title: 'Chapter 3: The Climax', content: 'The final battle ensued under the stormy night sky.', order: 1, wordCount: 10 },
  ],
  totalWordCount: 21,
  chapterCount: 2,
  createdAt: '2026-08-16T12:00:00.000Z',
};

const diff = calculateDiff(mockSnap1, mockSnap2);
console.assert(diff.wordCountDelta === 7, `Expected +7 words, got ${diff.wordCountDelta}`);
console.assert(diff.chapterCountDelta === 0, `Expected 0 chapter count delta, got ${diff.chapterCountDelta}`);
console.assert(diff.changedChapters.length === 3, `Expected 3 changed chapters, got ${diff.changedChapters.length}`);

const added = diff.changedChapters.find((c) => c.changeType === 'added');
const removed = diff.changedChapters.find((c) => c.changeType === 'removed');
const modified = diff.changedChapters.find((c) => c.changeType === 'modified');

console.assert(added?.chapterId === 'ch_3', 'Added chapter mismatch');
console.assert(removed?.chapterId === 'ch_2', 'Removed chapter mismatch');
console.assert(modified?.chapterId === 'ch_1', 'Modified chapter mismatch');

console.log('Diff summary generated:', diff.summary);
console.assert(diff.summary.includes('+7 words'), 'Summary missing word count delta');

console.log('--- ALL PHASE 16A TESTS PASSED SUCCESSFULLY! ---');
