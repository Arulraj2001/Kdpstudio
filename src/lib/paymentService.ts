/**
 * Payment & Subscription Management Service
 * Manages Firestore records for /payments, /subscriptions, and /upiPending,
 * as well as authoritative plan activations and downgrades.
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { 
  PaymentRecord, 
  SubscriptionRecord, 
  UpiPendingPayment, 
  PlanName, 
  BillingCycle, 
  PaymentGateway 
} from '../types/payment';
import { updateUserDocument, getUserDocument } from './userService';
import { 
  sendPlanUpgradedEmail, 
  sendAdminNewPaymentEmail, 
  getPlanFeatures 
} from './emailService';


// In-memory / localStorage fallback storage for offline & preview mode
const LOCAL_PAYMENTS_KEY = 'kdp_payments_history_';
const LOCAL_SUBS_KEY = 'kdp_subscriptions_';
const LOCAL_UPI_KEY = 'kdp_upi_pending_records';

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
    throw new Error('Firebase Admin SDK is required for server-side payment operations.');
  }
  return adminDb;
}

/**
 * Creates a payment transaction record in /payments
 * @param data Payment data without ID
 * @returns Generated payment document ID
 */
export async function createPaymentRecord(data: Omit<PaymentRecord, 'id'>): Promise<string> {
  const paymentId = 'pay_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const now = new Date().toISOString();

  const record: PaymentRecord = {
    ...data,
    id: paymentId,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  // 1. Local storage cache
  if (typeof window !== 'undefined') {
    try {
      const userPaymentsKey = LOCAL_PAYMENTS_KEY + data.uid;
      const cached = JSON.parse(localStorage.getItem(userPaymentsKey) || '[]');
      cached.unshift(record);
      localStorage.setItem(userPaymentsKey, JSON.stringify(cached));
    } catch {
      // ignore
    }
  }

  const adminDb = await requireAdminDbForServer();
  if (adminDb) {
    await adminDb.collection('payments').doc(paymentId).set({
      ...record,
      createdAt: record.createdAt || now,
      updatedAt: now,
    });
    return paymentId;
  }

  // 2. Persist to Firestore
  if (!adminDb && isFirebaseConfigured && db) {
    try {
      const payRef = doc(db, 'payments', paymentId);
      await setDoc(payRef, {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[PaymentService] Firestore createPaymentRecord write skipped/failed:', err);
    }
  }

  return paymentId;
}

/**
 * Updates specific fields in a payment record
 * @param id Payment document ID
 * @param data Partial update data
 */
export async function updatePaymentRecord(id: string, data: Partial<PaymentRecord>): Promise<void> {
  if (!id) return;
  const now = new Date().toISOString();

  const adminDb = await requireAdminDbForServer();
  if (adminDb) {
    await adminDb.collection('payments').doc(id).set(
      {
        ...data,
        updatedAt: now,
      },
      { merge: true }
    );
    return;
  }

  // Update in Firestore
  if (!adminDb && isFirebaseConfigured && db) {
    try {
      const payRef = doc(db, 'payments', id);
      await updateDoc(payRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[PaymentService] Firestore updatePaymentRecord error:', err);
    }
  }
}

/**
 * Creates a recurring subscription record in /subscriptions
 * @param data Subscription record data without ID
 * @returns Generated subscription ID
 */
export async function createSubscriptionRecord(data: Omit<SubscriptionRecord, 'id'>): Promise<string> {
  const subId = data.gatewaySubscriptionId || ('sub_' + Math.random().toString(36).substring(2, 10));
  const now = new Date().toISOString();

  const record: SubscriptionRecord = {
    ...data,
    id: subId,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  if (typeof window !== 'undefined') {
    try {
      const userSubsKey = LOCAL_SUBS_KEY + data.uid;
      const cached = JSON.parse(localStorage.getItem(userSubsKey) || '[]');
      cached.unshift(record);
      localStorage.setItem(userSubsKey, JSON.stringify(cached));
    } catch {
      // ignore
    }
  }

  const adminDb = await requireAdminDbForServer();
  if (adminDb) {
    await adminDb.collection('subscriptions').doc(subId).set({
      ...record,
      createdAt: record.createdAt || now,
      updatedAt: now,
    });
    return subId;
  }

  if (!adminDb && isFirebaseConfigured && db) {
    try {
      const subRef = doc(db, 'subscriptions', subId);
      await setDoc(subRef, {
        ...record,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[PaymentService] Firestore createSubscriptionRecord error:', err);
    }
  }

  return subId;
}

/**
 * Updates a subscription record
 * @param id Subscription ID
 * @param data Partial subscription data
 */
export async function updateSubscriptionRecord(id: string, data: Partial<SubscriptionRecord>): Promise<void> {
  if (!id) return;

  const adminDb = await requireAdminDbForServer();
  if (adminDb) {
    await adminDb.collection('subscriptions').doc(id).set(
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return;
  }

  if (!adminDb && isFirebaseConfigured && db) {
    try {
      const subRef = doc(db, 'subscriptions', id);
      await updateDoc(subRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[PaymentService] Firestore updateSubscriptionRecord error:', err);
    }
  }
}

/**
 * Retrieves payment history for a specific user
 * @param uid User ID
 * @returns Array of PaymentRecords ordered newest first
 */
export async function getUserPaymentHistory(uid: string): Promise<PaymentRecord[]> {
  if (!uid) return [];

  const adminDb = await getServerAdminDb();
  if (adminDb) {
    const snapshot = await adminDb
      .collection('payments')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as PaymentRecord));
  }

  // Try Firestore query
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'payments'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const list: PaymentRecord[] = [];
      snapshot.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as PaymentRecord);
      });
      if (list.length > 0) return list;
    } catch (err) {
      console.warn('[PaymentService] Firestore getUserPaymentHistory error, checking fallback:', err);
    }
  }

  // Fallback to local storage
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_PAYMENTS_KEY + uid);
      if (cached) {
        return JSON.parse(cached) as PaymentRecord[];
      }
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * Retrieves the currently active subscription for a user
 * @param uid User ID
 * @returns Active SubscriptionRecord or null
 */
export async function getUserActiveSubscription(uid: string): Promise<SubscriptionRecord | null> {
  if (!uid) return null;

  const adminDb = await getServerAdminDb();
  if (adminDb) {
    const snapshot = await adminDb
      .collection('subscriptions')
      .where('uid', '==', uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { ...docSnap.data(), id: docSnap.id } as SubscriptionRecord;
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'subscriptions'),
        where('uid', '==', uid),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { ...docSnap.data(), id: docSnap.id } as SubscriptionRecord;
      }
    } catch (err) {
      console.warn('[PaymentService] Firestore getUserActiveSubscription error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_SUBS_KEY + uid);
      if (cached) {
        const subs: SubscriptionRecord[] = JSON.parse(cached);
        const active = subs.find((s) => s.status === 'active');
        if (active) return active;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Submits a manual UPI payment for admin verification
 * @param data UPI submission details
 * @returns Pending payment ID
 */
export async function submitUpiPayment(
  data: Omit<UpiPendingPayment, 'id' | 'status' | 'submittedAt' | 'reviewedAt' | 'reviewedBy' | 'notes'> & Partial<UpiPendingPayment>
): Promise<string> {
  const pendingId = 'upi_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const record: UpiPendingPayment = {
    ...data,
    id: pendingId,
    status: 'pending',
    submittedAt: data.submittedAt || now,
    reviewedAt: null,
    reviewedBy: null,
    notes: null,
  };

  // Local storage for admin preview
  if (typeof window !== 'undefined') {
    try {
      const existing: UpiPendingPayment[] = JSON.parse(localStorage.getItem(LOCAL_UPI_KEY) || '[]');
      existing.unshift(record);
      localStorage.setItem(LOCAL_UPI_KEY, JSON.stringify(existing));
    } catch {
      // ignore
    }
  }

  const adminDb = await requireAdminDbForServer();
  if (adminDb) {
    await adminDb.collection('upiPending').doc(pendingId).set({
      ...record,
      submittedAt: record.submittedAt || now,
    });
    return pendingId;
  }

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'upiPending', pendingId);
      await setDoc(ref, {
        ...record,
        submittedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[PaymentService] Firestore submitUpiPayment error:', err);
    }
  }

  return pendingId;
}

export const createUpiPendingPayment = submitUpiPayment;

/**
 * Retrieves all pending UPI payments for admin inspection
 * @returns Array of pending UPI submissions
 */
export async function getPendingUpiPayments(): Promise<UpiPendingPayment[]> {
  const adminDb = await getServerAdminDb();
  if (adminDb) {
    const snapshot = await adminDb
      .collection('upiPending')
      .where('status', '==', 'pending')
      .get();
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as UpiPendingPayment));
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'upiPending'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const list: UpiPendingPayment[] = [];
      snapshot.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as UpiPendingPayment);
      });
      if (list.length > 0) return list;
    } catch (err) {
      console.warn('[PaymentService] Firestore getPendingUpiPayments error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const list: UpiPendingPayment[] = JSON.parse(localStorage.getItem(LOCAL_UPI_KEY) || '[]');
      return list.filter((item) => item.status === 'pending');
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * Checks if a specific UTR number has already been submitted to prevent duplicate entries
 * @param utrNumber UTR reference number
 */
export async function checkUtrExists(utrNumber: string): Promise<boolean> {
  if (!utrNumber) return false;
  const cleanUtr = utrNumber.trim().toUpperCase();

  const adminDb = await getServerAdminDb();
  if (adminDb) {
    const snapshot = await adminDb
      .collection('upiPending')
      .where('utrNumber', '==', cleanUtr)
      .limit(1)
      .get();
    if (!snapshot.empty) return true;
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'upiPending'),
        where('utrNumber', '==', cleanUtr)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) return true;
    } catch (err) {
      console.warn('[PaymentService] Error checking duplicate UTR:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const list: UpiPendingPayment[] = JSON.parse(localStorage.getItem(LOCAL_UPI_KEY) || '[]');
      return list.some((item) => item.utrNumber?.toUpperCase() === cleanUtr);
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * Retrieves the currently pending UPI payment for a given user if any
 * @param uid User ID
 */
export async function getUserPendingUpiPayment(uid: string): Promise<UpiPendingPayment | null> {
  if (!uid) return null;

  const adminDb = await getServerAdminDb();
  if (adminDb) {
    const snapshot = await adminDb
      .collection('upiPending')
      .where('uid', '==', uid)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { ...docSnap.data(), id: docSnap.id } as UpiPendingPayment;
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'upiPending'),
        where('uid', '==', uid),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { ...docSnap.data(), id: docSnap.id } as UpiPendingPayment;
      }
    } catch (err) {
      console.warn('[PaymentService] Error fetching user pending UPI:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const list: UpiPendingPayment[] = JSON.parse(localStorage.getItem(LOCAL_UPI_KEY) || '[]');
      const found = list.find((item) => item.uid === uid && item.status === 'pending');
      if (found) return found;
    } catch {
      // ignore
    }
  }

  return null;
}


/**
 * Approves a pending UPI payment and activates the user's plan
 * @param pendingId UPI record ID
 * @param adminEmail Approving administrator's email
 */
export async function approveUpiPayment(pendingId: string, adminEmail: string): Promise<void> {
  const now = new Date().toISOString();
  let pendingRecord: UpiPendingPayment | null = null;

  const adminDb = await requireAdminDbForServer();

  // Retrieve pending details
  if (adminDb) {
    const snap = await adminDb.collection('upiPending').doc(pendingId).get();
    if (snap.exists) {
      pendingRecord = { ...snap.data(), id: snap.id } as UpiPendingPayment;
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'upiPending', pendingId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        pendingRecord = { ...snap.data(), id: snap.id } as UpiPendingPayment;
      }
    } catch (err) {
      console.warn('[PaymentService] Error reading pending UPI doc:', err);
    }
  }

  if (!pendingRecord && typeof window !== 'undefined') {
    try {
      const list: UpiPendingPayment[] = JSON.parse(localStorage.getItem(LOCAL_UPI_KEY) || '[]');
      pendingRecord = list.find((item) => item.id === pendingId) || null;
    } catch {}
  }

  if (!pendingRecord) {
    throw new Error(`Pending UPI payment ${pendingId} not found`);
  }
  if (pendingRecord.status !== 'pending') {
    throw new Error(`UPI payment ${pendingId} is already ${pendingRecord.status}`);
  }

  // Update status in Firestore
  if (adminDb) {
    await adminDb.collection('upiPending').doc(pendingId).set(
      {
        status: 'approved',
        reviewedAt: now,
        reviewedBy: adminEmail,
      },
      { merge: true }
    );
  }

  if (!adminDb && isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'upiPending', pendingId);
      await updateDoc(ref, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminEmail,
      });
    } catch (err) {
      console.warn('[PaymentService] Error updating UPI status:', err);
    }
  }

  // Update local storage
  if (typeof window !== 'undefined') {
    try {
      const list: UpiPendingPayment[] = JSON.parse(localStorage.getItem(LOCAL_UPI_KEY) || '[]');
      const updated = list.map((item) =>
        item.id === pendingId
          ? { ...item, status: 'approved' as const, reviewedAt: now, reviewedBy: adminEmail }
          : item
      );
      localStorage.setItem(LOCAL_UPI_KEY, JSON.stringify(updated));
    } catch {}
  }

  // 1. Activate Plan
  await activateUserPlan(
    pendingRecord.uid,
    pendingRecord.plan,
    pendingRecord.billingCycle,
    'upi',
    pendingRecord.utrNumber || pendingId
  );

  // 2. Create Completed Payment Record
  await createPaymentRecord({
    uid: pendingRecord.uid,
    email: pendingRecord.email,
    gateway: 'upi',
    gatewayPaymentId: pendingRecord.utrNumber || pendingId,
    gatewaySubscriptionId: null,
    gatewayCustomerId: null,
    plan: pendingRecord.plan,
    billingCycle: pendingRecord.billingCycle,
    amount: pendingRecord.amount,
    currency: 'INR',
    status: 'completed',
    createdAt: now,
    updatedAt: now,
    planStartDate: now,
    planEndDate:
      pendingRecord.billingCycle === 'lifetime'
        ? null
        : new Date(Date.now() + (pendingRecord.billingCycle === 'annual' ? 365 : 30) * 86400000).toISOString(),
    metadata: {
      utrNumber: pendingRecord.utrNumber,
      approvedBy: adminEmail,
      screenshotUrl: pendingRecord.screenshotUrl,
    },
  });
}

/**
 * Rejects a pending UPI payment
 * @param pendingId UPI record ID
 * @param reason Reason for rejection
 * @param adminEmail Admin email
 */
export async function rejectUpiPayment(
  pendingId: string,
  reason: string,
  adminEmail: string
): Promise<void> {
  const now = new Date().toISOString();

  const adminDb = await requireAdminDbForServer();
  if (adminDb) {
    await adminDb.collection('upiPending').doc(pendingId).set(
      {
        status: 'rejected',
        notes: reason,
        reviewedAt: now,
        reviewedBy: adminEmail,
      },
      { merge: true }
    );
    return;
  }

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'upiPending', pendingId);
      await updateDoc(ref, {
        status: 'rejected',
        notes: reason,
        reviewedAt: serverTimestamp(),
        reviewedBy: adminEmail,
      });
    } catch (err) {
      console.warn('[PaymentService] Error rejecting UPI payment:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const list: UpiPendingPayment[] = JSON.parse(localStorage.getItem(LOCAL_UPI_KEY) || '[]');
      const updated = list.map((item) =>
        item.id === pendingId
          ? { ...item, status: 'rejected' as const, notes: reason, reviewedAt: now, reviewedBy: adminEmail }
          : item
      );
      localStorage.setItem(LOCAL_UPI_KEY, JSON.stringify(updated));
    } catch {}
  }
}

/**
 * Authoritative Plan Activation Function
 * SINGLE source of truth that upgrades a user's plan across Firestore and user document.
 * Called by Razorpay, PayPal, BMAC, and UPI verification handlers.
 * 
 * @param uid User ID to upgrade
 * @param plan Target plan ('starter' | 'pro' | 'agency' | 'free')
 * @param billingCycle Billing interval ('monthly' | 'annual' | 'lifetime')
 * @param gateway Payment gateway ('razorpay' | 'paypal' | 'upi' | 'bmac')
 * @param paymentId Gateway transaction reference
 */
export async function activateUserPlan(
  uid: string,
  plan: PlanName,
  billingCycle: BillingCycle,
  gateway: PaymentGateway,
  paymentId: string
): Promise<void> {
  if (!uid) throw new Error('User ID is required for plan activation');

  const now = new Date();
  let planEndDate: Date | null = null;

  if (billingCycle === 'monthly') {
    planEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else if (billingCycle === 'annual') {
    planEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  } else if (billingCycle === 'lifetime') {
    planEndDate = null;
  }

  const updatePayload = {
    plan: plan as any,
    planStartDate: now.toISOString(),
    planEndDate: planEndDate ? planEndDate.toISOString() : null,
    billingCycle: (billingCycle === 'annual' ? 'yearly' : billingCycle) as any,
    paymentMethod: gateway,
    lastPaymentDate: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // 1. Update user document in Firestore and cache
  await updateUserDocument(uid, updatePayload);

  // 2. Log activation
  console.log(
    `[Plan Activated] User: ${uid} | Plan: ${plan} | Cycle: ${billingCycle} | Gateway: ${gateway} | TxID: ${paymentId}`
  );

  // 3. Send Plan Upgraded & Admin Payment Notification Emails
  try {
    const userDoc = await getUserDocument(uid);
    if (userDoc?.email) {
      const userEmail = userDoc.email;
      const userName = userDoc.name || userDoc.displayName || userEmail.split('@')[0];
      const currency = userDoc.currency || (gateway === 'upi' ? 'INR' : 'USD');
      
      const { PRICING_TABLE, computeDynamicPricingTable } = await import('./geo');
      let dynamicTable: any = PRICING_TABLE;
      try {
        if (isFirebaseConfigured && db) {
          const priceSnap = await getDoc(doc(db, 'appConfig', 'pricing'));
          if (priceSnap.exists()) {
            dynamicTable = computeDynamicPricingTable(priceSnap.data() as any);
          }
        }
      } catch {
        // Fallback to static table
      }

      const basePrice = (dynamicTable[plan as 'starter' | 'pro' | 'agency']?.[currency as 'INR' | 'USD'] as number) || (currency === 'INR' ? 1499 : 19);
      const totalAmount = billingCycle === 'annual' ? Math.round(basePrice * 10) : basePrice;
      const formattedAmount = currency === 'INR' ? `₹${totalAmount}` : `$${totalAmount}`;

      sendPlanUpgradedEmail({
        to: userEmail,
        name: userName,
        plan: plan,
        billingCycle: billingCycle,
        amount: formattedAmount,
        currency: currency,
        gateway: gateway,
        planEndDate: planEndDate ? planEndDate.toLocaleDateString() : null,
        features: getPlanFeatures(plan),
      }).catch(console.error);

      sendAdminNewPaymentEmail({
        userName,
        userEmail,
        plan,
        amount: formattedAmount,
        currency,
        gateway,
      }).catch(console.error);
    }
  } catch (err) {
    console.warn('[PaymentService] Email dispatch note:', err);
  }
}

/**
 * Downgrades user plan to Free when subscription expires or is cancelled
 * @param uid User ID
 * @param reason Cancellation or expiry reason
 */
export async function downgradeUserPlan(uid: string, reason: string): Promise<void> {
  if (!uid) return;
  const now = new Date().toISOString();

  await updateUserDocument(uid, {
    plan: 'free',
    planEndDate: null,
    billingCycle: null,
    paymentMethod: null,
    updatedAt: now,
  });

  console.log(`[Plan Downgraded] User: ${uid} | Reason: ${reason}`);
}
