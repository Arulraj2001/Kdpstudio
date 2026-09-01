/**
 * KDP Studio — Analytics & Royalty Service
 * Phase 15A
 */

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
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BookPerformanceEntry,
  PublishedBook,
  PublishingGoal,
  PublishingStreak,
  StreakMilestone,
  AnalyticsSummary,
  SalesPeriod,
  MarketPlace,
} from '../types/analytics';

/**
 * Approximate hardcoded exchange rates to 1 USD
 */
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 83.5,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.5,
  BRL: 5.1,
  MXN: 17.2,
};

/**
 * Converts any marketplace currency to approximate USD
 */
export function convertToUSD(amount: number, fromCurrency: string = 'USD'): number {
  if (!amount || isNaN(amount)) return 0;
  const rate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1.0;
  return Number((amount / rate).toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCALSTORAGE FALLBACK HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  BOOKS: 'kdp_published_books',
  ENTRIES: 'kdp_performance_entries',
  GOALS: 'kdp_publishing_goals',
  STREAKS: 'kdp_publishing_streaks',
};

function getLocal<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocal<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLISHED BOOKS CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function addPublishedBook(
  uid: string,
  book: Omit<
    PublishedBook,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'totalUnitsSold'
    | 'totalRevenue'
    | 'totalRoyalties'
    | 'averageBsr'
    | 'bestBsr'
    | 'bestBsrDate'
    | 'lastUpdated'
  >
): Promise<string> {
  const id = `pub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const newBook: PublishedBook = {
    ...book,
    id,
    uid,
    totalUnitsSold: 0,
    totalRevenue: 0,
    totalRoyalties: 0,
    averageBsr: null,
    bestBsr: null,
    bestBsrDate: null,
    lastUpdated: now.substring(0, 10),
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (db) {
      await setDoc(doc(db, 'publishedBooks', id), newBook);
    }
  } catch (err) {
    console.warn('Firestore addPublishedBook fallback to localStorage:', err);
  }

  // Always update LocalStorage
  const localBooks = getLocal<PublishedBook>(STORAGE_KEYS.BOOKS);
  setLocal(STORAGE_KEYS.BOOKS, [newBook, ...localBooks]);

  // Update publishing streak
  await updatePublishingStreak(uid).catch(() => {});
  // Update goal progress
  await updateGoalProgress(uid).catch(() => {});

  return id;
}

export async function getUserPublishedBooks(uid: string): Promise<PublishedBook[]> {
  try {
    if (db) {
      const q = query(
        collection(db, 'publishedBooks'),
        where('uid', '==', uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs
          .map((d) => d.data() as PublishedBook)
          .sort((a, b) => (b.publishedDate || '').localeCompare(a.publishedDate || ''));
      }
    }
  } catch (err) {
    console.warn('Firestore getUserPublishedBooks fallback:', err);
  }

  // Fallback to localStorage
  const local = getLocal<PublishedBook>(STORAGE_KEYS.BOOKS);
  return local.filter((b) => b.uid === uid).sort((a, b) => (b.publishedDate || '').localeCompare(a.publishedDate || ''));
}

export async function getPublishedBook(bookId: string): Promise<PublishedBook | null> {
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'publishedBooks', bookId));
      if (snap.exists()) {
        return snap.data() as PublishedBook;
      }
    }
  } catch (err) {
    console.warn('Firestore getPublishedBook fallback:', err);
  }

  const local = getLocal<PublishedBook>(STORAGE_KEYS.BOOKS);
  return local.find((b) => b.id === bookId) || null;
}

export async function updatePublishedBook(bookId: string, data: Partial<PublishedBook>): Promise<void> {
  const now = new Date().toISOString();
  const updatePayload = { ...data, updatedAt: now };

  try {
    if (db) {
      await updateDoc(doc(db, 'publishedBooks', bookId), updatePayload);
    }
  } catch (err) {
    console.warn('Firestore updatePublishedBook fallback:', err);
  }

  const local = getLocal<PublishedBook>(STORAGE_KEYS.BOOKS);
  const updated = local.map((b) => (b.id === bookId ? { ...b, ...updatePayload } : b));
  setLocal(STORAGE_KEYS.BOOKS, updated);
}

export async function deletePublishedBook(bookId: string): Promise<void> {
  try {
    if (db) {
      await deleteDoc(doc(db, 'publishedBooks', bookId));
    }
  } catch (err) {
    console.warn('Firestore deletePublishedBook fallback:', err);
  }

  const local = getLocal<PublishedBook>(STORAGE_KEYS.BOOKS);
  setLocal(STORAGE_KEYS.BOOKS, local.filter((b) => b.id !== bookId));

  // Also clean up performance entries for this book
  const localEntries = getLocal<BookPerformanceEntry>(STORAGE_KEYS.ENTRIES);
  setLocal(STORAGE_KEYS.ENTRIES, localEntries.filter((e) => e.bookId !== bookId));
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE ENTRIES
// ─────────────────────────────────────────────────────────────────────────────

export async function addPerformanceEntry(
  uid: string,
  entry: Omit<BookPerformanceEntry, 'id' | 'createdAt' | 'updatedAt' | 'netUnitsSold' | 'revenueUSD'>
): Promise<string> {
  const id = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();
  const netUnitsSold = (entry.unitsSold || 0) - (entry.unitsReturned || 0);
  const revenueUSD = convertToUSD(entry.royaltyEarned || 0, entry.currency || 'USD');

  const newEntry: BookPerformanceEntry = {
    ...entry,
    id,
    uid,
    netUnitsSold,
    revenueUSD,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (db) {
      await setDoc(doc(db, 'performanceEntries', id), newEntry);
    }
  } catch (err) {
    console.warn('Firestore addPerformanceEntry fallback to localStorage:', err);
  }

  // Local storage
  const local = getLocal<BookPerformanceEntry>(STORAGE_KEYS.ENTRIES);
  setLocal(STORAGE_KEYS.ENTRIES, [newEntry, ...local]);

  // Recalculate book totals
  await updateBookTotals(uid, entry.bookId).catch(() => {});
  // Update publishing streak
  await updatePublishingStreak(uid).catch(() => {});
  // Update goal progress
  await updateGoalProgress(uid).catch(() => {});

  return id;
}

/**
 * Enterprise Batch Ingestion for Performance Entries with Hash Deduplication
 */
export async function batchAddPerformanceEntries(
  uid: string,
  entries: Omit<BookPerformanceEntry, 'id' | 'createdAt' | 'updatedAt' | 'netUnitsSold' | 'revenueUSD'>[]
): Promise<{ added: number; skipped: number }> {
  if (!entries || entries.length === 0) return { added: 0, skipped: 0 };

  const existingLocal = getLocal<BookPerformanceEntry>(STORAGE_KEYS.ENTRIES);
  const existingKeys = new Set(
    existingLocal.map(
      (e) => `${e.uid}_${e.bookId}_${e.date}_${e.marketplace}_${e.royaltyType}_${e.unitsSold}_${e.royaltyEarned}`
    )
  );

  const newEntries: BookPerformanceEntry[] = [];
  const affectedBookIds = new Set<string>();
  let skipped = 0;

  const now = new Date().toISOString();

  for (const entry of entries) {
    const key = `${uid}_${entry.bookId}_${entry.date}_${entry.marketplace}_${entry.royaltyType}_${entry.unitsSold}_${entry.royaltyEarned}`;
    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }
    existingKeys.add(key);

    const id = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const netUnitsSold = (entry.unitsSold || 0) - (entry.unitsReturned || 0);
    const revenueUSD = convertToUSD(entry.royaltyEarned || 0, entry.currency || 'USD');

    newEntries.push({
      ...entry,
      id,
      uid,
      netUnitsSold,
      revenueUSD,
      createdAt: now,
      updatedAt: now,
    });
    if (entry.bookId) affectedBookIds.add(entry.bookId);
  }

  if (newEntries.length === 0) {
    return { added: 0, skipped };
  }

  // Firestore writeBatch in chunks of 450
  if (db) {
    try {
      const CHUNK_SIZE = 450;
      for (let i = 0; i < newEntries.length; i += CHUNK_SIZE) {
        const chunk = newEntries.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        for (const item of chunk) {
          batch.set(doc(db, 'performanceEntries', item.id), item);
        }
        await batch.commit();
      }
    } catch (err) {
      console.warn('[AnalyticsService] Firestore batch write fallback:', err);
    }
  }

  // Save to local storage
  setLocal(STORAGE_KEYS.ENTRIES, [...newEntries, ...existingLocal]);

  // Recalculate affected book totals & streaks
  for (const bId of affectedBookIds) {
    await updateBookTotals(uid, bId).catch(() => {});
  }
  await updatePublishingStreak(uid).catch(() => {});
  await updateGoalProgress(uid).catch(() => {});

  return { added: newEntries.length, skipped };
}

/**
 * Checks if an entry can still be edited (within 24 hours of creation)
 */
export function canEditPerformanceEntry(entry: BookPerformanceEntry): boolean {
  if (!entry.createdAt) return true;
  const createdTime = new Date(entry.createdAt).getTime();
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  return now - createdTime <= TWENTY_FOUR_HOURS;
}

export async function updatePerformanceEntry(
  entryId: string,
  data: Partial<BookPerformanceEntry>
): Promise<void> {
  const now = new Date().toISOString();
  const updatePayload = { ...data, updatedAt: now };

  try {
    if (db) {
      await updateDoc(doc(db, 'performanceEntries', entryId), updatePayload);
    }
  } catch (err) {
    console.warn('Firestore updatePerformanceEntry fallback:', err);
  }

  const local = getLocal<BookPerformanceEntry>(STORAGE_KEYS.ENTRIES);
  let updatedEntry: BookPerformanceEntry | null = null;
  const updated = local.map((e) => {
    if (e.id === entryId) {
      updatedEntry = { ...e, ...updatePayload };
      return updatedEntry;
    }
    return e;
  });
  setLocal(STORAGE_KEYS.ENTRIES, updated);

  if (updatedEntry) {
    await updateBookTotals((updatedEntry as any).uid, (updatedEntry as any).bookId).catch(() => {});
  }
}

export async function updateBookTotals(uid: string, bookId: string): Promise<void> {
  let entries: BookPerformanceEntry[] = [];

  try {
    if (db) {
      const q = query(collection(db, 'performanceEntries'), where('bookId', '==', bookId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        entries = snap.docs.map((d) => d.data() as BookPerformanceEntry);
      }
    }
  } catch (err) {
    console.warn('Firestore get entries for updateBookTotals fallback:', err);
  }

  if (entries.length === 0) {
    const local = getLocal<BookPerformanceEntry>(STORAGE_KEYS.ENTRIES);
    entries = local.filter((e) => e.bookId === bookId);
  }

  let totalUnitsSold = 0;
  let totalRevenue = 0;
  let totalRoyalties = 0;
  const bsrList: number[] = [];
  let bestBsr: number | null = null;
  let bestBsrDate: string | null = null;

  for (const entry of entries) {
    totalUnitsSold += entry.netUnitsSold || 0;
    totalRevenue += convertToUSD(entry.grossRevenue || 0, entry.currency);
    totalRoyalties += entry.revenueUSD || convertToUSD(entry.royaltyEarned || 0, entry.currency);

    if (entry.bsr && entry.bsr > 0) {
      bsrList.push(entry.bsr);
      if (bestBsr === null || entry.bsr < bestBsr) {
        bestBsr = entry.bsr;
        bestBsrDate = entry.date;
      }
    }
  }

  const averageBsr = bsrList.length > 0 ? Math.round(bsrList.reduce((a, b) => a + b, 0) / bsrList.length) : null;
  const lastUpdated = new Date().toISOString().substring(0, 10);

  const stats = {
    totalUnitsSold,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalRoyalties: Number(totalRoyalties.toFixed(2)),
    averageBsr,
    bestBsr,
    bestBsrDate,
    lastUpdated,
  };

  try {
    if (db) {
      const bookRef = doc(db, 'publishedBooks', bookId);
      await runTransaction(db, async (txn) => {
        txn.update(bookRef, stats);
      });
    }
  } catch (err) {
    console.warn('Firestore updateBookTotals transaction fallback:', err);
  }

  // Update local storage
  const localBooks = getLocal<PublishedBook>(STORAGE_KEYS.BOOKS);
  const updated = localBooks.map((b) => (b.id === bookId ? { ...b, ...stats } : b));
  setLocal(STORAGE_KEYS.BOOKS, updated);
}

export async function getBookPerformanceHistory(
  bookId: string,
  period: SalesPeriod = 'monthly',
  fromDate?: string,
  toDate?: string
): Promise<BookPerformanceEntry[]> {
  let entries: BookPerformanceEntry[] = [];

  try {
    if (db) {
      const q = query(
        collection(db, 'performanceEntries'),
        where('bookId', '==', bookId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        entries = snap.docs.map((d) => d.data() as BookPerformanceEntry);
      }
    }
  } catch (err) {
    console.warn('Firestore getBookPerformanceHistory fallback:', err);
  }

  if (entries.length === 0) {
    const local = getLocal<BookPerformanceEntry>(STORAGE_KEYS.ENTRIES);
    entries = local.filter((e) => e.bookId === bookId);
  }

  entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  if (fromDate) {
    entries = entries.filter((e) => e.date >= fromDate);
  }
  if (toDate) {
    entries = entries.filter((e) => e.date <= toDate);
  }

  return entries;
}

export async function getAllUserPerformanceEntries(
  uid: string,
  fromDate?: string,
  toDate?: string
): Promise<BookPerformanceEntry[]> {
  let entries: BookPerformanceEntry[] = [];

  try {
    if (db) {
      const q = query(
        collection(db, 'performanceEntries'),
        where('uid', '==', uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        entries = snap.docs.map((d) => d.data() as BookPerformanceEntry);
      }
    }
  } catch (err) {
    console.warn('Firestore getAllUserPerformanceEntries fallback:', err);
  }

  if (entries.length === 0) {
    const local = getLocal<BookPerformanceEntry>(STORAGE_KEYS.ENTRIES);
    entries = local.filter((e) => e.uid === uid);
  }

  entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  if (fromDate) {
    entries = entries.filter((e) => e.date >= fromDate);
  }
  if (toDate) {
    entries = entries.filter((e) => e.date <= toDate);
  }

  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// GOALS CRUD & PROGRESS
// ─────────────────────────────────────────────────────────────────────────────

export async function createGoal(
  uid: string,
  goal: Omit<PublishingGoal, 'id' | 'currentValue' | 'status' | 'achievedDate' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const newGoal: PublishingGoal = {
    ...goal,
    id,
    uid,
    currentValue: 0,
    status: 'active',
    achievedDate: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    if (db) {
      await setDoc(doc(db, 'publishingGoals', id), newGoal);
    }
  } catch (err) {
    console.warn('Firestore createGoal fallback:', err);
  }

  const local = getLocal<PublishingGoal>(STORAGE_KEYS.GOALS);
  setLocal(STORAGE_KEYS.GOALS, [newGoal, ...local]);

  await updateGoalProgress(uid).catch(() => {});
  return id;
}

export async function getUserGoals(uid: string): Promise<PublishingGoal[]> {
  try {
    if (db) {
      const q = query(collection(db, 'publishingGoals'), where('uid', '==', uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as PublishingGoal);
      }
    }
  } catch (err) {
    console.warn('Firestore getUserGoals fallback:', err);
  }

  const local = getLocal<PublishingGoal>(STORAGE_KEYS.GOALS);
  return local.filter((g) => g.uid === uid);
}

export async function updateGoalProgress(uid: string): Promise<void> {
  const goals = await getUserGoals(uid);
  const books = await getUserPublishedBooks(uid);
  const entries = await getAllUserPerformanceEntries(uid);
  const now = new Date().toISOString();

  for (const goal of goals) {
    if (goal.status !== 'active') continue;

    let currentValue = 0;
    const targetBooks = goal.linkedBookIds && goal.linkedBookIds.length > 0
      ? books.filter((b) => goal.linkedBookIds.includes(b.id))
      : books;

    const targetBookIds = targetBooks.map((b) => b.id);
    const targetEntries = entries.filter((e) => targetBookIds.includes(e.bookId));

    switch (goal.type) {
      case 'books-published':
        currentValue = targetBooks.length;
        break;
      case 'units':
        currentValue = targetEntries.reduce((acc, e) => acc + (e.netUnitsSold || 0), 0);
        break;
      case 'revenue':
        currentValue = Number(
          targetEntries.reduce((acc, e) => acc + convertToUSD(e.grossRevenue || 0, e.currency), 0).toFixed(2)
        );
        break;
      case 'royalties':
        currentValue = Number(
          targetEntries.reduce((acc, e) => acc + (e.revenueUSD || 0), 0).toFixed(2)
        );
        break;
      case 'bsr': {
        const bsrs = targetEntries.map((e) => e.bsr).filter((b): b is number => !!b && b > 0);
        currentValue = bsrs.length > 0 ? Math.min(...bsrs) : 0;
        break;
      }
    }

    const isAchieved = goal.type === 'bsr'
      ? currentValue > 0 && currentValue <= goal.targetValue
      : currentValue >= goal.targetValue;

    const updatePayload: Partial<PublishingGoal> = {
      currentValue,
      status: isAchieved ? 'achieved' : 'active',
      achievedDate: isAchieved ? (goal.achievedDate || now) : null,
      updatedAt: now,
    };

    await updateGoal(goal.id, updatePayload);
  }
}

export async function updateGoal(goalId: string, data: Partial<PublishingGoal>): Promise<void> {
  const now = new Date().toISOString();
  const updatePayload = { ...data, updatedAt: now };

  try {
    if (db) {
      await updateDoc(doc(db, 'publishingGoals', goalId), updatePayload);
    }
  } catch (err) {
    console.warn('Firestore updateGoal fallback:', err);
  }

  const local = getLocal<PublishingGoal>(STORAGE_KEYS.GOALS);
  const updated = local.map((g) => (g.id === goalId ? { ...g, ...updatePayload } : g));
  setLocal(STORAGE_KEYS.GOALS, updated);
}

export async function deleteGoal(goalId: string): Promise<void> {
  try {
    if (db) {
      await deleteDoc(doc(db, 'publishingGoals', goalId));
    }
  } catch (err) {
    console.warn('Firestore deleteGoal fallback:', err);
  }

  const local = getLocal<PublishingGoal>(STORAGE_KEYS.GOALS);
  setLocal(STORAGE_KEYS.GOALS, local.filter((g) => g.id !== goalId));
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLISHING STREAK
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserStreak(uid: string): Promise<PublishingStreak | null> {
  try {
    if (db) {
      const snap = await getDoc(doc(db, 'streaks', uid));
      if (snap.exists()) {
        return snap.data() as PublishingStreak;
      }
    }
  } catch (err) {
    console.warn('Firestore getUserStreak fallback:', err);
  }

  const local = getLocal<PublishingStreak>(STORAGE_KEYS.STREAKS);
  return local.find((s) => s.uid === uid) || null;
}

export async function updatePublishingStreak(uid: string): Promise<PublishingStreak> {
  const todayStr = new Date().toISOString().substring(0, 10);
  let streak = await getUserStreak(uid);

  const defaultMilestones: StreakMilestone[] = [
    { days: 7, achievedDate: null, badge: '🥉', label: '7-Day Author Habit' },
    { days: 30, achievedDate: null, badge: '🥈', label: '30-Day Publishing Power' },
    { days: 100, achievedDate: null, badge: '🥇', label: '100-Day KDP Master' },
    { days: 365, achievedDate: null, badge: '💎', label: '365-Day Publishing Legend' },
  ];

  if (!streak) {
    streak = {
      uid,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: todayStr,
      totalActiveDays: 1,
      streakType: 'any-activity',
      milestones: defaultMilestones,
    };
  } else {
    const lastDateStr = streak.lastActivityDate;

    if (lastDateStr === todayStr) {
      // Already counted today
      return streak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().substring(0, 10);

    if (lastDateStr === yesterdayStr) {
      streak.currentStreak += 1;
    } else {
      // Reset streak if gap
      streak.currentStreak = 1;
    }

    streak.totalActiveDays += 1;
    streak.lastActivityDate = todayStr;
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

    // Check milestones
    streak.milestones = (streak.milestones || defaultMilestones).map((m) => {
      if (streak!.currentStreak >= m.days && !m.achievedDate) {
        return { ...m, achievedDate: todayStr };
      }
      return m;
    });
  }

  try {
    if (db) {
      await setDoc(doc(db, 'streaks', uid), streak);
    }
  } catch (err) {
    console.warn('Firestore updatePublishingStreak fallback:', err);
  }

  const local = getLocal<PublishingStreak>(STORAGE_KEYS.STREAKS);
  const filtered = local.filter((s) => s.uid !== uid);
  setLocal(STORAGE_KEYS.STREAKS, [streak, ...filtered]);

  return streak;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS SUMMARY AGGREGATOR
// ─────────────────────────────────────────────────────────────────────────────

export async function getAnalyticsSummary(
  uid: string,
  period: SalesPeriod = 'monthly',
  date: string = new Date().toISOString().substring(0, 10)
): Promise<AnalyticsSummary> {
  const books = await getUserPublishedBooks(uid);
  const bookMap = new Map(books.map((b) => [b.id, b.title]));

  // Determine current window
  const selectedDate = new Date(date);
  let fromDate = date;
  let toDate = date;
  let periodLabel = 'Today';

  if (period === 'daily') {
    periodLabel = selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } else if (period === 'weekly') {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    fromDate = startOfWeek.toISOString().substring(0, 10);
    toDate = endOfWeek.toISOString().substring(0, 10);
    periodLabel = `Week of ${startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  } else if (period === 'monthly') {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    fromDate = startOfMonth.toISOString().substring(0, 10);
    toDate = endOfMonth.toISOString().substring(0, 10);
    periodLabel = selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } else {
    // Yearly
    const year = selectedDate.getFullYear();
    fromDate = `${year}-01-01`;
    toDate = `${year}-12-31`;
    periodLabel = `Year ${year}`;
  }

  // Get current period entries
  const entries = await getAllUserPerformanceEntries(uid, fromDate, toDate);

  let totalRevenue = 0;
  let totalRoyalties = 0;
  let totalUnitsSold = 0;
  let totalKenpPages = 0;

  const bookRevMap: Record<string, number> = {};
  const mktRevMap: Record<string, number> = {};
  const dayRevMap: Record<string, number> = {};

  for (const entry of entries) {
    const rev = entry.revenueUSD || convertToUSD(entry.royaltyEarned || 0, entry.currency);
    const gross = convertToUSD(entry.grossRevenue || 0, entry.currency);

    totalRoyalties += rev;
    totalRevenue += gross || rev;
    totalUnitsSold += entry.netUnitsSold || 0;
    totalKenpPages += entry.kenpPageReads || 0;

    const bTitle = bookMap.get(entry.bookId) || 'Untitled Title';
    bookRevMap[bTitle] = (bookRevMap[bTitle] || 0) + rev;

    const mkt = entry.marketplace || 'amazon-us';
    mktRevMap[mkt] = (mktRevMap[mkt] || 0) + rev;

    const d = entry.date || fromDate;
    dayRevMap[d] = (dayRevMap[d] || 0) + rev;
  }

  // Find Top Book & Top Marketplace
  let topBook: { title: string; revenue: number } | null = null;
  for (const [bTitle, rev] of Object.entries(bookRevMap)) {
    if (!topBook || rev > topBook.revenue) {
      topBook = { title: bTitle, revenue: Number(rev.toFixed(2)) };
    }
  }

  let topMarketplace: MarketPlace | null = null;
  let topMktRev = 0;
  for (const [mkt, rev] of Object.entries(mktRevMap)) {
    if (rev > topMktRev) {
      topMarketplace = mkt as MarketPlace;
      topMktRev = rev;
    }
  }

  const revenueByBook = Object.entries(bookRevMap)
    .map(([bookTitle, revenue]) => ({ bookTitle, revenue: Number(revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue);

  const revenueByMarketplace = Object.entries(mktRevMap)
    .map(([marketplace, revenue]) => ({ marketplace, revenue: Number(revenue.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue);

  const revenueByDay = Object.entries(dayRevMap)
    .map(([dateKey, revenue]) => ({ date: dateKey, revenue: Number(revenue.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Compute prior period window for comparison
  let priorFrom = '';
  let priorTo = '';
  const currentStart = new Date(fromDate);
  const currentEnd = new Date(toDate);
  const durationMs = currentEnd.getTime() - currentStart.getTime() + 86400000;

  const priorEnd = new Date(currentStart.getTime() - 86400000);
  const priorStart = new Date(priorEnd.getTime() - durationMs + 86400000);
  priorFrom = priorStart.toISOString().substring(0, 10);
  priorTo = priorEnd.toISOString().substring(0, 10);

  const priorEntries = await getAllUserPerformanceEntries(uid, priorFrom, priorTo);
  let priorRevenue = 0;
  let priorRoyalties = 0;
  let priorUnits = 0;

  for (const pe of priorEntries) {
    const rev = pe.revenueUSD || convertToUSD(pe.royaltyEarned || 0, pe.currency);
    const gross = convertToUSD(pe.grossRevenue || 0, pe.currency);
    priorRoyalties += rev;
    priorRevenue += gross || rev;
    priorUnits += pe.netUnitsSold || 0;
  }

  const calcDiff = (curr: number, prev: number) => {
    if (prev <= 0) return curr > 0 ? 100 : 0;
    return Number((((curr - prev) / prev) * 100).toFixed(1));
  };

  return {
    uid,
    period,
    periodLabel,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalRoyalties: Number(totalRoyalties.toFixed(2)),
    totalUnitsSold,
    totalKenpPages,
    topBook,
    topMarketplace,
    revenueByBook,
    revenueByMarketplace,
    revenueByDay,
    vsLastPeriod: {
      revenue: calcDiff(totalRevenue, priorRevenue),
      units: calcDiff(totalUnitsSold, priorUnits),
      royalties: calcDiff(totalRoyalties, priorRoyalties),
    },
  };
}
