/**
 * KDP Studio - Cloud Book Sync Service (Phase 2)
 *
 * Offline-first persistence layer for user manuscripts.
 * Guard rails:
 *   - Demo/sample books never sync to a real user's cloud library.
 *   - syncBooksToCloud is idempotent and never auto-deletes remote books that are
 *     absent locally, avoiding destructive data loss until a deliberate
 *     reconciliation pass is built.
 *   - DB functions lazy-load the Firestore client via import(), keeping this module
 *     safe to import in SSR / node test runners where window is undefined.
 */
import type { Book } from '../types';
import type { Firestore } from 'firebase/firestore';

const SAMPLE_PREFIX = 'book_sample_';

/** True when a book record is demo/sample content (must never reach the cloud). */
export function isDemoOrSampleBook(book: Book | any): boolean {
  if (!book || !book.id || typeof book.id !== 'string') return true;
  if (book.id.startsWith(SAMPLE_PREFIX)) return true;
  if ((book as any).status === 'demo') return true;
  return false;
}

/** Whether a book should participate in the cloud sync (real user-owned content). */
export function shouldSyncToCloud(book: Book | any): boolean {
  if (isDemoOrSampleBook(book)) return false;
  if (!book.title) return false;
  return true;
}

/** Attach owner uid (required by the Firestore rules) while preserving timestamps. */
export function stampOwnership(book: Book | any, uid: string): Book & { uid: string } {
  const now = new Date().toISOString();
  return {
    ...book,
    uid: String(uid),
    createdAt: (book as any).createdAt || now,
    updatedAt: (book as any).updatedAt || now,
  } as Book & { uid: string };
}

function updatedAtMs(b: Book | any): number {
  const v = (b as any).updatedAt;
  if (!v) return 0;
  const t = typeof v === 'number' ? v : (v?.toDate?.()?.getTime() ?? new Date(String(v)).getTime());
  return Number.isNaN(t)? 0 : t;
}

/** Merge two book lists dedupe-ing by id, preferring the latest-updated copy. Deterministic, no remote deletion. */
export function mergeBookLists(local: Book[], incoming: Book[]): Book[] {
  const map = new Map<string, Book>();
  const upsert = (b: Book | any) => {
    if (!b || !b.id) return;
    const ex = map.get(b.id);
    if (!ex) { map.set(b.id, b as Book); return; }
    if (updatedAtMs(b) > updatedAtMs(ex)) map.set(b.id, b as Book);
  };
  local.forEach(upsert);
  incoming.forEach(upsert);
  return Array.from(map.values());
}

// Lazy Firebase access (SSR-safe) -----------------------------------------
async function getDb(): Promise<Firestore | null> {
  try {
    const m = await import('./firebase');
    return (m.db ?? null) as Firestore | null;
  } catch { return null; }
}

async function getFs(): Promise<any> {
  return await import('firebase/firestore');
}

const MAX_QUERY = 250;

/** Fetch all owner books for uid from Firestore, newest-first locally (avoids composite index). */
export async function getCloudBooks(uid: string): Promise<Book[]> {
  if (!uid) return [];
  const db = await getDb(); if (!db) return [];
  try {
    const { collection, query, where, getDocs } = await getFs();
    const q = query(collection(db, 'books'), where('uid', '==', uid));
    const snap = await getDocs(q);
    const out: Book[] = [];
    snap.docs.forEach((d: any) => {
      const data = d.data() as any;
      if (data && data.id) out.push({ id: d.id, ...data } as Book);
    });
    out.sort((a,b) => updatedAtMs(b) - updatedAtMs(a));
    return out.slice(0, MAX_QUERY);
  } catch (err) {
    console.warn('[bookService] getCloudBooks:', err);
    return [];
  }
}

/** Upsert a single owned book document to Firestore. Returns true on success or offline/no-op. */
export async function saveBookToCloud(uid: string, book: Book): Promise<boolean> {
  if (!uid || !book || !book.id || isDemoOrSampleBook(book)) return false;
  const db = await getDb(); if (!db) return true;
  try {
    const { doc, setDoc } = await getFs();
    await setDoc(doc(db,'books',book.id), stampOwnership(book,uid), { merge: true });
    return true;
  } catch (err) {
    console.warn('[bookService] saveBookToCloud:', err);
    return false;
  }
}

/** Delete an owner book document from Firestore. Returns true on success. */
export async function deleteBookFromCloud(uid: string, bookId: string): Promise<boolean> {
  if (!uid || !bookId) return false;
  const db = await getDb(); if (!db) return true;
  try {
    const { doc, deleteDoc } = await getFs();
    await deleteDoc(doc(db,'books',bookId));
    return true;
  } catch (err) {
    console.warn('[bookService] deleteBookFromCloud:', err);
    return false;
  }
}

/** Idempotently sync a set of books up to Firestore (merging, never deleting remote. */
export async function syncBooksToCloud(
  uid: string,
  books: Book[]
): Promise<{ saved: number; skipped: number }> {
  if (!uid || !Array.isArray(books) || books.length === 0) {
    return { saved:0, skipped:0 };
  }
  const eligible = books.filter(shouldSyncToCloud);
  let saved=0; let skipped=0;
  // Serialize writes to keep the write budget small (books are small docs.
  for (const b of eligible) {
    const ok = await saveBookToCloud(uid, b);
    if (ok) saved++; else skipped++;
  }
  return { saved, skipped };
}
