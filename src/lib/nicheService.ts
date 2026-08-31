/**
 * KDP Studio — AI Niche Research Service
 * Phase 13A
 * Handles search history persistence, saved niche CRUD, book linking, and rate limiting.
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
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { NicheResult, NicheSearchHistory, SavedNiche, NicheCategory } from '../types/niche';
import { trackFeatureUse } from './featureTracker';

// Local storage and in-memory caches for preview / offline demo mode
const SEARCH_HISTORY_CACHE_PREFIX = 'kdp_niche_searches_';
const SAVED_NICHES_CACHE_PREFIX = 'kdp_saved_niches_';
const RATE_LIMIT_CACHE_PREFIX = 'kdp_niche_ratelimit_';

const inMemorySearchHistory = new Map<string, NicheSearchHistory>();
const inMemorySavedNiches = new Map<string, SavedNiche>();
const inMemoryRateLimits = new Map<string, number[]>(); // uid -> timestamps

// Helper: safe random ID generator
function generateId(prefix: string = 'niche'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Local Cache Helpers
// ---------------------------------------------------------------------------

function getLocalSearchHistory(uid: string): NicheSearchHistory[] {
  const memList = Array.from(inMemorySearchHistory.values()).filter((item) => item.uid === uid);
  if (memList.length > 0) {
    return memList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${SEARCH_HISTORY_CACHE_PREFIX}${uid}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function setLocalSearchHistory(uid: string, history: NicheSearchHistory[]): void {
  history.forEach((item) => inMemorySearchHistory.set(item.id, item));
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`${SEARCH_HISTORY_CACHE_PREFIX}${uid}`, JSON.stringify(history));
    } catch {
      // silent
    }
  }
}

function getLocalSavedNiches(uid: string): SavedNiche[] {
  const memList = Array.from(inMemorySavedNiches.values()).filter((item) => item.uid === uid);
  if (memList.length > 0) {
    return memList.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${SAVED_NICHES_CACHE_PREFIX}${uid}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function setLocalSavedNiches(uid: string, list: SavedNiche[]): void {
  list.forEach((item) => inMemorySavedNiches.set(item.id, item));
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`${SAVED_NICHES_CACHE_PREFIX}${uid}`, JSON.stringify(list));
    } catch {
      // silent
    }
  }
}

// ---------------------------------------------------------------------------
// Rate Limiting (5 searches per hour per user)
// ---------------------------------------------------------------------------

export async function checkHourlyRateLimit(
  uid: string
): Promise<{ allowed: boolean; remaining: number; resetMinutes: number }> {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const MAX_PER_HOUR = 5;
  const now = Date.now();

  let timestamps: number[] = inMemoryRateLimits.get(uid) || [];

  if (timestamps.length === 0 && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${RATE_LIMIT_CACHE_PREFIX}${uid}`);
      if (raw) timestamps = JSON.parse(raw);
    } catch {}
  }

  // Filter for requests within the last hour
  const recent = timestamps.filter((t) => now - t < ONE_HOUR_MS);
  inMemoryRateLimits.set(uid, recent);

  const allowed = recent.length < MAX_PER_HOUR;
  const remaining = Math.max(0, MAX_PER_HOUR - recent.length);
  const oldest = recent.length > 0 ? recent[0] : now;
  const resetMinutes = Math.max(1, Math.ceil((oldest + ONE_HOUR_MS - now) / (60 * 1000)));

  return { allowed, remaining, resetMinutes };
}

export async function recordNicheSearch(uid: string): Promise<void> {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const now = Date.now();

  let timestamps: number[] = inMemoryRateLimits.get(uid) || [];
  timestamps = timestamps.filter((t) => now - t < ONE_HOUR_MS);
  timestamps.push(now);
  inMemoryRateLimits.set(uid, timestamps);

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(`${RATE_LIMIT_CACHE_PREFIX}${uid}`, JSON.stringify(timestamps));
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// Search History CRUD
// ---------------------------------------------------------------------------

/**
 * Saves a completed niche search and its results into Firestore /nicheSearchHistory/{id}
 */
export async function saveSearchHistory(
  uid: string,
  queryText: string,
  category: NicheCategory | 'all' | string,
  results: NicheResult[]
): Promise<string> {
  const searchId = generateId('search');
  const nowIso = new Date().toISOString();

  const record: NicheSearchHistory = {
    id: searchId,
    uid,
    query: queryText,
    category: (category as NicheCategory) || 'all',
    results,
    savedNiches: [],
    createdAt: nowIso,
  };

  // 1. Update in-memory & local storage
  const localList = getLocalSearchHistory(uid);
  localList.unshift(record);
  setLocalSearchHistory(uid, localList.slice(0, 50));

  // 2. Persist to Firestore if available
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'nicheSearchHistory', searchId);
      await setDoc(docRef, {
        ...record,
        createdAt: nowIso,
      });
    } catch (err) {
      console.warn('Firebase saveSearchHistory warning, cached locally:', err);
    }
  }

  trackFeatureUse(uid, 'niche_research_run', { query: queryText, count: results.length }).catch(console.error);

  return searchId;
}

/**
 * Retrieves the 20 most recent search history records for a user
 */
export async function getUserSearchHistory(uid: string): Promise<NicheSearchHistory[]> {
  if (!uid) return [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'nicheSearchHistory'),
        where('uid', '==', uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: NicheSearchHistory[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        const trimmed = list.slice(0, 20);
        setLocalSearchHistory(uid, trimmed);
        return trimmed;
      }
    } catch (err) {
      console.warn('Firebase getUserSearchHistory error, using local fallback:', err);
    }
  }

  return getLocalSearchHistory(uid)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 20);
}

/**
 * Star or unstar a niche inside a search history record
 */
export async function toggleStarSearchNiche(searchId: string, nicheId: string): Promise<string[]> {
  let searchRecord = inMemorySearchHistory.get(searchId);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'nicheSearchHistory', searchId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as NicheSearchHistory;
        const currentSaved = Array.isArray(data.savedNiches) ? data.savedNiches : [];
        const isStarred = currentSaved.includes(nicheId);
        const updatedSaved = isStarred
          ? currentSaved.filter((id) => id !== nicheId)
          : [...currentSaved, nicheId];

        await updateDoc(docRef, { savedNiches: updatedSaved });
        return updatedSaved;
      }
    } catch (err) {
      console.warn('Firebase toggleStarSearchNiche error:', err);
    }
  }

  if (searchRecord) {
    const currentSaved = searchRecord.savedNiches || [];
    const updated = currentSaved.includes(nicheId)
      ? currentSaved.filter((id) => id !== nicheId)
      : [...currentSaved, nicheId];
    searchRecord.savedNiches = updated;
    inMemorySearchHistory.set(searchId, searchRecord);
    return updated;
  }

  return [];
}

// ---------------------------------------------------------------------------
// Saved Niches CRUD (/savedNiches/{id})
// ---------------------------------------------------------------------------

/**
 * Saves a niche result to the user's permanent saved/pinned niches
 */
export async function saveNiche(
  uid: string,
  nicheResult: NicheResult,
  notes: string = ''
): Promise<string> {
  const savedId = generateId('saved_niche');
  const nowIso = new Date().toISOString();

  const savedRecord: SavedNiche = {
    id: savedId,
    uid,
    nicheResult,
    notes,
    status: 'considering',
    linkedBookId: null,
    savedAt: nowIso,
  };

  // Local sync
  const localList = getLocalSavedNiches(uid);
  localList.unshift(savedRecord);
  setLocalSavedNiches(uid, localList);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'savedNiches', savedId);
      await setDoc(docRef, savedRecord);
    } catch (err) {
      console.warn('Firebase saveNiche error, saved locally:', err);
    }
  }

  return savedId;
}

/**
 * Retrieves all saved niches for a user ordered by savedAt desc
 */
export async function getUserSavedNiches(uid: string): Promise<SavedNiche[]> {
  if (!uid) return [];

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'savedNiches'),
        where('uid', '==', uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: SavedNiche[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        list.sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime());
        setLocalSavedNiches(uid, list);
        return list;
      }
    } catch (err) {
      console.warn('Firebase getUserSavedNiches error, using local fallback:', err);
    }
  }

  return getLocalSavedNiches(uid).sort(
    (a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()
  );
}

/**
 * Updates a saved niche (e.g. status, notes)
 */
export async function updateSavedNiche(
  savedNicheId: string,
  data: Partial<SavedNiche>
): Promise<void> {
  // Update in-memory
  const existing = inMemorySavedNiches.get(savedNicheId);
  if (existing) {
    const updated = { ...existing, ...data };
    inMemorySavedNiches.set(savedNicheId, updated);
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'savedNiches', savedNicheId);
      await updateDoc(docRef, data);
    } catch (err) {
      console.warn('Firebase updateSavedNiche error:', err);
    }
  }
}

/**
 * Deletes a saved niche
 */
export async function deleteSavedNiche(savedNicheId: string): Promise<void> {
  inMemorySavedNiches.delete(savedNicheId);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'savedNiches', savedNicheId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firebase deleteSavedNiche error:', err);
    }
  }
}

/**
 * Associates a saved niche with a book project
 */
export async function linkNicheToBook(savedNicheId: string, bookId: string): Promise<void> {
  await updateSavedNiche(savedNicheId, { linkedBookId: bookId });
}
