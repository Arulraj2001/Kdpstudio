/**
 * KDP Studio - Book Cloud Sync Manager (Phase 2)
 *
 * Bridges the localStorage-first Zustand book store to Firestore:
 *  - hydrate: on auth, cloud owner books replace the local demo sample.
 *  - first-signup migration: if cloud empty but local has real (non-sample) books,
 *    push them up once (onboarding lift, no data-lossy deletes.
 *  - autosave: debounced observer flushes local edits up to the cloud (merge.
 * Guard: demo/sample books never leave the browser.
 */
import { useBookStore } from './store';
import { getCloudBooks, syncBooksToCloud, shouldSyncToCloud } from './bookService';
import type { Book } from '../types';

const SAMPLE = 'book_sample_';

let activeUid: string | null = null;
let hydratedUid: string | null = null;
let lastSnapshot: string = '';
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;

export function getBookSyncUid(): string | null { return activeUid; }
export function isBookSyncActive(): boolean { return activeUid !== null; }
export function isBooksHydrated(): boolean { return hydratedUid !== null; }

function withoutSamples(all: Book[]): Book[] {
  return all.filter((b) => !b || !b.id.startsWith(SAMPLE));
}
function snapshotOf(books: Book[]): string { return JSON.stringify(withoutSamples(books)); }

export async function hydrateBooksFromCloud(uid: string): Promise<{ loaded: number; migrated: number }> {
  if (!uid) return { loaded:0, migrated:0 };
  const cloud = await getCloudBooks(uid).catch(() => [] as Book[]);
  if (cloud.length > 0) {
    const loaded = cloud.filter(shouldSyncToCloud);
    if (loaded.length > 0) { useBookStore.getState().replaceAllBooks(loaded); }
    hydratedUid = uid;
    lastSnapshot = snapshotOf(useBookStore.getState().books);
    return { loaded: loaded.length, migrated:0 };
  }
  const local = withoutSamples(useBookStore.getState().books);
  if (local.length > 0) {
    const res = await syncBooksToCloud(uid, local);
    return { loaded:0, migrated:res.saved };
  }
  hydratedUid = uid;
  lastSnapshot = snapshotOf(useBookStore.getState().books);
  return { loaded:0, migrated:0 };
}

function scheduleFlush(): void {
  if (!activeUid) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { void flush(); }, 1600);
}

async function flush(): Promise<void> {
  syncTimer = null;
  const uid = activeUid; if (!uid) return;
  const books = withoutSamples(useBookStore.getState().books);
  const snap = snapshotOf(books);
  if (snap === lastSnapshot) return;
  lastSnapshot = snap;
  await syncBooksToCloud(uid, books);
}

export function startBookSync(uid: string): void {
  if (!uid || activeUid === uid) return;
  activeUid = uid;
  lastSnapshot = '';
  if (unsubscribe) unsubscribe();
  unsubscribe = useBookStore.subscribe(() => scheduleFlush());
  void hydrateBooksFromCloud(uid);
}

export function teardownBookSync(): void {
  if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  activeUid = null;
  hydratedUid = null;
  lastSnapshot = '';
}
