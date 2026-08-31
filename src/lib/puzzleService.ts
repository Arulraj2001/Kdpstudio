/**
 * KDP Studio — Puzzle Books Persistence Service
 * Manages Firestore CRUD operations for puzzle books and generated pages.
 * Phase 11 — KDP Studio
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { PuzzleBook, PuzzlePage } from '../types/puzzle';

const LOCAL_STORAGE_KEY = 'kdp_puzzle_books_cache';
const inMemoryPuzzleBooks = new Map<string, PuzzleBook>();

function getLocalPuzzleBooks(): PuzzleBook[] {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : Array.from(inMemoryPuzzleBooks.values());
    } catch {
      return Array.from(inMemoryPuzzleBooks.values());
    }
  }
  return Array.from(inMemoryPuzzleBooks.values());
}

function setLocalPuzzleBooks(books: PuzzleBook[]): void {
  inMemoryPuzzleBooks.clear();
  books.forEach((b) => inMemoryPuzzleBooks.set(b.id, b));
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(books));
    } catch (e) {
      // silent
    }
  }
}

/**
 * Saves a new puzzle book to Firestore / local storage
 */
export async function savePuzzleBook(book: PuzzleBook): Promise<string> {
  const bookId = book.id || `puz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const formattedBook: PuzzleBook = {
    ...book,
    id: bookId,
    createdAt: book.createdAt || nowIso,
    updatedAt: nowIso,
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'puzzleBooks', bookId);
      await setDoc(docRef, formattedBook);
    } catch (err) {
      console.warn('Firestore savePuzzleBook warning, saving to local cache:', err);
    }
  }

  // Always keep local cache synced
  const local = getLocalPuzzleBooks().filter((b) => b.id !== bookId);
  local.unshift(formattedBook);
  setLocalPuzzleBooks(local);

  return bookId;
}

/**
 * Updates an existing puzzle book document
 */
export async function updatePuzzleBook(
  bookId: string,
  data: Partial<PuzzleBook>
): Promise<void> {
  const nowIso = new Date().toISOString();
  const updates = {
    ...data,
    updatedAt: nowIso,
  };

  // 1. Update in-memory & local cache immediately
  const local = getLocalPuzzleBooks();
  const idx = local.findIndex((b) => b.id === bookId);
  let updatedBook: PuzzleBook;
  if (idx !== -1) {
    updatedBook = { ...local[idx], ...updates };
    local[idx] = updatedBook;
  } else {
    const existing = inMemoryPuzzleBooks.get(bookId) || ({} as any);
    updatedBook = { ...existing, ...updates, id: bookId };
    local.unshift(updatedBook);
  }
  setLocalPuzzleBooks(local);

  // 2. Persist to Firestore if available
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'puzzleBooks', bookId);
      await setDoc(docRef, updatedBook, { merge: true });
    } catch (err) {
      console.warn('Firestore updatePuzzleBook error:', err);
    }
  }
}

/**
 * Updates a specific page within a puzzle book
 */
export async function updatePuzzlePage(
  bookId: string,
  pageId: string,
  data: Partial<PuzzlePage>
): Promise<void> {
  const book = await getPuzzleBook(bookId);
  if (!book || !book.pages) return;

  const updatedPages = book.pages.map((p) => {
    if (p.id === pageId) {
      return { ...p, ...data };
    }
    return p;
  });

  await updatePuzzleBook(bookId, { pages: updatedPages });
}

/**
 * Retrieves all puzzle books created by a specific user
 */
export async function getUserPuzzleBooks(uid: string): Promise<PuzzleBook[]> {
  if (!uid) return [];

  let firestoreBooks: PuzzleBook[] = [];
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'puzzleBooks'),
        where('uid', '==', uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        firestoreBooks = snap.docs.map((docSnap) => docSnap.data() as PuzzleBook);
      }
    } catch (err) {
      console.warn('Firestore getUserPuzzleBooks query error, reading from local fallback:', err);
    }
  }

  const localBooks = getLocalPuzzleBooks().filter((b) => b.uid === uid || !b.uid);
  
  // Merge books, giving preference to the version with more pages
  const bookMap = new Map<string, PuzzleBook>();
  [...localBooks, ...firestoreBooks].forEach((b) => {
    const existing = bookMap.get(b.id);
    if (!existing || (b.pages && b.pages.length > (existing.pages?.length || 0))) {
      bookMap.set(b.id, b);
    }
  });

  return Array.from(bookMap.values()).sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });
}

/**
 * Retrieves a single puzzle book by ID with full pages preservation
 */
export async function getPuzzleBook(bookId: string): Promise<PuzzleBook | null> {
  if (!bookId) return null;

  let firestoreBook: PuzzleBook | null = null;
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'puzzleBooks', bookId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        firestoreBook = snap.data() as PuzzleBook;
      }
    } catch (err) {
      console.warn('Firestore getPuzzleBook error:', err);
    }
  }

  const local = getLocalPuzzleBooks();
  const localBook = local.find((b) => b.id === bookId) || inMemoryPuzzleBooks.get(bookId) || null;

  if (firestoreBook && localBook) {
    const firestorePages = firestoreBook.pages || [];
    const localPages = localBook.pages || [];
    const bestPages = localPages.length >= firestorePages.length ? localPages : firestorePages;
    return {
      ...firestoreBook,
      ...localBook,
      pages: bestPages,
      status: bestPages.length > 0 ? 'complete' : (localBook.status || firestoreBook.status),
      totalPages: bestPages.length > 0 ? bestPages.length + 3 : (localBook.totalPages || firestoreBook.totalPages),
    };
  }

  return firestoreBook || localBook;
}

/**
 * Deletes a puzzle book
 */
export async function deletePuzzleBook(bookId: string): Promise<void> {
  if (!bookId) return;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'puzzleBooks', bookId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deletePuzzleBook error:', err);
    }
  }

  const local = getLocalPuzzleBooks().filter((b) => b.id !== bookId);
  setLocalPuzzleBooks(local);
}
