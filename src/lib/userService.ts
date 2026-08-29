import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  increment
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export interface UserUsage {
  daily: {
    date: string;
    aiGenerations: number;
    pdfExports: number;
    imageGenerations: number;
    coverExports?: number;
    puzzleGenerations?: number;
    epubExports?: number;
    [key: string]: any;
  };
  monthly: {
    month: string;
    aiGenerations: number;
    pdfExports: number;
    imageGenerations: number;
    coverExports?: number;
    [key: string]: any;
  };
  allTime: {
    booksCreated?: number;
    pdfExports?: number;
    imagesGenerated?: number;
    coversCreated?: number;
    [key: string]: any;
  };
}

export interface UserSettings {
  defaultAuthorName: string;
  defaultTrimSize: string;
  defaultPaperType: string;
  defaultFont: string;
  defaultLanguage: string;
  emailNotifications: boolean;
  weeklyDigest: boolean;
  emailPreferences?: {
    weeklyDigest: boolean;
    usageWarnings: boolean;
    marketing: boolean;
    billing: boolean;
    security: boolean;
  };
  bookTypes?: string[];
  publishingGoal?: string;
}

export interface UserDocument {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
  photoURL: string | null;
  createdAt: any;
  updatedAt: any;
  lastSeen?: any;

  plan: 'free' | 'starter' | 'pro' | 'agency' | 'lifetime';
  planStartDate: any;
  planEndDate: any | null;
  billingCycle: 'monthly' | 'yearly' | 'lifetime' | null;

  currency: string;
  country: string;
  timezone: string;

  paymentMethod: string | null;
  paymentCustomerId: string | null;
  subscriptionId?: string | null;
  subscriptionCancelled?: boolean;
  subscriptionCancelReason?: string;
  subscriptionCancelNotes?: string;
  lastPaymentDate: any | null;
  paymentFailed?: boolean;

  credits?: number;

  usage: UserUsage;

  onboardingComplete: boolean;
  emailVerified: boolean;
  referralCode: string;
  referredBy: string | null;

  lastUsageWarningDate?: string | null;
  lastQuotaExceededDate?: string | null;
  lastExpiryWarningDate?: string | null;

  settings: UserSettings;
}

export function generateReferralCode(uid: string): string {
  if (!uid) return 'KDP' + Math.random().toString(36).substring(2, 7).toUpperCase();
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return (clean.slice(0, 8) || 'KDP' + Math.random().toString(36).substring(2, 7).toUpperCase());
}

const LOCAL_USER_PREFIX = 'kdp_user_doc_';
const inMemoryUserDocs = new Map<string, UserDocument>();

/**
 * Creates user document at /users/{uid} in Firestore.
 * If document exists, updates lastSeen and updatedAt only.
 */
export async function createUserDocument(
  uid: string,
  email: string,
  name: string,
  photoURL: string | null = null,
  currency = 'USD',
  country = 'US',
  emailVerified = false
): Promise<UserDocument> {
  const todayDate = new Date().toISOString().split('T')[0];
  const currentMonth = todayDate.slice(0, 7);
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  // Check if exists first
  const existing = await getUserDocument(uid);
  if (existing) {
    const patch = {
      lastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: emailVerified || existing.emailVerified,
    };
    await updateUserDocument(uid, patch);
    return { ...existing, ...patch };
  }

  const initialDoc: UserDocument = {
    uid,
    email,
    name: name || email.split('@')[0] || 'Kindle Author',
    photoURL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),

    plan: 'free',
    planStartDate: new Date().toISOString(),
    planEndDate: null,
    billingCycle: null,

    currency: currency || 'USD',
    country: country || 'US',
    timezone: tz,

    paymentMethod: null,
    paymentCustomerId: null,
    lastPaymentDate: null,
    credits: 0,

    usage: {
      daily: {
        date: todayDate,
        aiGenerations: 0,
        pdfExports: 0,
        imageGenerations: 0,
        coverExports: 0,
        puzzleGenerations: 0,
      },
      monthly: {
        month: currentMonth,
        aiGenerations: 0,
        pdfExports: 0,
        imageGenerations: 0,
        coverExports: 0,
      },
      allTime: {
        booksCreated: 0,
        pdfExports: 0,
        imagesGenerated: 0,
        coversCreated: 0,
      },
    },

    onboardingComplete: false,
    emailVerified,
    referralCode: generateReferralCode(uid),
    referredBy: null,

    settings: {
      defaultAuthorName: name || 'Kindle Author',
      defaultTrimSize: '6x9',
      defaultPaperType: 'white',
      defaultFont: 'Georgia',
      defaultLanguage: 'English',
      emailNotifications: true,
      weeklyDigest: true,
      bookTypes: [],
      publishingGoal: 'business',
    },
  };

  // 1. Save to Memory & LocalStorage for instant hydration
  inMemoryUserDocs.set(uid, initialDoc);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_USER_PREFIX + uid, JSON.stringify(initialDoc));
    } catch {
      // ignore
    }
  }

  // 2. Persist to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...initialDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        planStartDate: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore user doc write skipped or failed (using cached state):', err);
    }
  }

  return initialDoc;
}

/**
 * Fetches user doc from Firestore or local fallback
 */
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  if (!uid) return null;

  if (inMemoryUserDocs.has(uid)) {
    return inMemoryUserDocs.get(uid)!;
  }

  // Check live Firestore if available
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as UserDocument;
        inMemoryUserDocs.set(uid, data);
        // Update local cache
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_USER_PREFIX + uid, JSON.stringify(data));
          } catch {}
        }
        return data;
      }
    } catch (err) {
      console.warn('Could not read user document from Firestore:', err);
    }
  }

  // Fallback to local storage
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_USER_PREFIX + uid);
      if (cached) {
        const parsed = JSON.parse(cached) as UserDocument;
        inMemoryUserDocs.set(uid, parsed);
        return parsed;
      }
    } catch {}
  }

  return null;
}

/**
 * Updates specific fields in user document
 */
export async function updateUserDocument(uid: string, data: Partial<UserDocument>): Promise<void> {
  if (!uid) return;

  const current = inMemoryUserDocs.get(uid) || (await getUserDocument(uid));
  if (current) {
    const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
    inMemoryUserDocs.set(uid, updated);
  }

  // Update local storage first
  if (typeof window !== 'undefined') {
    try {
      const current = await getUserDocument(uid);
      if (current) {
        const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem(LOCAL_USER_PREFIX + uid, JSON.stringify(updated));
      }
    } catch {}
  }

  // Update Firestore
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Firestore updateUserDocument skipped or failed:', err);
    }
  }
}

/**
 * Finds user document by email
 */
export async function getUserByEmail(email: string): Promise<UserDocument | null> {
  if (!email) return null;
  const targetEmail = email.toLowerCase().trim();

  // 1. Query live Firestore if available
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'users'),
        where('email', '==', targetEmail)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { ...docSnap.data(), uid: docSnap.id } as UserDocument;
      }
    } catch (err) {
      console.warn('[UserService] Firestore getUserByEmail error:', err);
    }
  }

  // 2. Search local storage cache
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_USER_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as UserDocument;
            if (parsed.email?.toLowerCase().trim() === targetEmail) {
              return parsed;
            }
          }
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Adds bonus credits to user document
 * Atomic increment in Firestore
 */
export async function addCredits(uid: string, amount: number): Promise<void> {
  if (!uid || amount <= 0) return;

  const currentDoc = await getUserDocument(uid);
  const currentCredits = Number(currentDoc?.credits || 0);
  const newTotal = currentCredits + amount;

  // Local storage update
  if (typeof window !== 'undefined') {
    try {
      if (currentDoc) {
        const updated = { ...currentDoc, credits: newTotal, updatedAt: new Date().toISOString() };
        localStorage.setItem(LOCAL_USER_PREFIX + uid, JSON.stringify(updated));
      }
    } catch {}
  }

  // Firestore atomic increment
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        credits: increment(amount),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[UserService] Firestore addCredits increment error:', err);
    }
  }

  console.log(`[Credits] Added ${amount} credits to user ${uid}. New balance: ${newTotal}`);
}

/**
 * Attempts to deduct credits from user.
 * Returns true if sufficient credits exist and deduction succeeded.
 */
export async function deductCredit(uid: string, amount: number = 1): Promise<boolean> {
  if (!uid || amount <= 0) return false;

  const currentDoc = await getUserDocument(uid);
  const currentCredits = Number(currentDoc?.credits || 0);

  if (currentCredits < amount) {
    return false;
  }

  const newTotal = Math.max(0, currentCredits - amount);

  // Local storage update
  if (typeof window !== 'undefined') {
    try {
      if (currentDoc) {
        const updated = { ...currentDoc, credits: newTotal, updatedAt: new Date().toISOString() };
        localStorage.setItem(LOCAL_USER_PREFIX + uid, JSON.stringify(updated));
      }
    } catch {}
  }

  // Firestore atomic decrement
  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        credits: increment(-amount),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[UserService] Firestore deductCredit error:', err);
    }
  }

  console.log(`[Credits] Deducted ${amount} credit(s) from user ${uid}. Remaining: ${newTotal}`);
  return true;
}

/**
 * Returns current credit balance for user
 */
export async function getUserCredits(uid: string): Promise<number> {
  if (!uid) return 0;
  const userDoc = await getUserDocument(uid);
  return Number(userDoc?.credits || 0);
}

