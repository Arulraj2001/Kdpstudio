/**
 * KDP Studio — Version History & Snapshot Types
 * Phase 16A
 */

export type SnapshotTrigger =
  | 'manual'          // user clicked "Save Snapshot"
  | 'pre-export-pdf'  // auto before PDF export
  | 'pre-export-epub' // auto before EPUB export
  | 'auto-daily'      // automatic daily backup
  | 'milestone';      // first draft, chapter complete etc.

export type SnapshotStatus = 'creating' | 'ready' | 'failed';

export interface BookSnapshotData {
  title: string;
  subtitle: string;
  author: string;
  genre: string;
  trimSize: string;
  paperType: string;
  language: string;
  status: string;
}

export interface SnapshotChapter {
  id: string;
  title: string;
  content: string; // full HTML content
  order: number;
  wordCount: number;
}

export interface SnapshotFrontMatter {
  titlePage: boolean;
  copyrightPage: boolean;
  dedication: string;
  tableOfContents: boolean;
  preface: string;
}

export interface SnapshotBackMatter {
  aboutAuthor: string;
  otherBooks: string;
  resources: string;
}

export interface SnapshotMetadata {
  description: string;
  keywords: string[];
  categories: string[];
  price: number;
  royaltyPlan: string;
}

export interface BookSnapshot {
  id: string;
  bookId: string;
  uid: string;

  // Snapshot Identity
  label: string;
  trigger: SnapshotTrigger;
  status: SnapshotStatus;

  // Book State at Snapshot Time
  bookData: BookSnapshotData;
  chapters: SnapshotChapter[];
  frontMatter: SnapshotFrontMatter;
  backMatter: SnapshotBackMatter;
  metadata: SnapshotMetadata;

  // Snapshot Stats
  totalWordCount: number;
  chapterCount: number;

  // Storage
  storageRef: string | null;
  isCompressed: boolean;
  sizeBytes: number;

  // Timestamps (ISO Strings for serializability)
  createdAt: string;
  restoredAt: string | null;
  restoredFrom: string | null;
}

export interface ChangedChapterDiff {
  chapterId: string;
  chapterTitle: string;
  changeType: 'added' | 'removed' | 'modified';
  wordCountBefore: number;
  wordCountAfter: number;
}

export interface SnapshotDiff {
  snapshotId: string;
  comparedToSnapshotId: string;

  wordCountDelta: number;
  chapterCountDelta: number;

  changedChapters: ChangedChapterDiff[];

  metadataChanged: boolean;
  frontMatterChanged: boolean;
  backMatterChanged: boolean;

  summary: string;
}

export interface VersionHistoryConfig {
  uid: string;

  autoSnapshotOnExport: boolean;
  autoSnapshotDaily: boolean;
  retentionDays: number | null; // null = keep forever

  notifyOnAutoSnapshot: boolean;
}
