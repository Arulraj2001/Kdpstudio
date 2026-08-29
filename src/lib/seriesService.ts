/**
 * KDP Studio — Book Series Service
 * Handles CRUD, plan gate validation, volume management, and book linking.
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { getUserDocument } from './userService';
import { 
  BookSeries, 
  SeriesVolume, 
  interpolateColors, 
  DEFAULT_SERIES_COVER_STYLE, 
  DEFAULT_SERIES_SPINE_STYLE, 
  DEFAULT_SERIES_COLOR_SCHEME 
} from '../types/series';
import { Book } from '../types';

const SERIES_CACHE_PREFIX = 'kdp_series_cache_';
const inMemorySeries = new Map<string, BookSeries>();

function getLocalUserSeries(uid: string): BookSeries[] {
  const memList = Array.from(inMemorySeries.values()).filter((s) => s.uid === uid);
  if (memList.length > 0) return memList;

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${SERIES_CACHE_PREFIX}${uid}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function setLocalUserSeries(uid: string, seriesList: BookSeries[]): void {
  seriesList.forEach((s) => inMemorySeries.set(s.id, s));
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`${SERIES_CACHE_PREFIX}${uid}`, JSON.stringify(seriesList));
    } catch {
      // silent
    }
  }
}

/**
 * Calculates the primaryColors array for all volumes in a series based on its color scheme
 */
export function computeVolumeColors(
  scheme: BookSeries['colorScheme'],
  totalVolumes: number
): string[] {
  const count = Math.max(1, totalVolumes);
  const palette = scheme.palette && scheme.palette.length > 0 ? scheme.palette : ['#7c3aed'];

  if (scheme.mode === 'fixed') {
    return Array(count).fill(palette[0]);
  } else if (scheme.mode === 'rotating') {
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
  } else if (scheme.mode === 'progressive') {
    const start = scheme.startColor || palette[0] || '#7c3aed';
    const end = scheme.endColor || palette[palette.length - 1] || '#3b82f6';
    return interpolateColors(start, end, count);
  }
  return Array(count).fill(palette[0]);
}

/**
 * Creates a new Book Series with plan limit validation.
 * Starter plan: 1 series max. Pro/Agency/Lifetime: Unlimited. Free: blocked.
 */
export async function createSeries(
  uid: string,
  data: Omit<BookSeries, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (!uid) throw new Error('User ID is required to create a series');

  // Check plan limits
  const userDoc = await getUserDocument(uid);
  const plan = userDoc?.plan || 'free';

  const existingSeries = await getUserSeries(uid);
  if (plan === 'free') {
    throw new Error('PLAN_LIMIT: Series Manager is available on Starter plan and above. Please upgrade.');
  }
  if (plan === 'starter' && existingSeries.length >= 1) {
    throw new Error('PLAN_LIMIT: Starter plan allows 1 series. Upgrade to Pro for unlimited series.');
  }

  const seriesId = `series_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const totalVols = Math.max(2, data.totalVolumes || 3);
  const primaryColors = computeVolumeColors(data.colorScheme || DEFAULT_SERIES_COLOR_SCHEME, totalVols);

  const newSeries: BookSeries = {
    id: seriesId,
    uid,
    title: data.title || 'Untitled Series',
    subtitle: data.subtitle || '',
    description: data.description || '',
    genre: data.genre || 'General Fiction',
    targetAudience: data.targetAudience || 'General Audience',
    bookIds: data.bookIds || [],
    puzzleBookIds: data.puzzleBookIds || [],
    totalVolumes: totalVols,
    volumes: data.volumes || [],
    coverStyle: data.coverStyle || DEFAULT_SERIES_COVER_STYLE,
    spineStyle: data.spineStyle || DEFAULT_SERIES_SPINE_STYLE,
    colorScheme: {
      ...(data.colorScheme || DEFAULT_SERIES_COLOR_SCHEME),
      primaryColors,
    },
    seriesKeywords: data.seriesKeywords || [],
    amazonSeriesUrl: data.amazonSeriesUrl || '',
    status: data.status || 'planning',
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      const seriesRef = doc(db, 'bookSeries', seriesId);
      await setDoc(seriesRef, newSeries);
    } catch (err) {
      console.warn('Failed to save series in Firestore, using local cache:', err);
    }
  }

  // Update local cache
  const updatedList = [newSeries, ...existingSeries.filter((s) => s.id !== seriesId)];
  setLocalUserSeries(uid, updatedList);
  inMemorySeries.set(seriesId, newSeries);

  return seriesId;
}

/**
 * Retrieves all book series for a user
 */
export async function getUserSeries(uid: string): Promise<BookSeries[]> {
  if (!uid) return [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'bookSeries'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list: BookSeries[] = [];
        snap.forEach((d) => list.push(d.data() as BookSeries));
        setLocalUserSeries(uid, list);
        return list;
      }
    } catch (err) {
      console.warn('Error fetching user series from Firestore:', err);
    }
  }

  return getLocalUserSeries(uid);
}

/**
 * Retrieves a single series by ID
 */
export async function getSeries(seriesId: string): Promise<BookSeries | null> {
  if (!seriesId) return null;

  if (inMemorySeries.has(seriesId)) {
    return inMemorySeries.get(seriesId)!;
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'bookSeries', seriesId));
      if (snap.exists()) {
        const item = snap.data() as BookSeries;
        inMemorySeries.set(seriesId, item);
        return item;
      }
    } catch (err) {
      console.warn('Error fetching series document:', err);
    }
  }

  // Search localStorage caches
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SERIES_CACHE_PREFIX)) {
        try {
          const list: BookSeries[] = JSON.parse(localStorage.getItem(key) || '[]');
          const match = list.find((s) => s.id === seriesId);
          if (match) return match;
        } catch {}
      }
    }
  }

  return null;
}

/**
 * Updates a series document
 */
export async function updateSeries(
  seriesId: string,
  data: Partial<BookSeries>
): Promise<void> {
  const current = await getSeries(seriesId);
  if (!current) throw new Error('Series not found');

  const now = new Date().toISOString();
  let updatedColorScheme = data.colorScheme || current.colorScheme;
  const totalVols = data.totalVolumes || current.totalVolumes;

  if (data.colorScheme || data.totalVolumes) {
    const primaryColors = computeVolumeColors(updatedColorScheme, totalVols);
    updatedColorScheme = { ...updatedColorScheme, primaryColors };
  }

  const merged: BookSeries = {
    ...current,
    ...data,
    colorScheme: updatedColorScheme,
    totalVolumes: totalVols,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'bookSeries', seriesId);
      await updateDoc(ref, {
        ...data,
        colorScheme: updatedColorScheme,
        totalVolumes: totalVols,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('Firestore updateSeries failed, keeping local:', err);
    }
  }

  inMemorySeries.set(seriesId, merged);
  const userList = getLocalUserSeries(current.uid);
  setLocalUserSeries(
    current.uid,
    userList.map((s) => (s.id === seriesId ? merged : s))
  );
}

/**
 * Deletes a series document without deleting individual books.
 * Unlinks books from the series.
 */
export async function deleteSeries(seriesId: string): Promise<void> {
  const current = await getSeries(seriesId);
  if (!current) return;

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'bookSeries', seriesId));
    } catch (err) {
      console.warn('Firestore deleteSeries error:', err);
    }
  }

  inMemorySeries.delete(seriesId);
  const userList = getLocalUserSeries(current.uid);
  setLocalUserSeries(
    current.uid,
    userList.filter((s) => s.id !== seriesId)
  );

  // Unlink books from series in local storage if present
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const rawBooks = localStorage.getItem('kdp_books_store');
      if (rawBooks) {
        const books: Book[] = JSON.parse(rawBooks);
        const updatedBooks = books.map((b) => {
          if ((b as any).seriesId === seriesId) {
            const copy = { ...b };
            delete (copy as any).seriesId;
            delete (copy as any).volumeNumber;
            return copy;
          }
          return b;
        });
        localStorage.setItem('kdp_books_store', JSON.stringify(updatedBooks));
      }
    } catch {}
  }
}

/**
 * Adds a book to a series at a given volume position
 */
export async function addBookToSeries(
  seriesId: string,
  bookId: string,
  volumeNumber: number
): Promise<void> {
  const current = await getSeries(seriesId);
  if (!current) throw new Error('Series not found');

  const bookIds = [...current.bookIds];
  const targetIdx = Math.max(0, volumeNumber - 1);

  // Remove book if already in list to avoid duplicates
  const filtered = bookIds.filter((id) => id !== bookId);

  // Insert at target index
  if (targetIdx >= filtered.length) {
    filtered.push(bookId);
  } else {
    filtered.splice(targetIdx, 0, bookId);
  }

  await updateSeries(seriesId, {
    bookIds: filtered,
    totalVolumes: Math.max(current.totalVolumes, filtered.length),
  });

  // Also tag the book document with seriesId and volumeNumber in localStorage
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const rawBooks = localStorage.getItem('kdp_books_store');
      if (rawBooks) {
        const books: Book[] = JSON.parse(rawBooks);
        const updatedBooks = books.map((b) => {
          if (b.id === bookId) {
            return { ...b, seriesId, volumeNumber };
          }
          return b;
        });
        localStorage.setItem('kdp_books_store', JSON.stringify(updatedBooks));
      }
    } catch {}
  }
}

/**
 * Removes a book from a series
 */
export async function removeBookFromSeries(
  seriesId: string,
  bookId: string
): Promise<void> {
  const current = await getSeries(seriesId);
  if (!current) return;

  const filtered = current.bookIds.filter((id) => id !== bookId);
  await updateSeries(seriesId, { bookIds: filtered });
}

/**
 * Reorders series books to match a new ID array
 */
export async function reorderSeriesBooks(
  seriesId: string,
  newOrder: string[]
): Promise<void> {
  await updateSeries(seriesId, { bookIds: newOrder });
}

/**
 * Compiles a list of SeriesVolume objects (existing books + planned placeholders)
 */
export async function getSeriesVolumes(seriesId: string): Promise<SeriesVolume[]> {
  const current = await getSeries(seriesId);
  if (!current) return [];

  // Read existing books from local store
  let userBooks: Book[] = [];
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('kdp_books_store');
      if (raw) userBooks = JSON.parse(raw);
    } catch {}
  }

  const total = Math.max(current.totalVolumes, current.bookIds.length);
  const volumes: SeriesVolume[] = [];

  for (let volNum = 1; volNum <= total; volNum++) {
    const bookId = current.bookIds[volNum - 1] || null;
    const existingBook = bookId ? userBooks.find((b) => b.id === bookId) : null;

    if (existingBook) {
      const pubDate = existingBook.updatedAt
        ? typeof existingBook.updatedAt === 'string'
          ? existingBook.updatedAt
          : (existingBook.updatedAt as Date).toISOString()
        : null;

      volumes.push({
        volumeNumber: volNum,
        bookId: existingBook.id,
        title: existingBook.title,
        subtitle: existingBook.subtitle || '',
        status: (existingBook as any).status === 'published' ? 'published' : 'writing',
        publishedDate: pubDate,
        amazonUrl: (existingBook as any).amazonUrl || null,
        coverImageUrl: existingBook.coverImage || null,
        pageCount: existingBook.chapters?.length ? existingBook.chapters.length * 5 : 120,
        price: existingBook.metadata?.price || existingBook.kdpMetadata?.price || 4.99,
      });
    } else {
      // Planned placeholder
      const customVol = current.volumes?.find((v) => v.volumeNumber === volNum);
      volumes.push({
        volumeNumber: volNum,
        bookId: null,
        title: customVol?.title || `Volume ${volNum}`,
        subtitle: customVol?.subtitle || `Planned Volume #${volNum}`,
        status: 'planned',
        publishedDate: null,
        amazonUrl: null,
        coverImageUrl: null,
        pageCount: null,
        price: null,
      });
    }
  }

  return volumes;
}

/**
 * Returns a book with series branding, keywords, and title formatting applied
 */
export function applySeriesStyleToBook(
  series: BookSeries,
  volumeNumber: number,
  book: Partial<Book>
): Partial<Book> {
  const seriesKeywords = series.seriesKeywords || [];
  const currentKeywords = book.metadata?.keywords || book.kdpMetadata?.keywords || [];
  const mergedKeywords = Array.from(new Set([...currentKeywords, ...seriesKeywords])).slice(0, 7);

  const updatedMetadata = {
    description: book.metadata?.description || book.kdpMetadata?.description || series.description || '',
    keywords: mergedKeywords,
    categories: book.metadata?.categories || book.kdpMetadata?.categories || [series.genre],
    price: book.metadata?.price || book.kdpMetadata?.price || 4.99,
    royaltyPlan: book.metadata?.royaltyPlan || book.kdpMetadata?.royaltyPlan || '70',
  };

  return {
    ...book,
    genre: book.genre || series.genre,
    metadata: updatedMetadata as any,
    kdpMetadata: updatedMetadata as any,
    seriesId: series.id,
    volumeNumber,
  } as any;
}
