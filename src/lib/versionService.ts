/**
 * KDP Studio — Version History & Book Snapshot Service Layer
 * Phase 16A
 */

import {
  BookSnapshot,
  SnapshotTrigger,
  SnapshotDiff,
  ChangedChapterDiff,
  VersionHistoryConfig,
} from '../types/versions';
import { Book } from '../types';
import { db, app } from './firebase';
import { trackFeatureUse } from './featureTracker';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRefFn,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

export const SNAPSHOT_LIMITS: Record<string, number> = {
  free: 0,
  starter: 5,
  pro: 30,
  agency: -1, // Unlimited
};

const LOCAL_STORAGE_SNAPSHOTS_KEY = 'kdp_snapshots_cache';
const LOCAL_STORAGE_CONFIGS_KEY = 'kdp_version_configs_cache';

// Helper: Storage instance accessor
function getFirebaseStorageInstance() {
  try {
    if (app) {
      return getStorage(app);
    }
  } catch {}
  return null;
}

// Helper: Format date time for label
function formatDateTime(d: Date = new Date()): { dateStr: string; timeStr: string } {
  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return { dateStr, timeStr };
}

// LocalStorage helpers
function getLocalSnapshots(): BookSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSnapshots(list: BookSnapshot[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SNAPSHOTS_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * 1. Create a Snapshot
 */
export async function createSnapshot(
  uid: string,
  bookId: string,
  book: Book,
  trigger: SnapshotTrigger,
  label?: string
): Promise<string | null> {
  // 1. Fetch user's plan to enforce snapshot limits
  let userPlan = 'free';
  if (db) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        userPlan = userSnap.data()?.plan || 'free';
      }
    } catch (err) {
      console.warn('Failed to fetch user plan for snapshot limit:', err);
    }
  }

  const maxSnapshots = SNAPSHOT_LIMITS[userPlan] ?? SNAPSHOT_LIMITS.free;

  // Free plan gets 0 snapshots
  if (maxSnapshots === 0) {
    return null;
  }

  // Check existing snapshot count for this book
  let existingSnapshots: BookSnapshot[] = [];
  if (db) {
    try {
      const q = query(
        collection(db, 'snapshots'),
        where('bookId', '==', bookId),
        where('uid', '==', uid),
        orderBy('createdAt', 'asc')
      );
      const snapDocs = await getDocs(q);
      existingSnapshots = snapDocs.docs.map((d) => d.data() as BookSnapshot);
    } catch (err) {
      console.warn('Query snapshots error:', err);
      existingSnapshots = getLocalSnapshots()
        .filter((s) => s.bookId === bookId && s.uid === uid)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
  } else {
    existingSnapshots = getLocalSnapshots()
      .filter((s) => s.bookId === bookId && s.uid === uid)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  // FIFO Deletion if limit reached (and not agency)
  if (maxSnapshots !== -1 && existingSnapshots.length >= maxSnapshots) {
    const oldest = existingSnapshots[0];
    if (oldest) {
      await deleteSnapshot(oldest.id, uid).catch(console.error);
    }
  }

  // 2. Build snapshot object
  const now = new Date();
  const { dateStr, timeStr } = formatDateTime(now);

  let generatedLabel = label;
  if (!generatedLabel) {
    switch (trigger) {
      case 'manual':
        generatedLabel = `Manual snapshot — ${dateStr} ${timeStr}`;
        break;
      case 'pre-export-pdf':
        generatedLabel = `Before PDF export — ${dateStr} ${timeStr}`;
        break;
      case 'pre-export-epub':
        generatedLabel = `Before EPUB export — ${dateStr} ${timeStr}`;
        break;
      case 'auto-daily':
        generatedLabel = `Daily backup — ${dateStr}`;
        break;
      case 'milestone':
        generatedLabel = `Milestone draft — ${dateStr}`;
        break;
      default:
        generatedLabel = `Snapshot — ${dateStr} ${timeStr}`;
    }
  }

  const chapters = (book.chapters || []).map((c, idx) => ({
    id: c.id || `ch_${idx + 1}`,
    title: c.title || `Chapter ${idx + 1}`,
    content: c.content || '',
    order: c.order ?? idx,
    wordCount: c.wordCount || (c.content ? c.content.split(/\s+/).filter(Boolean).length : 0),
  }));

  const totalWordCount = chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);

  const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const fullSnapshot: BookSnapshot = {
    id: snapshotId,
    bookId,
    uid,
    label: generatedLabel,
    trigger,
    status: 'ready',
    bookData: {
      title: book.title || 'Untitled Book',
      subtitle: book.subtitle || '',
      author: book.author || 'Anonymous',
      genre: book.genre || 'non-fiction',
      trimSize: book.trimSize || '6x9',
      paperType: book.paperType || 'cream',
      language: book.language || 'en',
      status: book.status || 'draft',
    },
    chapters,
    frontMatter: book.frontMatter || {
      titlePage: true,
      copyrightPage: true,
      dedication: '',
      tableOfContents: true,
      preface: '',
    },
    backMatter: book.backMatter || {
      aboutAuthor: '',
      otherBooks: '',
      resources: '',
    },
    metadata: {
      description: book.metadata?.description || '',
      keywords: book.metadata?.keywords || [],
      categories: book.metadata?.categories || [],
      price: book.metadata?.price || 9.99,
      royaltyPlan: book.metadata?.royaltyPlan || '70',
    },
    totalWordCount,
    chapterCount: chapters.length,
    storageRef: null,
    isCompressed: false,
    sizeBytes: 0,
    createdAt: now.toISOString(),
    restoredAt: null,
    restoredFrom: null,
  };

  const serialized = JSON.stringify(fullSnapshot);
  const sizeBytes = serialized.length;
  fullSnapshot.sizeBytes = sizeBytes;

  // 3. Storage Strategy: If > 500KB, upload full JSON to Firebase Storage
  let storageRefPath: string | null = null;
  let isCompressed = false;

  const storage = getFirebaseStorageInstance();
  if (sizeBytes > 500 * 1024 && storage) {
    try {
      storageRefPath = `snapshots/${uid}/${bookId}/${snapshotId}.json`;
      const fileRef = storageRefFn(storage, storageRefPath);
      await uploadString(fileRef, serialized, 'raw', {
        contentType: 'application/json',
      });
      isCompressed = true;
      fullSnapshot.storageRef = storageRefPath;
      fullSnapshot.isCompressed = true;
    } catch (storageErr) {
      console.warn('Firebase storage snapshot upload failed, storing inline:', storageErr);
      storageRefPath = null;
      isCompressed = false;
    }
  }

  // 4. Save to Firestore
  if (db) {
    try {
      // If compressed in storage, strip heavy chapter content from the Firestore doc
      const docPayload = isCompressed
        ? {
            ...fullSnapshot,
            chapters: chapters.map((c) => ({ ...c, content: '' })),
          }
        : fullSnapshot;

      await setDoc(doc(db, 'snapshots', snapshotId), docPayload);
    } catch (err) {
      console.error('Failed to save snapshot to Firestore:', err);
    }
  }

  // Always save full snapshot to LocalStorage cache
  const localList = getLocalSnapshots();
  localList.unshift(fullSnapshot);
  saveLocalSnapshots(localList.slice(0, 50));

  trackFeatureUse(uid, 'snapshot_created', { bookId, trigger, label: generatedLabel }).catch(console.error);

  return snapshotId;
}

/**
 * 2. Get Snapshots List for a Book (Lightweight)
 */
export async function getBookSnapshots(
  bookId: string,
  uid: string
): Promise<BookSnapshot[]> {
  if (db) {
    try {
      const q = query(
        collection(db, 'snapshots'),
        where('bookId', '==', bookId),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snapDocs = await getDocs(q);
      if (!snapDocs.empty) {
        return snapDocs.docs.map((d) => d.data() as BookSnapshot);
      }
    } catch (err) {
      console.warn('Firestore getBookSnapshots error, falling back to local:', err);
    }
  }

  return getLocalSnapshots()
    .filter((s) => s.bookId === bookId && s.uid === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * 3. Get Full Snapshot Content (Hydrates Storage if Compressed)
 */
export async function getSnapshotContent(snapshotId: string): Promise<BookSnapshot | null> {
  let snapshot: BookSnapshot | null = null;

  if (db) {
    try {
      const docRef = doc(db, 'snapshots', snapshotId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        snapshot = docSnap.data() as BookSnapshot;
      }
    } catch (err) {
      console.warn('Firestore getSnapshotContent error:', err);
    }
  }

  if (!snapshot) {
    const local = getLocalSnapshots().find((s) => s.id === snapshotId);
    if (local) snapshot = local;
  }

  if (!snapshot) return null;

  // If stored in Firebase Storage, fetch the full content
  if (snapshot.isCompressed && snapshot.storageRef) {
    const storage = getFirebaseStorageInstance();
    if (storage) {
      try {
        const fileRef = storageRefFn(storage, snapshot.storageRef);
        const downloadUrl = await getDownloadURL(fileRef);
        const res = await fetch(downloadUrl);
        if (res.ok) {
          const fullData = await res.json();
          return fullData;
        }
      } catch (storageErr) {
        console.warn('Failed to fetch snapshot JSON from Storage:', storageErr);
      }
    }
  }

  return snapshot;
}

/**
 * 4. Delete a Snapshot
 */
export async function deleteSnapshot(snapshotId: string, uid: string): Promise<void> {
  const storage = getFirebaseStorageInstance();

  // Find snapshot to inspect storageRef
  const snapshot = await getSnapshotContent(snapshotId);
  if (snapshot && snapshot.uid !== uid) {
    throw new Error('Unauthorized: You do not own this snapshot.');
  }

  // Delete from Storage if exists
  if (snapshot?.storageRef && storage) {
    try {
      const fileRef = storageRefFn(storage, snapshot.storageRef);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn('Failed to delete snapshot file from Storage:', err);
    }
  }

  // Delete from Firestore
  if (db) {
    try {
      await deleteDoc(doc(db, 'snapshots', snapshotId));
    } catch (err) {
      console.warn('Failed to delete snapshot doc from Firestore:', err);
    }
  }

  // Remove from LocalStorage
  const localList = getLocalSnapshots().filter((s) => s.id !== snapshotId);
  saveLocalSnapshots(localList);
}

/**
 * 5. Rename a Snapshot
 */
export async function renameSnapshot(
  snapshotId: string,
  uid: string,
  newLabel: string
): Promise<void> {
  if (db) {
    try {
      const docRef = doc(db, 'snapshots', snapshotId);
      await updateDoc(docRef, { label: newLabel.trim() });
    } catch (err) {
      console.warn('Firestore renameSnapshot error:', err);
    }
  }

  const localList = getLocalSnapshots().map((s) =>
    s.id === snapshotId && s.uid === uid ? { ...s, label: newLabel.trim() } : s
  );
  saveLocalSnapshots(localList);
}

/**
 * 6. Restore a Snapshot (with Safety Backup)
 */
export async function restoreSnapshot(
  snapshotId: string,
  uid: string,
  currentBook?: Book
): Promise<void> {
  const snapshot = await getSnapshotContent(snapshotId);
  if (!snapshot) {
    throw new Error('Snapshot not found.');
  }

  if (snapshot.uid !== uid) {
    throw new Error('Unauthorized: You cannot restore this snapshot.');
  }

  const nowStr = new Date().toISOString();

  // 1. Create a safety snapshot of the current state before overwriting
  if (currentBook) {
    try {
      await createSnapshot(
        uid,
        snapshot.bookId,
        currentBook,
        'manual',
        `Auto-save before restore — ${formatDateTime().dateStr} ${formatDateTime().timeStr}`
      );
    } catch (safetyErr) {
      console.warn('Safety snapshot creation failed, proceeding with restore:', safetyErr);
    }
  }

  // 2. Overwrite /books/{bookId} in Firestore
  if (db) {
    try {
      const bookRef = doc(db, 'books', snapshot.bookId);
      await updateDoc(bookRef, {
        title: snapshot.bookData.title,
        subtitle: snapshot.bookData.subtitle,
        author: snapshot.bookData.author,
        genre: snapshot.bookData.genre,
        trimSize: snapshot.bookData.trimSize,
        paperType: snapshot.bookData.paperType,
        language: snapshot.bookData.language,
        status: snapshot.bookData.status,
        chapters: snapshot.chapters,
        frontMatter: snapshot.frontMatter,
        backMatter: snapshot.backMatter,
        metadata: snapshot.metadata,
        updatedAt: nowStr,
        restoredFrom: snapshotId,
      });

      // Mark restoredAt on snapshot
      const snapRef = doc(db, 'snapshots', snapshotId);
      await updateDoc(snapRef, { restoredAt: nowStr });
    } catch (err) {
      console.error('Firestore restoreSnapshot error:', err);
      throw new Error('Failed to restore book state from snapshot.');
    }
  }

  // Update local snapshots cache
  const localList = getLocalSnapshots().map((s) =>
    s.id === snapshotId ? { ...s, restoredAt: nowStr } : s
  );
  saveLocalSnapshots(localList);

  trackFeatureUse(uid, 'snapshot_restored', { snapshotId, bookId: snapshot.bookId }).catch(console.error);
}

/**
 * 7. Calculate Diff Between Two Snapshots
 */
export function calculateDiff(
  snapshot1: BookSnapshot,
  snapshot2: BookSnapshot
): SnapshotDiff {
  const wordCountDelta = snapshot2.totalWordCount - snapshot1.totalWordCount;
  const chapterCountDelta = snapshot2.chapterCount - snapshot1.chapterCount;

  const s1Map = new Map((snapshot1.chapters || []).map((c) => [c.id, c]));
  const s2Map = new Map((snapshot2.chapters || []).map((c) => [c.id, c]));

  const changedChapters: ChangedChapterDiff[] = [];

  // Check chapters in s2
  for (const [id, c2] of s2Map.entries()) {
    const c1 = s1Map.get(id);
    if (!c1) {
      changedChapters.push({
        chapterId: id,
        chapterTitle: c2.title,
        changeType: 'added',
        wordCountBefore: 0,
        wordCountAfter: c2.wordCount || 0,
      });
    } else if (c1.content !== c2.content || c1.title !== c2.title) {
      changedChapters.push({
        chapterId: id,
        chapterTitle: c2.title,
        changeType: 'modified',
        wordCountBefore: c1.wordCount || 0,
        wordCountAfter: c2.wordCount || 0,
      });
    }
  }

  // Check removed chapters (in s1 not s2)
  for (const [id, c1] of s1Map.entries()) {
    if (!s2Map.has(id)) {
      changedChapters.push({
        chapterId: id,
        chapterTitle: c1.title,
        changeType: 'removed',
        wordCountBefore: c1.wordCount || 0,
        wordCountAfter: 0,
      });
    }
  }

  const metadataChanged =
    JSON.stringify(snapshot1.metadata) !== JSON.stringify(snapshot2.metadata);
  const frontMatterChanged =
    JSON.stringify(snapshot1.frontMatter) !== JSON.stringify(snapshot2.frontMatter);
  const backMatterChanged =
    JSON.stringify(snapshot1.backMatter) !== JSON.stringify(snapshot2.backMatter);

  // Build human-readable summary
  const summaryParts: string[] = [];
  if (wordCountDelta !== 0) {
    summaryParts.push(`${wordCountDelta > 0 ? '+' : ''}${wordCountDelta.toLocaleString()} words`);
  }
  if (chapterCountDelta !== 0) {
    summaryParts.push(
      `${Math.abs(chapterCountDelta)} chapter${Math.abs(chapterCountDelta) > 1 ? 's' : ''} ${
        chapterCountDelta > 0 ? 'added' : 'removed'
      }`
    );
  }
  if (changedChapters.some((c) => c.changeType === 'modified')) {
    const modCount = changedChapters.filter((c) => c.changeType === 'modified').length;
    summaryParts.push(`${modCount} chapter${modCount > 1 ? 's' : ''} edited`);
  }
  if (metadataChanged) summaryParts.push('Metadata updated');
  if (frontMatterChanged) summaryParts.push('Front matter modified');
  if (backMatterChanged) summaryParts.push('Back matter modified');

  const summary = summaryParts.length > 0 ? summaryParts.join(' · ') : 'No significant changes';

  return {
    snapshotId: snapshot2.id,
    comparedToSnapshotId: snapshot1.id,
    wordCountDelta,
    chapterCountDelta,
    changedChapters,
    metadataChanged,
    frontMatterChanged,
    backMatterChanged,
    summary,
  };
}

/**
 * 8. Version History Configuration
 */
const DEFAULT_CONFIG: VersionHistoryConfig = {
  uid: '',
  autoSnapshotOnExport: true,
  autoSnapshotDaily: false,
  retentionDays: null,
  notifyOnAutoSnapshot: false,
};

export async function getVersionConfig(uid: string): Promise<VersionHistoryConfig> {
  if (db) {
    try {
      const docRef = doc(db, 'versionConfigs', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...DEFAULT_CONFIG, ...snap.data(), uid };
      }
    } catch (err) {
      console.warn('Firestore getVersionConfig error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_CONFIGS_KEY}_${uid}`);
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw), uid };
    } catch {}
  }

  return { ...DEFAULT_CONFIG, uid };
}

export async function saveVersionConfig(
  uid: string,
  config: Partial<VersionHistoryConfig>
): Promise<void> {
  const updated: VersionHistoryConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    uid,
  };

  if (db) {
    try {
      await setDoc(doc(db, 'versionConfigs', uid), updated, { merge: true });
    } catch (err) {
      console.error('Firestore saveVersionConfig error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_CONFIGS_KEY}_${uid}`, JSON.stringify(updated));
    } catch {}
  }
}
