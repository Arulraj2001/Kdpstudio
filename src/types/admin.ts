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

// ────────────────────────────────────────────────
// Phase 17B: Revenue Dashboard & Payment Types
// ────────────────────────────────────────────────

export interface RevenueByPlan {
  plan: string;
  revenue: number;
  userCount: number;
}

export interface RevenueByGateway {
  gateway: string;
  revenue: number;
  transactionCount: number;
}

export interface RevenueByCurrency {
  currency: string;
  amount: number;
  amountUSD: number;
}

export interface CancelledSubscriptionItem {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  plan: string;
  amount: number;
  currency: string;
  reason: string;
  date: string;
}

export interface RevenueSummary {
  totalRevenue: number; // USD
  totalTransactions: number;

  // Recurring
  mrr: number;
  arr: number;
  activePaidUsers: number;
  paidUsersByPlan: Record<string, number>;

  // Breakdowns
  revenueByPlan: RevenueByPlan[];
  revenueByGateway: RevenueByGateway[];
  revenueByCurrency: RevenueByCurrency[];

  // Growth
  revenueGrowth: number; // % vs previous period
  userGrowth: number;

  // Churn
  churnedUsers: number;
  churnRate: number; // %
  cancelledSubscriptions: CancelledSubscriptionItem[];
  cancellationReasons: { reason: string; count: number; percentage: number }[];

  // Averages
  averageRevenuePerUser: number; // ARPU
  lifetimeValue: number; // estimated LTV

  // Net period revenue & refunds (consumed by RevenuePage UI)
  netRevenue?: number;
  refundsAmount?: number;
  refundsCount?: number;
}

export interface DailyRevenueItem {
  date: string; // YYYY-MM-DD
  revenue: number; // USD
  movingAvg7?: number;
  byPlan?: Record<string, number>;
}

export interface AdminPaymentRow {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  plan: string;
  billingCycle: string;
  amount: number;
  currency: string;
  amountUSD: number;
  gateway: string;
  status: string;
  gatewayPaymentId: string;
  gatewaySubscriptionId: string | null;
  gatewayCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
  planStartDate: string | null;
  planEndDate: string | null;
  metadata?: Record<string, any>;
  refundId?: string;
  refundReason?: string;
  refundedAt?: string;
  rawJson?: string;
}

export interface AdminPaymentsQuery {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  gateway?: string;
  plan?: string;
  status?: string;
  currency?: string;
  search?: string;
}

export interface AdminPaymentsResult {
  payments: AdminPaymentRow[];
  total: number;
}

export interface UpiQueueItem {
  id: string;
  uid: string;
  email: string;
  name: string;
  plan: string;
  billingCycle: string;
  amount: number;
  utrNumber: string;
  screenshotUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  notes: string | null;
}

export interface UpiQueueStats {
  pendingCount: number;
  totalAmount: number;
  oldestPending: string | null;
  avgVerificationHours: number;
}

export interface BmacQueueItem {
  id: string;
  bmacPaymentId: number | string;
  amount: number;
  supportCoffees: number;
  supporterEmail: string;
  supporterName: string;
  supportNote?: string;
  message?: string;
  isSubscription?: boolean;
  status: 'unmatched' | 'resolved' | 'ignored';
  resolvedUid?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  rewardGranted?: string;
  createdAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  uid: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  amountUSD: number;
  gateway: string;
  reason: string;
  notes?: string;
  status: 'completed' | 'manual_pending' | 'failed';
  gatewayRefundId?: string;
  processedBy: string;
  createdAt: string;
}

// ────────────────────────────────────────────────
// Phase 17C: Feature Usage, Health, Support, Broadcast, Moderation
// ────────────────────────────────────────────────

export interface FeatureEvent {
  id?: string;
  uid: string;
  feature: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface FeatureStats {
  feature: string;
  count: number;
  label: string;
  category: 'writing' | 'export' | 'puzzle' | 'research' | 'analytics' | 'brand' | 'other';
  percentageOfUsers?: number;
}

export interface FeaturePlanUsage {
  feature: string;
  label: string;
  free: number;
  starter: number;
  pro: number;
  agency: number;
}

export interface FeatureFunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoffPercentage: number;
}

export interface UserActivityBucket {
  bucket: string;
  count: number;
  percentage: number;
}

export interface EngagementMetrics {
  dau: number;
  wau: number;
  mau: number;
  stickinessRatio: number; // (DAU / MAU) * 100
}

export interface FeatureAnalyticsReport {
  period: '7d' | '30d' | '90d';
  topFeatures: FeatureStats[];
  planUsage: FeaturePlanUsage[];
  funnel: FeatureFunnelStep[];
  distribution: UserActivityBucket[];
  engagement: EngagementMetrics;
}

// ── System Health ──

export type HealthStatusLevel = 'operational' | 'degraded' | 'error' | 'unknown';

export interface ServiceCheckResult {
  name: string;
  status: HealthStatusLevel;
  latencyMs?: number;
  lastChecked?: string;
  details?: string;
}

export interface CronJobLog {
  jobName: string;
  schedule: string;
  lastRun: string;
  status: 'success' | 'failed' | 'running';
  durationMs?: number;
  resultCount?: number;
  nextRun?: string;
  error?: string;
}

export interface SystemErrorLog {
  id: string;
  type: 'pdf_export' | 'ai_generation' | 'imagen' | 'payment_webhook' | 'email_send' | 'cron' | 'other';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ApiResponseMetric {
  route: string;
  avgLatencyMs: number;
  p95LatencyMs: number;
  requestCount: number;
}

export interface SystemHealthReport {
  overallStatus: 'operational' | 'degraded' | 'critical';
  services: ServiceCheckResult[];
  cronJobs: CronJobLog[];
  recentErrors: SystemErrorLog[];
  apiPerformance: ApiResponseMetric[];
  lastUpdated: string;
}

// ── Support Center ──

export interface SupportTicket {
  id: string;
  uid?: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  category: 'General' | 'Billing' | 'Technical' | 'Feature';
  message: string;
  status: 'open' | 'responded' | 'closed';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  replyText?: string;
  repliedAt?: string;
  repliedBy?: string;
}

export interface SupportStats {
  total: number;
  open: number;
  responded: number;
  closed: number;
  avgResponseHours: number;
}

// ── Broadcast Email ──

export interface BroadcastAudienceFilter {
  type: 'all' | 'free' | 'starter' | 'pro' | 'agency' | 'paid' | 'country' | 'specific_emails';
  country?: string;
  specificEmails?: string[];
  excludeUnsubscribed?: boolean;
  excludeBanned?: boolean;
}

export interface BroadcastJob {
  id: string;
  subject: string;
  preheader?: string;
  bodyMarkdown: string;
  audience: BroadcastAudienceFilter;
  targetCount: number;
  sentCount: number;
  failedCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
  openRate?: number;
  clickRate?: number;
}

// ── App Settings ──

export interface FeatureFlagsConfig {
  puzzleGenerators: boolean;
  nicheResearch: boolean;
  bulkGenerator: boolean;
  contentAudit: boolean;
  analytics: boolean;
  versionHistory: boolean;
  aiWriting: boolean;
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  expectedBack?: string;
}

export interface ApiKeysStatus {
  gemini: boolean;
  imagen: boolean;
  razorpay: boolean;
  paypal: boolean;
  resend: boolean;
  firebaseAdmin: boolean;
}

export interface PlanPricingConfig {
  starterMonthly: number;
  starterAnnual: number;
  proMonthly: number;
  proAnnual: number;
  agencyMonthly: number;
  agencyAnnual: number;
  lifetime: number;
  starterMonthlyInr?: number;
  starterAnnualInr?: number;
  proMonthlyInr?: number;
  proAnnualInr?: number;
  agencyMonthlyInr?: number;
  agencyAnnualInr?: number;
  lifetimeInr?: number;
}

export interface AppConfigData {
  features: FeatureFlagsConfig;
  maintenance: MaintenanceConfig;
  apiKeys: ApiKeysStatus;
  pricing: PlanPricingConfig;
}

// ── Content Moderation ──

export interface FlaggedContentItem {
  id: string;
  uid: string;
  userEmail?: string;
  userName?: string;
  bookId: string;
  bookTitle: string;
  flagType: 'kdp_policy' | 'plagiarism' | 'offensive' | 'copyright' | 'ai_repetition';
  flaggedText: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
  reviewed: boolean;
  verdict?: 'false_positive' | 'minor_concern' | 'policy_violation' | 'serious_violation';
  noteToUser?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AuditReportSummary {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  score: number;
  auditType: 'basic' | 'full';
  issuesCount: number;
  kdpRisk: 'low' | 'moderate' | 'high';
  createdAt: string;
}


