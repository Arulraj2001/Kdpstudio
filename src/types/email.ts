/**
 * Email Types for KDP Studio Email Pipeline
 */

export type EmailTemplate =
  | 'welcome'
  | 'verify-email'
  | 'password-reset'
  | 'plan-upgraded'
  | 'plan-cancelled'
  | 'plan-expiring-soon'
  | 'payment-failed'
  | 'payment-success'
  | 'upi-submitted'
  | 'upi-approved'
  | 'upi-rejected'
  | 'bmac-received'
  | 'usage-warning'
  | 'quota-exceeded'
  | 'weekly-digest'
  | 'new-book-published'
  | 'contact-form'
  | 'admin-new-signup'
  | 'admin-new-payment'
  | 'admin-upi-pending';

export interface BaseEmailData {
  to: string;
  name: string;
  uid?: string;
  unsubscribeToken?: string;
}

export interface WelcomeEmailData extends BaseEmailData {
  verificationUrl?: string;
}

export interface VerifyEmailData extends BaseEmailData {
  verificationUrl: string;
}

export interface PasswordResetEmailData extends BaseEmailData {
  resetUrl: string;
  expiresInMinutes?: number;
}

export interface PlanUpgradedEmailData extends BaseEmailData {
  plan: string;
  billingCycle: string;
  amount: string;
  currency: string;
  gateway: string;
  planEndDate: string | null;
  features: string[];
}

export interface PlanCancelledEmailData extends BaseEmailData {
  plan: string;
  activeUntil: string;
  effectiveDate?: string;
  reason?: string;
}

export interface PlanExpiringSoonEmailData extends BaseEmailData {
  plan: string;
  expiresOn: string;
  daysLeft: number;
  renewUrl: string;
}

export interface PaymentFailedEmailData extends BaseEmailData {
  plan: string;
  amount: string;
  gateway: string;
  retryUrl: string;
}

export interface PaymentSuccessEmailData extends BaseEmailData {
  plan: string;
  amount: string;
  currency: string;
  gateway: string;
  transactionId?: string;
  paymentId?: string;
  invoiceUrl?: string;
  date?: string;
  billingCycle?: string;
  activeUntil?: string | null;
}

export interface UpiSubmittedEmailData extends BaseEmailData {
  plan: string;
  amount: string;
  utrNumber: string;
  submittedAt?: string;
  estimatedTime?: string;
}

export interface UpiApprovedEmailData extends BaseEmailData {
  plan: string;
  amount: string;
  activeUntil: string | null;
}

export interface UpiRejectedEmailData extends BaseEmailData {
  plan: string;
  amount: string;
  reason: string;
  supportEmail?: string;
}

export interface BmacReceivedEmailData extends BaseEmailData {
  amount: string;
  reward: string;
  credits?: number;
  plan?: string;
}

export interface UsageWarningEmailData extends BaseEmailData {
  feature: string;
  used: number;
  limit: number;
  percentage: number;
  resetTime: string;
  upgradeUrl?: string;
}

export interface QuotaExceededEmailData extends BaseEmailData {
  feature: string;
  limit: number;
  resetTime: string;
  upgradeUrl?: string;
  currentPlan: string;
}

export interface WeeklyDigestEmailData extends BaseEmailData {
  weekStart: string;
  weekEnd: string;
  booksCreated: number;
  aiGenerations: number;
  pdfsExported: number;
  currentPlan: string;
  tipTitle: string;
  tipBody: string;
  tipLink: string;
}

export interface NewBookPublishedEmailData extends BaseEmailData {
  bookTitle: string;
  bookType?: string;
  trimSize?: string;
  pageCount?: number;
  kdpUrl?: string;
}

export interface ContactFormEmailData {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  timestamp?: string;
}

export interface AdminNewSignupData {
  userName: string;
  userEmail: string;
  country: string;
  currency: string;
  signupMethod: string;
  timestamp?: string;
}

export interface AdminNewPaymentData {
  userName: string;
  userEmail: string;
  plan: string;
  amount: string;
  currency: string;
  gateway: string;
  country?: string;
  timestamp?: string;
}

export interface AdminUpiPendingData {
  userName: string;
  userEmail: string;
  plan: string;
  amount: string;
  utrNumber: string;
  pendingId?: string;
  adminUrl?: string;
  submittedAt?: string;
}

export interface BulkJobCompleteEmailData extends BaseEmailData {
  templateName: string;
  completedCount: number;
  failedCount: number;
  totalVariations: number;
  timeTaken: string;
  zipUrl: string | null;
  jobUrl: string;
}

export interface EmailPreferences {
  weeklyDigest: boolean;
  usageWarnings: boolean;
  marketing: boolean;
  billing: boolean; // Always true
  security: boolean; // Always true
}

export interface EmailLogRecord {
  id?: string;
  to: string;
  subject: string;
  template: EmailTemplate;
  sentAt: any;
  resendId?: string | null;
  success: boolean;
  error?: string | null;
}
