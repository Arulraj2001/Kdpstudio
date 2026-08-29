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
