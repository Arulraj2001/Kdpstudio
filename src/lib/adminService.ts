/**
 * Admin Service — Server-side only
 * Uses Firebase Admin SDK (getAdminDb) for privileged operations.
 * All destructive actions are logged to /adminLogs.
 */

import { getAdminDb, getAdminAuth } from './firebase-admin';
import { updateUserDocument } from './userService';
import { sendPlanUpgradedEmail } from './emailService';
import type {
  AdminUserView,
  AdminUserDetail,
  AdminLog,
  AdminLogAction,
  AdminOverviewStats,
  AdminActivity,
  AdminUsersQuery,
  AdminUsersResult,
  AdminSignupTrend,
  RevenueSummary,
  DailyRevenueItem,
  AdminPaymentRow,
  AdminPaymentsQuery,
  AdminPaymentsResult,
  UpiQueueItem,
  UpiQueueStats,
  BmacQueueItem,
  RefundRecord,
} from '../types/admin';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toTimestamp(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val?.toDate) return val.toDate().toISOString();
  if (val?.seconds) return new Date(val.seconds * 1000).toISOString();
  return String(val);
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix = 'log') {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Logging
// ─────────────────────────────────────────────────────────────────────────────

export async function logAdminAction(action: AdminLogAction): Promise<void> {
  const db = getAdminDb();
  if (!db) return;
  const logId = makeId('adminlog');
  await db.collection('adminLogs').doc(logId).set({
    ...action,
    id: logId,
    timestamp: action.timestamp || nowIso(),
  });
}

export async function getAdminLogs(limit = 50): Promise<AdminLog[]> {
  const db = getAdminDb();
  if (!db) return [];
  const snap = await db
    .collection('adminLogs')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminLog));
}

// ─────────────────────────────────────────────────────────────────────────────
// User Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build an AdminUserView from a raw Firestore user document.
 */
function buildUserView(uid: string, data: any): AdminUserView {
  const usage = data.usage || {};
  const daily = usage.daily || {};
  const allTime = usage.allTime || {};

  return {
    uid,
    email: data.email || '',
    name: data.name || data.displayName || '',
    photoURL: data.photoURL || null,
    plan: data.plan || 'free',
    planStartDate: toTimestamp(data.planStartDate),
    planEndDate: toTimestamp(data.planEndDate),
    billingCycle: data.billingCycle || null,
    paymentMethod: data.paymentMethod || null,
    country: data.country || 'US',
    currency: data.currency || 'USD',
    createdAt: toTimestamp(data.createdAt) || nowIso(),
    lastSeen: toTimestamp(data.lastSeen),
    emailVerified: data.emailVerified || false,
    isBanned: data.isBanned || false,
    banReason: data.banReason,
    onboardingComplete: data.onboardingComplete || false,

    totalBooks: allTime.booksCreated || 0,
    totalPdfExports: allTime.pdfExports || 0,
    totalRevenuePaid: data.totalRevenuePaid || 0,

    todayAiGenerations: daily.aiGenerations || 0,
    todayPdfExports: daily.pdfExports || 0,
  };
}

/**
 * Get paginated user list with optional search, filter, sort.
 *
 * Firestore limitation: no full-text search.
 * Strategy:
 *   - If searchQuery provided: try exact email match OR name prefix match
 *   - If planFilter: where('plan', '==', plan)
 *   - If statusFilter: filter in-memory after fetch
 *
 * For large datasets this may be slow — recommend Algolia integration for prod.
 */
export async function getAllUsers(options: AdminUsersQuery): Promise<AdminUsersResult> {
  const db = getAdminDb();
  if (!db) return { users: [], total: 0 };

  const {
    limit = 20,
    offset = 0,
    searchQuery,
    planFilter,
    statusFilter,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const usersRef = db.collection('users');

  // Build query
  let query: FirebaseFirestore.Query = usersRef;

  // Plan filter
  if (planFilter && planFilter !== 'all') {
    query = query.where('plan', '==', planFilter);
  }

  // Status filter
  if (statusFilter === 'banned') {
    query = query.where('isBanned', '==', true);
  } else if (statusFilter === 'unverified') {
    query = query.where('emailVerified', '==', false);
  }

  // Email exact search takes priority
  if (searchQuery) {
    const sq = searchQuery.trim().toLowerCase();
    // Try email exact match first
    const emailSnap = await usersRef.where('email', '==', sq).limit(10).get();
    if (!emailSnap.empty) {
      const users = emailSnap.docs.map(d => buildUserView(d.id, d.data()));
      return { users, total: users.length };
    }
    // Name prefix search
    const nameSnap = await usersRef
      .orderBy('name')
      .startAt(searchQuery)
      .endAt(searchQuery + '\uf8ff')
      .limit(50)
      .get();
    const users = nameSnap.docs.map(d => buildUserView(d.id, d.data()));
    return { users: users.slice(offset, offset + limit), total: users.length };
  }

  // Sort
  const validSortFields: Record<string, string> = {
    createdAt: 'createdAt',
    lastSeen: 'lastSeen',
    plan: 'plan',
    totalRevenuePaid: 'totalRevenuePaid',
  };
  const sortField = validSortFields[sortBy] || 'createdAt';

  try {
    query = query.orderBy(sortField, sortOrder);
  } catch {
    query = query.orderBy('createdAt', 'desc');
  }

  // Count total (fetch all docs matching filters — expensive but accurate for small datasets)
  const countSnap = await query.get();
  const total = countSnap.size;

  // Paginate
  const snap = await query.offset(offset).limit(limit).get();
  const users = snap.docs.map(d => buildUserView(d.id, d.data()));

  return { users, total };
}

/**
 * Get full user detail including books, payments, usage history.
 */
export async function getUserDetails(uid: string): Promise<AdminUserDetail | null> {
  const db = getAdminDb();
  if (!db) return null;

  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) return null;

  const data = userSnap.data()!;
  const base = buildUserView(uid, data);

  // Books
  let books: AdminUserDetail['books'] = [];
  try {
    const booksSnap = await db
      .collection('books')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    books = booksSnap.docs.map(d => {
      const b = d.data();
      return {
        id: d.id,
        title: b.title || 'Untitled',
        type: b.type || 'ebook',
        status: b.status || 'draft',
        wordCount: b.wordCount || 0,
        createdAt: toTimestamp(b.createdAt) || nowIso(),
      };
    });
  } catch { /* ignore */ }

  // Payments
  let payments: AdminUserDetail['payments'] = [];
  let totalRevenuePaid = 0;
  try {
    const paymentsSnap = await db
      .collection('payments')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    payments = paymentsSnap.docs.map(d => {
      const p = d.data();
      const amt = Number(p.amount || 0);
      if (p.status === 'completed' || p.status === 'active') totalRevenuePaid += amt;
      return {
        id: d.id,
        plan: p.plan || '',
        amount: amt,
        currency: p.currency || 'USD',
        gateway: p.gateway || '',
        status: p.status || '',
        createdAt: toTimestamp(p.createdAt) || nowIso(),
      };
    });
  } catch { /* ignore */ }

  // Usage history (last 30 days from usageHistory subcollection)
  let usageHistory: AdminUserDetail['usageHistory'] = [];
  try {
    const usageSnap = await db
      .collection('usageHistory')
      .where('uid', '==', uid)
      .orderBy('date', 'desc')
      .limit(30)
      .get();
    usageHistory = usageSnap.docs.map(d => {
      const u = d.data();
      return {
        date: u.date || '',
        aiGenerations: u.aiGenerations || 0,
        pdfExports: u.pdfExports || 0,
        imageGenerations: u.imageGenerations || 0,
      };
    });
  } catch { /* ignore */ }

  // Audit reports
  let auditReports: AdminUserDetail['auditReports'] = [];
  try {
    const auditSnap = await db
      .collection('auditReports')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    auditReports = auditSnap.docs.map(d => {
      const a = d.data();
      return {
        id: d.id,
        score: a.overallScore || 0,
        createdAt: toTimestamp(a.createdAt) || nowIso(),
      };
    });
  } catch { /* ignore */ }

  // Subscription
  let subscriptionId: string | null = data.subscriptionId || null;
  let subscriptionCancelled = data.subscriptionCancelled || false;

  return {
    ...base,
    totalRevenuePaid,
    timezone: data.timezone || 'UTC',
    referralCode: data.referralCode || '',
    referredBy: data.referredBy || null,
    subscriptionId,
    subscriptionCancelled,
    adminNotes: data.adminNotes || '',
    adminNotesUpdatedAt: toTimestamp(data.adminNotesUpdatedAt) || undefined,
    books,
    payments,
    usageHistory,
    auditReports,
  };
}

/**
 * Manually grant/change a user's plan without charging them.
 */
export async function adminUpdateUserPlan(
  uid: string,
  plan: string,
  billingCycle: string,
  adminEmail: string,
  reason: string
): Promise<void> {
  if (!reason?.trim()) throw new Error('Reason is required for admin plan changes.');

  const db = getAdminDb();
  const now = nowIso();

  const planEndDate =
    billingCycle === 'lifetime'
      ? null
      : new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 86400000).toISOString();

  // Update user document
  if (db) {
    await db.collection('users').doc(uid).update({
      plan,
      billingCycle,
      planStartDate: now,
      planEndDate,
      paymentMethod: 'admin',
      updatedAt: now,
    });

    // Create admin-issued payment record
    const paymentId = makeId('pay');
    await db.collection('payments').doc(paymentId).set({
      id: paymentId,
      uid,
      plan,
      billingCycle,
      amount: 0,
      currency: 'USD',
      gateway: 'admin',
      status: 'completed',
      notes: reason,
      grantedBy: adminEmail,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Log the admin action
  await logAdminAction({
    adminEmail,
    action: 'update_plan',
    targetUid: uid,
    details: { plan, billingCycle, reason },
    timestamp: now,
  });

  // Get user email for notification
  if (db) {
    try {
      const userSnap = await db.collection('users').doc(uid).get();
      const userData = userSnap.data();
      if (userData?.email) {
        await sendPlanUpgradedEmail({
          to: userData.email,
          name: userData.name || userData.email,
          plan,
          billingCycle: billingCycle as any,
          amount: '0',
          currency: 'USD',
          gateway: 'admin',
          planEndDate: planEndDate,
          features: [],
        }).catch(console.error);
      }
    } catch { /* ignore */ }
  }
}

/**
 * Ban a user: set isBanned = true + revoke Firebase Auth tokens.
 */
export async function banUser(
  uid: string,
  adminEmail: string,
  reason: string
): Promise<void> {
  const db = getAdminDb();
  const auth = getAdminAuth();
  const now = nowIso();

  if (db) {
    await db.collection('users').doc(uid).update({
      isBanned: true,
      banReason: reason,
      bannedAt: now,
      updatedAt: now,
    });
  }

  // Revoke Firebase Auth refresh tokens (forces sign-out)
  if (auth) {
    try {
      await auth.revokeRefreshTokens(uid);
    } catch (err) {
      console.warn('[adminService.banUser] Token revocation failed:', err);
    }
  }

  await logAdminAction({
    adminEmail,
    action: 'ban_user',
    targetUid: uid,
    details: { reason },
    timestamp: now,
  });
}

/**
 * Unban a user.
 */
export async function unbanUser(uid: string, adminEmail: string): Promise<void> {
  const db = getAdminDb();
  const now = nowIso();

  if (db) {
    await db.collection('users').doc(uid).update({
      isBanned: false,
      banReason: null,
      bannedAt: null,
      updatedAt: now,
    });
  }

  await logAdminAction({
    adminEmail,
    action: 'unban_user',
    targetUid: uid,
    details: {},
    timestamp: now,
  });
}

/**
 * Soft-delete: disable Firebase Auth account, mark Firestore as deleted.
 * Firestore data is preserved for 60 days before cron cleanup.
 */
export async function deleteUserAccount(
  uid: string,
  adminEmail: string,
  reason: string
): Promise<void> {
  const db = getAdminDb();
  const auth = getAdminAuth();
  const now = nowIso();

  // Mark in Firestore first (preserve data)
  if (db) {
    await db.collection('users').doc(uid).update({
      isDeleted: true,
      deletedAt: now,
      deleteReason: reason,
      deleteScheduledAt: new Date(Date.now() + 60 * 86400000).toISOString(),
      updatedAt: now,
    });
  }

  // Disable Firebase Auth user (not delete — for 60-day window)
  if (auth) {
    try {
      await auth.updateUser(uid, { disabled: true });
    } catch (err) {
      console.warn('[adminService.deleteUserAccount] Auth disable failed:', err);
    }
  }

  await logAdminAction({
    adminEmail,
    action: 'delete_user',
    targetUid: uid,
    details: { reason },
    timestamp: now,
  });
}

/**
 * Update admin notes for a user (private, not visible to user).
 */
export async function updateAdminNotes(
  uid: string,
  notes: string,
  adminEmail: string
): Promise<void> {
  const db = getAdminDb();
  const now = nowIso();
  if (db) {
    await db.collection('users').doc(uid).update({
      adminNotes: notes,
      adminNotesUpdatedAt: now,
    });
  }
  await logAdminAction({
    adminEmail,
    action: 'update_notes',
    targetUid: uid,
    details: { notesLength: notes.length },
    timestamp: now,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview / Dashboard Stats
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const db = getAdminDb();

  const fallback: AdminOverviewStats = {
    users: { total: 0, newToday: 0, newThisWeek: 0, activeToday: 0 },
    revenue: { mrr: 0, todaysRevenue: 0, thisMonthRevenue: 0, pendingUpiAmount: 0 },
    pending: { upiCount: 0, bmacCount: 0, supportCount: 0, flaggedCount: 0 },
    planDistribution: { free: 0, starter: 0, pro: 0, agency: 0, lifetime: 0 },
    signupTrend: [],
  };

  if (!db) return fallback;

  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last24h = new Date(Date.now() - 86400000);

    // User counts
    const allUsersSnap = await db.collection('users').get();
    const allUsers = allUsersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    const total = allUsers.length;
    const newToday = allUsers.filter(u => {
      const created = toTimestamp(u.createdAt);
      return created && new Date(created) >= todayStart;
    }).length;
    const newThisWeek = allUsers.filter(u => {
      const created = toTimestamp(u.createdAt);
      return created && new Date(created) >= weekStart;
    }).length;
    const activeToday = allUsers.filter(u => {
      const seen = toTimestamp(u.lastSeen);
      return seen && new Date(seen) >= last24h;
    }).length;

    // Plan distribution
    const planDist = { free: 0, starter: 0, pro: 0, agency: 0, lifetime: 0 };
    allUsers.forEach(u => {
      const p = u.plan || 'free';
      if (p in planDist) planDist[p as keyof typeof planDist]++;
      else planDist.free++;
    });

    // Revenue from payments collection
    const paymentsSnap = await db.collection('payments').get();
    const payments = paymentsSnap.docs.map(d => d.data() as any);

    let mrr = 0;
    let todaysRevenue = 0;
    let thisMonthRevenue = 0;

    const MRR_MONTHLY: Record<string, number> = {
      starter: 9, pro: 29, agency: 79,
    };

    payments.forEach(p => {
      if (p.status !== 'completed' && p.status !== 'active') return;
      const amt = Number(p.amount || 0);
      const created = toTimestamp(p.createdAt);
      if (created) {
        if (new Date(created) >= todayStart) todaysRevenue += amt;
        if (new Date(created) >= monthStart) thisMonthRevenue += amt;
      }
    });

    // Approximate MRR from plan distribution
    mrr =
      planDist.starter * MRR_MONTHLY.starter +
      planDist.pro * MRR_MONTHLY.pro +
      planDist.agency * MRR_MONTHLY.agency;

    // UPI pending count + amount
    let upiCount = 0;
    let pendingUpiAmount = 0;
    try {
      const upiSnap = await db.collection('upiPending').where('status', '==', 'pending').get();
      upiCount = upiSnap.size;
      upiSnap.docs.forEach(d => {
        pendingUpiAmount += Number(d.data().amount || 0);
      });
    } catch { /* ignore */ }

    // BMaC unmatched
    let bmacCount = 0;
    try {
      const bmacSnap = await db
        .collection('bmacPayments')
        .where('matched', '==', false)
        .get();
      bmacCount = bmacSnap.size;
    } catch { /* ignore */ }

    // Support tickets
    let supportCount = 0;
    try {
      const supportSnap = await db
        .collection('contactForms')
        .where('status', '==', 'open')
        .get();
      supportCount = supportSnap.size;
    } catch { /* ignore */ }

    // Signup trend — last 30 days
    const signupTrend: AdminSignupTrend[] = [];
    const dateCounts: Record<string, number> = {};
    allUsers.forEach(u => {
      const created = toTimestamp(u.createdAt);
      if (!created) return;
      const d = created.split('T')[0];
      const dObj = new Date(d);
      const daysAgo = (Date.now() - dObj.getTime()) / 86400000;
      if (daysAgo <= 30) {
        dateCounts[d] = (dateCounts[d] || 0) + 1;
      }
    });
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      signupTrend.push({ date: key, count: dateCounts[key] || 0 });
    }
    // 7-day moving average
    for (let i = 0; i < signupTrend.length; i++) {
      const slice = signupTrend.slice(Math.max(0, i - 6), i + 1);
      const avg = slice.reduce((s, x) => s + x.count, 0) / slice.length;
      signupTrend[i].movingAvg7 = Math.round(avg * 10) / 10;
    }

    return {
      users: { total, newToday, newThisWeek, activeToday },
      revenue: { mrr, todaysRevenue, thisMonthRevenue, pendingUpiAmount },
      pending: { upiCount, bmacCount, supportCount, flaggedCount: 0 },
      planDistribution: planDist,
      signupTrend,
    };
  } catch (err) {
    console.error('[adminService.getAdminOverviewStats] Error:', err);
    return fallback;
  }
}

/**
 * Get recent activity feed by reading recent events from multiple collections.
 */
export async function getActivityFeed(limit = 20): Promise<AdminActivity[]> {
  const db = getAdminDb();
  if (!db) return [];

  const activities: AdminActivity[] = [];

  try {
    // Recent signups
    const signupSnap = await db
      .collection('users')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    signupSnap.docs.forEach(d => {
      const u = d.data();
      const ts = toTimestamp(u.createdAt);
      if (ts) {
        activities.push({
          id: `signup_${d.id}`,
          type: 'signup',
          description: `New signup: ${u.name || u.email}`,
          userName: u.name || '',
          userEmail: u.email || '',
          uid: d.id,
          country: u.country || '',
          timestamp: ts,
        });
      }
    });

    // Recent payments
    const paySnap = await db
      .collection('payments')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    paySnap.docs.forEach(d => {
      const p = d.data();
      const ts = toTimestamp(p.createdAt);
      if (ts) {
        activities.push({
          id: `payment_${d.id}`,
          type: 'payment',
          description: `Payment: ${p.name || p.email || p.uid} paid $${p.amount} for ${p.plan}`,
          uid: p.uid,
          amount: Number(p.amount || 0),
          plan: p.plan,
          timestamp: ts,
        });
      }
    });

    // UPI pending
    const upiSnap = await db
      .collection('upiPending')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    upiSnap.docs.forEach(d => {
      const u = d.data();
      const ts = toTimestamp(u.createdAt);
      if (ts) {
        activities.push({
          id: `upi_${d.id}`,
          type: 'upi_pending',
          description: `UPI pending: ${u.name || u.email} ₹${u.amount} for ${u.plan}`,
          uid: u.uid,
          amount: Number(u.amount || 0),
          plan: u.plan,
          timestamp: ts,
        });
      }
    });

    // Admin logs (ban/delete/plan changes)
    const logSnap = await db
      .collection('adminLogs')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    logSnap.docs.forEach(d => {
      const l = d.data();
      activities.push({
        id: `admin_${d.id}`,
        type: 'admin_action',
        description: `Admin action: ${l.action} by ${l.adminEmail}`,
        uid: l.targetUid,
        timestamp: l.timestamp || nowIso(),
      });
    });
  } catch (err) {
    console.warn('[adminService.getActivityFeed] Error:', err);
  }

  // Sort by timestamp desc, cap at limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Export users as CSV string.
 */
export async function exportUsersCSV(options: Partial<AdminUsersQuery> = {}): Promise<string> {
  const result = await getAllUsers({ limit: 5000, offset: 0, ...options });
  const headers = [
    'UID', 'Email', 'Name', 'Plan', 'Country', 'Currency',
    'Created At', 'Last Seen', 'Email Verified', 'Banned',
    'Total Books', 'Total PDF Exports', 'Total Revenue Paid',
  ];
  const rows = result.users.map(u => [
    u.uid, u.email, u.name, u.plan, u.country, u.currency,
    u.createdAt, u.lastSeen || '', u.emailVerified, u.isBanned,
    u.totalBooks, u.totalPdfExports, u.totalRevenuePaid,
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return csv;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 17B: Revenue & Payment Calculations
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EXCHANGE_RATES: Record<string, number> = {
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

export function normalizePaymentAmount(amount: number, currency = 'USD'): number {
  if (!amount || isNaN(amount)) return 0;
  if (currency.toUpperCase() === 'INR' && amount >= 10000) {
    return amount / 100;
  }
  if (['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(currency.toUpperCase()) && amount >= 1000) {
    return amount / 100;
  }
  return amount;
}

export function convertAmountToUSD(amount: number, currency = 'USD'): number {
  const norm = normalizePaymentAmount(amount, currency);
  const rate = ADMIN_EXCHANGE_RATES[currency.toUpperCase()] || 1.0;
  return Number((norm / rate).toFixed(2));
}

/**
 * Calculates Monthly Recurring Revenue (MRR) from active subscriptions.
 */
export async function calculateMRR(): Promise<number> {
  const db = getAdminDb();
  if (!db) return 0;

  try {
    const subSnap = await db
      .collection('subscriptions')
      .where('status', '==', 'active')
      .get();

    let mrr = 0;
    subSnap.docs.forEach(d => {
      const s = d.data();
      const plan = (s.plan || '').toLowerCase();
      const cycle = (s.billingCycle || 'monthly').toLowerCase();
      const amount = s.amount || 0;
      const currency = s.currency || 'USD';

      if (plan === 'lifetime') return; // Not recurring

      let usdAmount = 0;
      if (amount > 0) {
        usdAmount = convertAmountToUSD(amount, currency);
      } else {
        // Fallback standard plan pricing in USD
        if (plan === 'starter') usdAmount = 9;
        else if (plan === 'pro') usdAmount = 29;
        else if (plan === 'agency') usdAmount = 79;
      }

      if (cycle === 'annual') {
        mrr += usdAmount / 12;
      } else {
        mrr += usdAmount;
      }
    });

    // Fallback if no subscriptions collection populated yet: calculate from active paid users
    if (mrr === 0) {
      const userSnap = await db
        .collection('users')
        .where('plan', 'in', ['starter', 'pro', 'agency'])
        .get();

      userSnap.docs.forEach(d => {
        const u = d.data();
        if (u.isBanned) return;
        const plan = (u.plan || '').toLowerCase();
        const cycle = (u.billingCycle || 'monthly').toLowerCase();
        let planMonthly = plan === 'starter' ? 9 : plan === 'pro' ? 29 : plan === 'agency' ? 79 : 0;
        if (cycle === 'annual') planMonthly = (planMonthly * 10) / 12; // typical 2 months free
        mrr += planMonthly;
      });
    }

    return Number(mrr.toFixed(2));
  } catch (err) {
    console.warn('[adminService.calculateMRR] Error:', err);
    return 0;
  }
}

/**
 * Calculates Churn Rate for a given month (YYYY-MM).
 */
export async function calculateChurnRate(month?: string): Promise<number> {
  const db = getAdminDb();
  if (!db) return 0;

  try {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const startOfMonth = `${targetMonth}-01T00:00:00.000Z`;
    const endOfMonth = `${targetMonth}-31T23:59:59.999Z`;

    // 1. Cancelled subscriptions in this month
    const cancelledSnap = await db
      .collection('subscriptions')
      .where('status', '==', 'cancelled')
      .where('updatedAt', '>=', startOfMonth)
      .where('updatedAt', '<=', endOfMonth)
      .get();

    const cancelledCount = cancelledSnap.size;

    // 2. Active subscriptions
    const activeSnap = await db
      .collection('subscriptions')
      .where('status', '==', 'active')
      .get();

    const activeCount = activeSnap.size;
    const denominator = Math.max(activeCount + cancelledCount, 1);

    return Number(((cancelledCount / denominator) * 100).toFixed(1));
  } catch (err) {
    console.warn('[adminService.calculateChurnRate] Error:', err);
    return 0;
  }
}

/**
 * Retrieves daily revenue history for charts.
 */
export async function getDailyRevenue(days = 90): Promise<DailyRevenueItem[]> {
  const db = getAdminDb();
  if (!db) return [];

  try {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 86400000);
    const startIso = startDate.toISOString();

    const snap = await db
      .collection('payments')
      .where('status', '==', 'completed')
      .where('createdAt', '>=', startIso)
      .get();

    const revenueByDate: Record<string, { total: number; byPlan: Record<string, number> }> = {};

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      revenueByDate[dateStr] = { total: 0, byPlan: {} };
    }

    snap.docs.forEach(doc => {
      const p = doc.data();
      const dt = toTimestamp(p.createdAt);
      if (!dt) return;
      const dateStr = dt.split('T')[0];
      if (!revenueByDate[dateStr]) {
        revenueByDate[dateStr] = { total: 0, byPlan: {} };
      }

      const usd = convertAmountToUSD(p.amount, p.currency);
      const plan = (p.plan || 'pro').toLowerCase();

      revenueByDate[dateStr].total += usd;
      revenueByDate[dateStr].byPlan[plan] = (revenueByDate[dateStr].byPlan[plan] || 0) + usd;
    });

    const dates = Object.keys(revenueByDate).sort();
    const items: DailyRevenueItem[] = dates.map(date => ({
      date,
      revenue: Number(revenueByDate[date].total.toFixed(2)),
      byPlan: revenueByDate[date].byPlan,
    }));

    // Calculate 7-day moving average
    for (let i = 0; i < items.length; i++) {
      const windowStart = Math.max(0, i - 6);
      const windowItems = items.slice(windowStart, i + 1);
      const sum = windowItems.reduce((acc, it) => acc + it.revenue, 0);
      items[i].movingAvg7 = Number((sum / windowItems.length).toFixed(2));
    }

    return items;
  } catch (err) {
    console.warn('[adminService.getDailyRevenue] Error:', err);
    return [];
  }
}

/**
 * Returns comprehensive revenue summary for a given period.
 */
export async function getRevenueSummary(
  period: 'today' | 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<RevenueSummary> {
  const db = getAdminDb();
  if (!db) {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      mrr: 0,
      arr: 0,
      activePaidUsers: 0,
      paidUsersByPlan: {},
      revenueByPlan: [],
      revenueByGateway: [],
      revenueByCurrency: [],
      revenueGrowth: 0,
      userGrowth: 0,
      churnedUsers: 0,
      churnRate: 0,
      cancelledSubscriptions: [],
      cancellationReasons: [],
      averageRevenuePerUser: 0,
      lifetimeValue: 0,
    };
  }

  try {
    const now = new Date();
    let periodMs = 30 * 86400000;
    if (period === 'today') periodMs = 86400000;
    else if (period === 'week') periodMs = 7 * 86400000;
    else if (period === 'year') periodMs = 365 * 86400000;
    else if (period === 'all') periodMs = 3650 * 86400000;

    const currentStart = new Date(now.getTime() - periodMs).toISOString();
    const previousStart = new Date(now.getTime() - periodMs * 2).toISOString();

    // Fetch payments in current + previous period
    const paymentsSnap = await db
      .collection('payments')
      .where('status', '==', 'completed')
      .get();

    let totalRevenue = 0;
    let totalTransactions = 0;
    let previousRevenue = 0;

    const planRevenueMap: Record<string, { revenue: number; uids: Set<string> }> = {
      starter: { revenue: 0, uids: new Set() },
      pro: { revenue: 0, uids: new Set() },
      agency: { revenue: 0, uids: new Set() },
      lifetime: { revenue: 0, uids: new Set() },
    };

    const gatewayRevenueMap: Record<string, { revenue: number; count: number }> = {
      razorpay: { revenue: 0, count: 0 },
      paypal: { revenue: 0, count: 0 },
      upi: { revenue: 0, count: 0 },
      bmac: { revenue: 0, count: 0 },
    };

    const currencyMap: Record<string, { amount: number; amountUSD: number }> = {};

    paymentsSnap.docs.forEach(d => {
      const p = d.data();
      const dt = toTimestamp(p.createdAt);
      if (!dt) return;

      const usd = convertAmountToUSD(p.amount, p.currency);
      const normAmt = normalizePaymentAmount(p.amount, p.currency);
      const plan = (p.plan || 'pro').toLowerCase();
      const gateway = (p.gateway || 'other').toLowerCase();
      const currency = (p.currency || 'USD').toUpperCase();

      if (dt >= currentStart) {
        totalRevenue += usd;
        totalTransactions++;

        if (planRevenueMap[plan]) {
          planRevenueMap[plan].revenue += usd;
          if (p.uid) planRevenueMap[plan].uids.add(p.uid);
        }

        if (gatewayRevenueMap[gateway]) {
          gatewayRevenueMap[gateway].revenue += usd;
          gatewayRevenueMap[gateway].count++;
        } else {
          gatewayRevenueMap[gateway] = { revenue: usd, count: 1 };
        }

        if (!currencyMap[currency]) {
          currencyMap[currency] = { amount: 0, amountUSD: 0 };
        }
        currencyMap[currency].amount += normAmt;
        currencyMap[currency].amountUSD += usd;
      } else if (dt >= previousStart && dt < currentStart) {
        previousRevenue += usd;
      }
    });

    // Calculate MRR and ARR
    const mrr = await calculateMRR();
    const arr = Number((mrr * 12).toFixed(2));

    // Active paid users
    const usersSnap = await db.collection('users').get();
    let activePaidUsers = 0;
    let previousPaidUsers = 0;
    const paidUsersByPlan: Record<string, number> = {
      starter: 0,
      pro: 0,
      agency: 0,
      lifetime: 0,
    };

    usersSnap.docs.forEach(d => {
      const u = d.data();
      const plan = (u.plan || 'free').toLowerCase();
      const createdAt = toTimestamp(u.createdAt) || '';

      if (['starter', 'pro', 'agency', 'lifetime'].includes(plan) && !u.isBanned) {
        activePaidUsers++;
        paidUsersByPlan[plan] = (paidUsersByPlan[plan] || 0) + 1;
        if (createdAt < currentStart) {
          previousPaidUsers++;
        }
      }
    });

    // Growth rates
    const revenueGrowth = previousRevenue > 0
      ? Number((((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1))
      : totalRevenue > 0 ? 100 : 0;

    const userGrowth = previousPaidUsers > 0
      ? Number((((activePaidUsers - previousPaidUsers) / previousPaidUsers) * 100).toFixed(1))
      : activePaidUsers > 0 ? 100 : 0;

    // Churn calculation & cancellations
    const cancelledSubscriptions: CancelledSubscriptionItem[] = [];
    const reasonCounts: Record<string, number> = {
      'Too expensive': 0,
      'Not using enough': 0,
      'Missing features': 0,
      'Other': 0,
    };

    try {
      const cancelSnap = await db
        .collection('subscriptions')
        .where('status', '==', 'cancelled')
        .where('updatedAt', '>=', currentStart)
        .get();

      cancelSnap.docs.forEach(d => {
        const s = d.data();
        const reason = s.cancellationReason || s.reason || 'Other';
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;

        cancelledSubscriptions.push({
          id: d.id,
          uid: s.uid || '',
          userName: s.userName || s.email || 'Author',
          userEmail: s.email || '',
          plan: s.plan || 'pro',
          amount: convertAmountToUSD(s.amount || 0, s.currency || 'USD'),
          currency: s.currency || 'USD',
          reason,
          date: toTimestamp(s.updatedAt) || nowIso(),
        });
      });
    } catch {
      // Subscriptions collection optional
    }

    const churnedUsers = cancelledSubscriptions.length;
    const churnDenom = Math.max(activePaidUsers + churnedUsers, 1);
    const churnRate = Number(((churnedUsers / churnDenom) * 100).toFixed(1));

    const totalReasons = Object.values(reasonCounts).reduce((a, b) => a + b, 0) || 1;
    const cancellationReasons = Object.entries(reasonCounts).map(([reason, count]) => ({
      reason,
      count,
      percentage: Number(((count / totalReasons) * 100).toFixed(0)),
    }));

    // ARPU & LTV
    const averageRevenuePerUser = activePaidUsers > 0
      ? Number((totalRevenue / activePaidUsers).toFixed(2))
      : 0;

    const ltv = churnRate > 0
      ? Number((averageRevenuePerUser / (churnRate / 100)).toFixed(2))
      : Number((averageRevenuePerUser * 12).toFixed(2));

    const revenueByPlan = Object.entries(planRevenueMap).map(([plan, data]) => ({
      plan: plan.charAt(0).toUpperCase() + plan.slice(1),
      revenue: Number(data.revenue.toFixed(2)),
      userCount: paidUsersByPlan[plan] || data.uids.size,
    }));

    const revenueByGateway = Object.entries(gatewayRevenueMap).map(([gateway, data]) => ({
      gateway: gateway.toUpperCase(),
      revenue: Number(data.revenue.toFixed(2)),
      transactionCount: data.count,
    }));

    const revenueByCurrency = Object.entries(currencyMap).map(([currency, data]) => ({
      currency,
      amount: Number(data.amount.toFixed(2)),
      amountUSD: Number(data.amountUSD.toFixed(2)),
    }));

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalTransactions,
      mrr,
      arr,
      activePaidUsers,
      paidUsersByPlan,
      revenueByPlan,
      revenueByGateway,
      revenueByCurrency,
      revenueGrowth,
      userGrowth,
      churnedUsers,
      churnRate,
      cancelledSubscriptions,
      cancellationReasons,
      averageRevenuePerUser,
      lifetimeValue: ltv,
    };
  } catch (err) {
    console.error('[adminService.getRevenueSummary] Error:', err);
    throw err;
  }
}

/**
 * Returns paginated payments list with flexible filtering.
 */
export async function getAllPayments(query: AdminPaymentsQuery = {}): Promise<AdminPaymentsResult> {
  const db = getAdminDb();
  if (!db) return { payments: [], total: 0 };

  const {
    limit = 20,
    offset = 0,
    startDate,
    endDate,
    gateway,
    plan,
    status,
    currency,
    search,
  } = query;

  try {
    let q: any = db.collection('payments');

    if (gateway && gateway !== 'all') {
      q = q.where('gateway', '==', gateway.toLowerCase());
    }
    if (plan && plan !== 'all') {
      q = q.where('plan', '==', plan.toLowerCase());
    }
    if (status && status !== 'all') {
      q = q.where('status', '==', status.toLowerCase());
    }
    if (currency && currency !== 'all') {
      q = q.where('currency', '==', currency.toUpperCase());
    }

    const snap = await q.get();

    // Map and enrich docs
    let allRows: AdminPaymentRow[] = snap.docs.map((d: any) => {
      const p = d.data();
      const curr = (p.currency || 'USD').toUpperCase();
      const origAmt = normalizePaymentAmount(p.amount, curr);
      const usdAmt = convertAmountToUSD(p.amount, curr);

      return {
        id: d.id,
        uid: p.uid || '',
        userName: p.userName || p.name || '',
        userEmail: p.email || p.userEmail || '',
        plan: p.plan || 'pro',
        billingCycle: p.billingCycle || 'monthly',
        amount: origAmt,
        currency: curr,
        amountUSD: usdAmt,
        gateway: p.gateway || 'razorpay',
        status: p.status || 'completed',
        gatewayPaymentId: p.gatewayPaymentId || d.id,
        gatewaySubscriptionId: p.gatewaySubscriptionId || null,
        gatewayCustomerId: p.gatewayCustomerId || null,
        createdAt: toTimestamp(p.createdAt) || nowIso(),
        updatedAt: toTimestamp(p.updatedAt) || nowIso(),
        planStartDate: toTimestamp(p.planStartDate),
        planEndDate: toTimestamp(p.planEndDate),
        metadata: p.metadata || {},
        refundId: p.refundId,
        refundReason: p.refundReason,
        refundedAt: toTimestamp(p.refundedAt) || undefined,
        rawJson: JSON.stringify(p, null, 2),
      };
    });

    // Date filters
    if (startDate) {
      allRows = allRows.filter(r => r.createdAt >= startDate);
    }
    if (endDate) {
      allRows = allRows.filter(r => r.createdAt <= endDate + 'T23:59:59.999Z');
    }

    // Search filter (by email, name, payment ID, or UTR)
    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      allRows = allRows.filter(
        r =>
          r.userEmail.toLowerCase().includes(s) ||
          r.userName.toLowerCase().includes(s) ||
          r.gatewayPaymentId.toLowerCase().includes(s) ||
          r.id.toLowerCase().includes(s)
      );
    }

    // Sort by createdAt desc
    allRows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = allRows.length;
    const paginated = allRows.slice(offset, offset + limit);

    return { payments: paginated, total };
  } catch (err) {
    console.error('[adminService.getAllPayments] Error:', err);
    throw err;
  }
}

/**
 * Export filtered payments as CSV.
 */
export async function exportPaymentsCSV(query: AdminPaymentsQuery = {}): Promise<string> {
  const result = await getAllPayments({ ...query, limit: 5000, offset: 0 });
  const headers = [
    'Payment ID', 'Created At', 'User Email', 'User Name',
    'Plan', 'Billing Cycle', 'Amount', 'Currency', 'Amount (USD)',
    'Gateway', 'Status', 'Gateway Transaction ID', 'Gateway Subscription ID',
  ];
  const rows = result.payments.map(p => [
    p.id, p.createdAt, p.userEmail, p.userName,
    p.plan, p.billingCycle, p.amount, p.currency, p.amountUSD,
    p.gateway, p.status, p.gatewayPaymentId, p.gatewaySubscriptionId || '',
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return csv;
}

/**
 * Retrieves pending UPI payment requests with queue statistics.
 */
export async function getPendingUpiPayments(): Promise<{
  stats: UpiQueueStats;
  items: UpiQueueItem[];
}> {
  const db = getAdminDb();
  if (!db) {
    return {
      stats: { pendingCount: 0, totalAmount: 0, oldestPending: null, avgVerificationHours: 2 },
      items: [],
    };
  }

  try {
    const snap = await db
      .collection('upiPending')
      .where('status', '==', 'pending')
      .get();

    const items: UpiQueueItem[] = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        uid: data.uid || '',
        email: data.email || '',
        name: data.name || '',
        plan: data.plan || 'pro',
        billingCycle: data.billingCycle || 'monthly',
        amount: data.amount || 0,
        utrNumber: data.utrNumber || '',
        screenshotUrl: data.screenshotUrl || null,
        status: 'pending',
        submittedAt: toTimestamp(data.submittedAt) || nowIso(),
        reviewedAt: null,
        reviewedBy: null,
        notes: data.notes || null,
      };
    });

    // Sort by submittedAt ASC (oldest first)
    items.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

    const totalAmount = items.reduce((sum, it) => sum + it.amount, 0);
    const oldestPending = items.length > 0 ? items[0].submittedAt : null;

    // Calculate average verification time from last 30 reviewed docs
    let avgVerificationHours = 2.4;
    try {
      const reviewedSnap = await db
        .collection('upiPending')
        .where('status', 'in', ['approved', 'rejected'])
        .limit(30)
        .get();

      if (reviewedSnap.size > 0) {
        let totalHours = 0;
        let count = 0;
        reviewedSnap.docs.forEach(d => {
          const data = d.data();
          const sub = toTimestamp(data.submittedAt);
          const rev = toTimestamp(data.reviewedAt);
          if (sub && rev) {
            const diffHours = (new Date(rev).getTime() - new Date(sub).getTime()) / 3600000;
            if (diffHours > 0 && diffHours < 168) {
              totalHours += diffHours;
              count++;
            }
          }
        });
        if (count > 0) {
          avgVerificationHours = Number((totalHours / count).toFixed(1));
        }
      }
    } catch {
      // ignore
    }

    return {
      stats: {
        pendingCount: items.length,
        totalAmount,
        oldestPending,
        avgVerificationHours,
      },
      items,
    };
  } catch (err) {
    console.error('[adminService.getPendingUpiPayments] Error:', err);
    throw err;
  }
}

/**
 * Retrieves recently reviewed UPI payments (approved or rejected).
 */
export async function getUpiRecentHistory(limit = 10): Promise<UpiQueueItem[]> {
  const db = getAdminDb();
  if (!db) return [];

  try {
    const snap = await db
      .collection('upiPending')
      .where('status', 'in', ['approved', 'rejected'])
      .limit(limit * 2)
      .get();

    const items: UpiQueueItem[] = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        uid: data.uid || '',
        email: data.email || '',
        name: data.name || '',
        plan: data.plan || 'pro',
        billingCycle: data.billingCycle || 'monthly',
        amount: data.amount || 0,
        utrNumber: data.utrNumber || '',
        screenshotUrl: data.screenshotUrl || null,
        status: data.status,
        submittedAt: toTimestamp(data.submittedAt) || nowIso(),
        reviewedAt: toTimestamp(data.reviewedAt),
        reviewedBy: data.reviewedBy || null,
        notes: data.notes || null,
      };
    });

    items.sort((a, b) => {
      const bTime = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
      const aTime = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
      return bTime - aTime;
    });

    return items.slice(0, limit);
  } catch (err) {
    console.warn('[adminService.getUpiRecentHistory] Error:', err);
    return [];
  }
}

/**
 * Retrieves unmatched Buy Me a Coffee payments.
 */
export async function getUnmatchedBmac(): Promise<BmacQueueItem[]> {
  const db = getAdminDb();
  if (!db) return [];

  try {
    const snap = await db
      .collection('bmacUnmatched')
      .where('status', '==', 'unmatched')
      .get();

    const items: BmacQueueItem[] = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        bmacPaymentId: data.bmacPaymentId || d.id,
        amount: data.amount || 0,
        supportCoffees: data.supportCoffees || 1,
        supporterEmail: data.supporterEmail || '',
        supporterName: data.supporterName || '',
        supportNote: data.supportNote,
        message: data.message || data.supportNote,
        isSubscription: data.isSubscription || false,
        status: 'unmatched',
        resolvedUid: data.resolvedUid,
        resolvedAt: toTimestamp(data.resolvedAt) || undefined,
        resolvedBy: data.resolvedBy,
        rewardGranted: data.rewardGranted,
        createdAt: toTimestamp(data.createdAt) || nowIso(),
      };
    });

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    console.warn('[adminService.getUnmatchedBmac] Error:', err);
    return [];
  }
}

/**
 * Processes a refund for a payment record across Razorpay, PayPal, or manual UPI/BMaC.
 */
export async function processRefund(params: {
  paymentId: string;
  amount?: number;
  reason: string;
  notes?: string;
  adminEmail: string;
}): Promise<{ success: boolean; refundId: string; gatewayRefundId?: string }> {
  const db = getAdminDb();
  if (!db) throw new Error('Database connection failed');

  const { paymentId, amount: customAmount, reason, notes = '', adminEmail } = params;

  // 1. Fetch Payment Document
  const payRef = db.collection('payments').doc(paymentId);
  const paySnap = await payRef.get();
  if (!paySnap.exists) {
    throw new Error(`Payment ${paymentId} not found`);
  }

  const payment = paySnap.data()!;
  if (payment.status === 'refunded') {
    throw new Error('Payment has already been refunded');
  }

  const gateway = (payment.gateway || 'other').toLowerCase();
  const currency = (payment.currency || 'USD').toUpperCase();
  const originalNorm = normalizePaymentAmount(payment.amount, currency);
  const refundAmount = customAmount !== undefined && customAmount > 0 ? customAmount : originalNorm;

  if (refundAmount > originalNorm) {
    throw new Error(`Refund amount cannot exceed original payment amount (${currency} ${originalNorm})`);
  }

  // Check 180 day expiry for gateway APIs
  const createdAt = toTimestamp(payment.createdAt);
  if (createdAt) {
    const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86400000;
    if (ageDays > 180 && ['razorpay', 'paypal'].includes(gateway)) {
      throw new Error(`Payment is older than 180 days (${Math.floor(ageDays)} days). Gateway API refunds are expired. Process manual refund instead.`);
    }
  }

  const refundId = makeId('ref');
  let gatewayRefundId: string | undefined;
  let status: 'completed' | 'manual_pending' | 'failed' = 'completed';

  // 2. Gateway API Integration
  if (gateway === 'razorpay') {
    try {
      const { getRazorpayClient } = await import('./razorpay');
      const rzp = getRazorpayClient();
      const rzpPayId = payment.gatewayPaymentId || paymentId;

      // In paise for INR
      const refundAmountPaise = currency === 'INR' ? Math.round(refundAmount * 100) : refundAmount;

      const rzpRefund: any = await (rzp.payments as any).refund(rzpPayId, {
        amount: refundAmountPaise,
        notes: {
          reason,
          refundId,
          processedBy: adminEmail,
        },
      });
      gatewayRefundId = rzpRefund.id;
      status = 'completed';
    } catch (rzpErr: any) {
      console.error('[adminService.processRefund] Razorpay refund error:', rzpErr);
      throw new Error(`Razorpay refund failed: ${rzpErr.message || 'Unknown error'}`);
    }
  } else if (gateway === 'paypal') {
    try {
      const { paypalRequest } = await import('./paypal');
      const captureId = payment.gatewayPaymentId || paymentId;

      const ppRefund = await paypalRequest('POST', `/v2/payments/captures/${captureId}/refund`, {
        amount: {
          value: refundAmount.toFixed(2),
          currency_code: currency,
        },
        note_to_payer: reason,
      });
      gatewayRefundId = ppRefund.id;
      status = 'completed';
    } catch (ppErr: any) {
      console.error('[adminService.processRefund] PayPal refund error:', ppErr);
      throw new Error(`PayPal refund failed: ${ppErr.message || 'Unknown error'}`);
    }
  } else {
    // UPI or BMaC manual refund
    status = 'manual_pending';
  }

  const now = nowIso();
  const amountUSD = convertAmountToUSD(refundAmount, currency);

  const refundRecord: RefundRecord = {
    id: refundId,
    paymentId,
    uid: payment.uid || '',
    userEmail: payment.email || payment.userEmail || '',
    userName: payment.userName || payment.name || 'Kindle Author',
    amount: refundAmount,
    currency,
    amountUSD,
    gateway,
    reason,
    notes,
    status,
    gatewayRefundId,
    processedBy: adminEmail,
    createdAt: now,
  };

  // 3. Update Firestore Records
  await db.collection('refunds').doc(refundId).set(refundRecord);

  await payRef.update({
    status: 'refunded',
    refundId,
    refundReason: reason,
    refundAmount,
    refundedAt: now,
    updatedAt: now,
  });

  // 4. Log Admin Action
  await logAdminAction({
    adminEmail,
    action: 'process_refund',
    targetUid: payment.uid,
    targetEmail: payment.email || payment.userEmail,
    details: {
      paymentId,
      refundId,
      amount: refundAmount,
      currency,
      gateway,
      reason,
      gatewayRefundId,
    },
    timestamp: now,
  });

  return { success: true, refundId, gatewayRefundId };
}

