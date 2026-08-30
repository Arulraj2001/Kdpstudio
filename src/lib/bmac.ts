/**
 * Buy Me a Coffee (BMaC) Integration Utilities & Tier Matrix
 * 
 * Webhook Setup Instructions:
 * Register in buymeacoffee.com → Settings → Webhook:
 * URL: {APP_URL}/api/webhooks/bmac
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { PlanName, BillingCycle } from '../types/payment';

export interface BmacTier {
  coffees: number;
  amount: number;
  reward: 'credits' | 'plan';
  credits?: number;
  plan?: PlanName;
  billingCycle?: BillingCycle;
  description: string;
}

export interface BmacUnmatchedPayment {
  id: string;
  bmacPaymentId: number | string;
  amount: number;
  supportCoffees: number;
  supporterEmail: string;
  supporterName: string;
  supportNote?: string;
  message?: string;
  isSubscription?: boolean;
  status: 'unmatched' | 'resolved';
  resolvedUid?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  rewardGranted?: string;
  createdAt: string;
}

export const BMAC_TIERS: BmacTier[] = [
  {
    coffees: 1,
    amount: 6,
    reward: 'credits',
    credits: 50,
    description: '50 bonus AI credits',
  },
  {
    coffees: 3,
    amount: 9,
    reward: 'plan',
    plan: 'starter',
    billingCycle: 'monthly',
    description: '1 month Starter plan',
  },
  {
    coffees: 6,
    amount: 18,
    reward: 'plan',
    plan: 'pro',
    billingCycle: 'monthly',
    description: '1 month Pro plan',
  },
  {
    coffees: 43,
    amount: 129,
    reward: 'plan',
    plan: 'pro',
    billingCycle: 'lifetime',
    description: 'Lifetime Pro access',
  },
];

/**
 * Matches amount paid to highest applicable reward tier.
 * Returns null if below minimum tier ($6).
 */
export function matchBmacTier(amountPaid: number): BmacTier | null {
  const numericAmount = Number(amountPaid) || 0;
  // Filter all tiers where paid amount is at least the tier threshold
  const matching = BMAC_TIERS
    .filter((t) => numericAmount >= t.amount)
    .sort((a, b) => b.amount - a.amount);

  return matching[0] || null;
}

const LOCAL_BMAC_UNMATCHED_KEY = 'kdp_bmac_unmatched_records';

function isServerRuntime(): boolean {
  return typeof window === 'undefined';
}

async function getServerAdminDb() {
  if (!isServerRuntime()) return null;
  const runtimeImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
  const [{ getApps, initializeApp, cert }, { getFirestore }] = await Promise.all([
    runtimeImport('firebase-admin/app'),
    runtimeImport('firebase-admin/firestore'),
  ]);
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (privateKey) privateKey = privateKey.replace(/\\n/g, '\n');

  const app = getApps().length
    ? getApps()[0]
    : projectId && clientEmail && privateKey
      ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
      : projectId
        ? initializeApp({ projectId })
        : null;
  return app ? getFirestore(app) : null;
}

async function requireAdminDbForServer() {
  const adminDb = await getServerAdminDb();
  if (!adminDb && isServerRuntime() && process.env.NODE_ENV === 'production') {
    throw new Error('Firebase Admin SDK is required for server-side BMaC operations.');
  }
  return adminDb;
}

/**
 * Stores an unmatched BMaC payment document in /bmacUnmatched for manual administrator triage
 */
export async function saveBmacUnmatchedPayment(
  data: Omit<BmacUnmatchedPayment, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const id = `bmac_unmatched_${data.bmacPaymentId || Date.now()}`;
  const now = new Date().toISOString();

  const record: BmacUnmatchedPayment = {
    ...data,
    id,
    status: 'unmatched',
    createdAt: now,
  };

  // 1. Local storage cache
  if (typeof window !== 'undefined') {
    try {
      const list: BmacUnmatchedPayment[] = JSON.parse(
        localStorage.getItem(LOCAL_BMAC_UNMATCHED_KEY) || '[]'
      );
      const existingIdx = list.findIndex((item) => item.id === id);
      if (existingIdx >= 0) {
        list[existingIdx] = record;
      } else {
        list.unshift(record);
      }
      localStorage.setItem(LOCAL_BMAC_UNMATCHED_KEY, JSON.stringify(list));
    } catch {}
  }

  const adminDb = await requireAdminDbForServer();
  if (adminDb) {
    await adminDb.collection('bmacUnmatched').doc(id).set({
      ...record,
      createdAt: record.createdAt || now,
    });
    return id;
  }

  // 2. Firestore document
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'bmacUnmatched', id);
      await setDoc(docRef, {
        ...record,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[BMaC] Firestore saveBmacUnmatchedPayment error:', err);
    }
  }

  return id;
}

/**
 * Retrieves all unmatched BMaC payments
 */
export async function getBmacUnmatchedPayments(): Promise<BmacUnmatchedPayment[]> {
  const adminDb = await getServerAdminDb();
  if (adminDb) {
    const snap = await adminDb.collection('bmacUnmatched').orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as BmacUnmatchedPayment));
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'bmacUnmatched'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const list: BmacUnmatchedPayment[] = [];
      snap.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as BmacUnmatchedPayment);
      });
      if (list.length > 0) return list;
    } catch (err) {
      console.warn('[BMaC] Firestore getBmacUnmatchedPayments error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const list: BmacUnmatchedPayment[] = JSON.parse(
        localStorage.getItem(LOCAL_BMAC_UNMATCHED_KEY) || '[]'
      );
      return list;
    } catch {}
  }

  return [];
}

/**
 * Marks an unmatched payment as resolved
 */
export async function resolveBmacUnmatchedPayment(
  unmatchedId: string,
  resolvedUid: string,
  adminEmail: string,
  rewardGranted: string
): Promise<void> {
  const now = new Date().toISOString();

  const adminDb = await requireAdminDbForServer();
  if (adminDb) {
    await adminDb.collection('bmacUnmatched').doc(unmatchedId).set(
      {
        status: 'resolved',
        resolvedUid,
        resolvedBy: adminEmail,
        resolvedAt: now,
        rewardGranted,
      },
      { merge: true }
    );
    return;
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'bmacUnmatched', unmatchedId);
      await updateDoc(docRef, {
        status: 'resolved',
        resolvedUid,
        resolvedBy: adminEmail,
        resolvedAt: serverTimestamp(),
        rewardGranted,
      });
    } catch (err) {
      console.warn('[BMaC] Firestore resolveBmacUnmatchedPayment error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const list: BmacUnmatchedPayment[] = JSON.parse(
        localStorage.getItem(LOCAL_BMAC_UNMATCHED_KEY) || '[]'
      );
      const updated = list.map((item) =>
        item.id === unmatchedId
          ? {
              ...item,
              status: 'resolved' as const,
              resolvedUid,
              resolvedBy: adminEmail,
              resolvedAt: now,
              rewardGranted,
            }
          : item
      );
      localStorage.setItem(LOCAL_BMAC_UNMATCHED_KEY, JSON.stringify(updated));
    } catch {}
  }
}
