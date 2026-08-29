/**
 * Admin Dashboard Types
 * All admin-specific interfaces for Phase 17A
 */

// ────────────────────────────────────────────────
// User views
// ────────────────────────────────────────────────

export interface AdminUserView {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  plan: string;
  planStartDate: string | null;
  planEndDate: string | null;
  billingCycle: string | null;
  paymentMethod: string | null;
  country: string;
  currency: string;
  createdAt: string;
  lastSeen: string | null;
  emailVerified: boolean;
  isBanned: boolean;
  banReason?: string;
  onboardingComplete: boolean;

  // Computed
  totalBooks: number;
  totalPdfExports: number;
  totalRevenuePaid: number;

  // Today's usage
  todayAiGenerations: number;
  todayPdfExports: number;
}

export interface AdminUserBook {
  id: string;
  title: string;
  type: string;
  status: string;
  wordCount: number;
  createdAt: string;
}

export interface AdminUserPayment {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  createdAt: string;
}

export interface AdminUserDailyUsage {
  date: string;
  aiGenerations: number;
  pdfExports: number;
  imageGenerations: number;
}

export interface AdminUserDetail extends AdminUserView {
  timezone: string;
  referralCode: string;
  referredBy: string | null;
  subscriptionId: string | null;
  subscriptionCancelled: boolean;
  adminNotes?: string;
  adminNotesUpdatedAt?: string;

  books: AdminUserBook[];
  payments: AdminUserPayment[];
  usageHistory: AdminUserDailyUsage[];
  auditReports: { id: string; score: number; createdAt: string }[];
}

// ────────────────────────────────────────────────
// Admin Logs
// ────────────────────────────────────────────────

export interface AdminLogAction {
  adminEmail: string;
  action: string;
  targetUid?: string;
  targetEmail?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface AdminLog extends AdminLogAction {
  id: string;
}

// ────────────────────────────────────────────────
// Overview Dashboard
// ────────────────────────────────────────────────

export interface AdminOverviewStats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    activeToday: number;
  };
  revenue: {
    mrr: number;
    todaysRevenue: number;
    thisMonthRevenue: number;
    pendingUpiAmount: number;
  };
  pending: {
    upiCount: number;
    bmacCount: number;
    supportCount: number;
    flaggedCount: number;
  };
  planDistribution: {
    free: number;
    starter: number;
    pro: number;
    agency: number;
    lifetime: number;
  };
  signupTrend: AdminSignupTrend[];
}

export interface AdminSignupTrend {
  date: string; // YYYY-MM-DD
  count: number;
  movingAvg7?: number;
}

// ────────────────────────────────────────────────
// Activity Feed
// ────────────────────────────────────────────────

export type ActivityEventType =
  | 'signup'
  | 'payment'
  | 'upgrade'
  | 'cancel'
  | 'upi_pending'
  | 'bmac_unmatched'
  | 'support'
  | 'export_error'
  | 'ban'
  | 'admin_action';

export interface AdminActivity {
  id: string;
  type: ActivityEventType;
  description: string;
  userName?: string;
  userEmail?: string;
  uid?: string;
  amount?: number;
  plan?: string;
  country?: string;
  timestamp: string;
}

// ────────────────────────────────────────────────
// User list query options
// ────────────────────────────────────────────────

export interface AdminUsersQuery {
  limit: number;
  offset: number;
  searchQuery?: string;
  planFilter?: string;
  statusFilter?: string; // 'all' | 'active' | 'banned' | 'unverified'
  countryFilter?: string;
  sortBy?: string; // 'createdAt' | 'lastSeen' | 'plan' | 'totalRevenuePaid'
  sortOrder?: 'asc' | 'desc';
}

export interface AdminUsersResult {
  users: AdminUserView[];
  total: number;
}
