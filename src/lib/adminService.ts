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
