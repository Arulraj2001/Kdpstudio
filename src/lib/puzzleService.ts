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

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'puzzleBooks', bookId);
      await updateDoc(docRef, updates);
    } catch (err) {
      console.warn('Firestore updatePuzzleBook error:', err);
    }
  }

  // Update local cache
  const local = getLocalPuzzleBooks();
  const idx = local.findIndex((b) => b.id === bookId);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates };
    setLocalPuzzleBooks(local);
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
  if (!book) return;

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

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'puzzleBooks'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((docSnap) => docSnap.data() as PuzzleBook);
      }
    } catch (err) {
      console.warn('Firestore getUserPuzzleBooks query error, reading from local fallback:', err);
    }
  }

  return getLocalPuzzleBooks().filter((b) => b.uid === uid || !b.uid);
}

/**
 * Retrieves a single puzzle book by ID
 */
export async function getPuzzleBook(bookId: string): Promise<PuzzleBook | null> {
  if (!bookId) return null;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'puzzleBooks', bookId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as PuzzleBook;
      }
    } catch (err) {
      console.warn('Firestore getPuzzleBook error:', err);
    }
  }

  const local = getLocalPuzzleBooks();
  return local.find((b) => b.id === bookId) || null;
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
