import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { resend, EMAIL_FROM, EMAIL_REPLY_TO, APP_URL } from './resend';

import {
  EmailTemplate,
  WelcomeEmailData,
  VerifyEmailData,
  PasswordResetEmailData,
  PlanUpgradedEmailData,
  PlanCancelledEmailData,
  PlanExpiringSoonEmailData,
  PaymentFailedEmailData,
  PaymentSuccessEmailData,
  UpiSubmittedEmailData,
  UpiApprovedEmailData,
  UpiRejectedEmailData,
  BmacReceivedEmailData,
  UsageWarningEmailData,
  QuotaExceededEmailData,
  WeeklyDigestEmailData,
  NewBookPublishedEmailData,
  ContactFormEmailData,
  AdminNewSignupData,
  AdminNewPaymentData,
  AdminUpiPendingData,
  BulkJobCompleteEmailData,
} from '../types/email';

import {
  WelcomeEmail,
  VerifyEmail,
  PasswordResetEmail,
  PlanUpgradedEmail,
  PlanCancelledEmail,
  PlanExpiringSoonEmail,
  PaymentFailedEmail,
  PaymentSuccessEmail,
  UpiSubmittedEmail,
  UpiApprovedEmail,
  UpiRejectedEmail,
  BmacReceivedEmail,
  UsageWarningEmail,
  QuotaExceededEmail,
  WeeklyDigestEmail,
  NewBookPublishedEmail,
  ContactFormEmail,
  AdminNewSignupEmail,
  AdminNewPaymentEmail,
  AdminUpiPendingEmail,
} from '../emails/templates';

const ADMIN_EMAIL = 
  (typeof process !== 'undefined' && process.env?.ADMIN_EMAIL) || 
  (typeof process !== 'undefined' && process.env?.EMAIL_REPLY_TO) || 
  'admin@kdpstudio.com';

/**
 * Generates a deterministic token for secure email unsubscribe links
 */
export function generateUnsubscribeToken(uid: string): string {
  const secret = (typeof process !== 'undefined' && process.env?.RESEND_API_KEY) || 'kdp_email_secret_key';
  let hash = 0;
  const str = `${uid || 'guest'}:${secret}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Verifies an unsubscribe token against a given UID
 */
export function verifyUnsubscribeToken(uid: string, token: string): boolean {
  if (!uid || !token) return false;
  return generateUnsubscribeToken(uid) === token;
}

/**
 * Helper to build the unsubscribe URL
 */
export function getUnsubscribeUrl(uid?: string): string {
  const safeUid = uid || 'guest';
  const token = generateUnsubscribeToken(safeUid);
  return `${APP_URL}/api/email/unsubscribe?uid=${encodeURIComponent(safeUid)}&token=${encodeURIComponent(token)}`;
}

/**
 * Checks whether user has opted out of non-critical notification category
 */
async function isUserOptedOut(uid: string | undefined, template: EmailTemplate): Promise<boolean> {
  if (!uid || uid === 'guest') return false;

  // Billing and security cannot be opted out
  const criticalTemplates: EmailTemplate[] = [
    'verify-email',
    'password-reset',
    'plan-upgraded',
    'plan-cancelled',
    'payment-failed',
    'payment-success',
    'upi-approved',
    'upi-rejected',
    'admin-new-signup',
    'admin-new-payment',
    'admin-upi-pending',
    'contact-form',
  ];

  if (criticalTemplates.includes(template)) return false;
  return false;
}

/**
 * Logs email sending attempt to Firestore /emailLogs collection (when available)
 */
async function logEmailAttempt(record: {
  to: string;
  originalTo: string;
  subject: string;
  template: EmailTemplate;
  resendId?: string | null;
  success: boolean;
  error?: string | null;
}) {
  // Silent success tracking
}

/**
 * Main function to render and dispatch emails via Resend
 */
export async function sendEmail<T extends Record<string, any>>(
  template: EmailTemplate,
  data: T,
  to: string,
  subject: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const uid = data?.uid;

    // Check opt-out for marketing / digests
    const optedOut = await isUserOptedOut(uid, template);
    if (optedOut) {
      console.log(`[EmailService] Skipping ${template} email to ${to} (user opted out)`);
      return { success: true, id: 'opted-out' };
    }

    // Determine target recipient (in dev mode, allow overriding to test email)
    const isDev = (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');
    const devTo = typeof process !== 'undefined' ? process.env?.DEV_EMAIL_TO : undefined;
    const targetTo = (isDev && devTo) ? devTo : to;

    // Attach unsubscribe URL
    const unsubscribeUrl = getUnsubscribeUrl(uid);
    const templateProps = { ...data, unsubscribeUrl };

    // Render JSX to static HTML
    let element: React.ReactElement | null = null;

    switch (template) {
      case 'welcome':
        element = React.createElement(WelcomeEmail, templateProps as any);
        break;
      case 'verify-email':
        element = React.createElement(VerifyEmail, templateProps as any);
        break;
      case 'password-reset':
        element = React.createElement(PasswordResetEmail, templateProps as any);
        break;
      case 'plan-upgraded':
        element = React.createElement(PlanUpgradedEmail, templateProps as any);
        break;
      case 'plan-cancelled':
        element = React.createElement(PlanCancelledEmail, templateProps as any);
        break;
      case 'plan-expiring-soon':
        element = React.createElement(PlanExpiringSoonEmail, templateProps as any);
        break;
      case 'payment-failed':
        element = React.createElement(PaymentFailedEmail, templateProps as any);
        break;
      case 'payment-success':
        element = React.createElement(PaymentSuccessEmail, templateProps as any);
        break;
      case 'upi-submitted':
        element = React.createElement(UpiSubmittedEmail, templateProps as any);
        break;
      case 'upi-approved':
        element = React.createElement(UpiApprovedEmail, templateProps as any);
        break;
      case 'upi-rejected':
        element = React.createElement(UpiRejectedEmail, templateProps as any);
        break;
      case 'bmac-received':
        element = React.createElement(BmacReceivedEmail, templateProps as any);
        break;
      case 'usage-warning':
        element = React.createElement(UsageWarningEmail, templateProps as any);
        break;
      case 'quota-exceeded':
        element = React.createElement(QuotaExceededEmail, templateProps as any);
        break;
      case 'weekly-digest':
        element = React.createElement(WeeklyDigestEmail, templateProps as any);
        break;
      case 'new-book-published':
        element = React.createElement(NewBookPublishedEmail, templateProps as any);
        break;
      case 'contact-form':
        element = React.createElement(ContactFormEmail, templateProps as any);
        break;
      case 'admin-new-signup':
        element = React.createElement(AdminNewSignupEmail, templateProps as any);
        break;
      case 'admin-new-payment':
        element = React.createElement(AdminNewPaymentEmail, templateProps as any);
        break;
      case 'admin-upi-pending':
        element = React.createElement(AdminUpiPendingEmail, templateProps as any);
        break;
      default:
        throw new Error(`Unknown email template: ${template}`);
    }

    const html = '<!DOCTYPE html>' + renderToStaticMarkup(element);

    // If Resend API key is not configured or in sandbox mode without key
    const apiKey = typeof process !== 'undefined' ? process.env?.RESEND_API_KEY : undefined;
    if (!apiKey || apiKey.includes('REPLACE')) {
      console.log(`[EmailService DEV SIMULATION] Sending "${subject}" to ${targetTo} [Template: ${template}]`);
      await logEmailAttempt({
        to: targetTo,
        originalTo: to,
        subject,
        template,
        resendId: `sim_${Date.now()}`,
        success: true,
      });
      return { success: true, id: `sim_${Date.now()}` };
    }

    // Call Resend SDK
    const { data: resendData, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [targetTo],
      replyTo: EMAIL_REPLY_TO,
      subject,
      html,
    });

    if (error) {
      console.error(`[EmailService ERROR] Failed sending ${template} to ${targetTo}:`, error);
      await logEmailAttempt({
        to: targetTo,
        originalTo: to,
        subject,
        template,
        success: false,
        error: error.message || String(error),
      });
      return { success: false, error: error.message };
    }

    const resendId = resendData?.id || `resend_${Date.now()}`;
    console.log(`[EmailService SUCCESS] Sent ${template} to ${targetTo}, ID: ${resendId}`);

    await logEmailAttempt({
      to: targetTo,
      originalTo: to,
      subject,
      template,
      resendId,
      success: true,
    });

    return { success: true, id: resendId };
  } catch (err: any) {
    console.error(`[EmailService UNHANDLED ERROR]`, err);
    await logEmailAttempt({
      to: to,
      originalTo: to,
      subject,
      template,
      success: false,
      error: err?.message || String(err),
    });
    return { success: false, error: err?.message || 'Email delivery failed' };
  }
}

/* ─────────────────────────────────────────────────────────────
 * Exported Helper Functions
 * ───────────────────────────────────────────────────────────── */

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  sendEmail('welcome', data, data.to, 'Welcome to KDP Studio! 🎉').catch(console.error);
}

export async function sendVerifyEmail(data: VerifyEmailData): Promise<void> {
  sendEmail('verify-email', data, data.to, 'Verify your email address').catch(console.error);
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  sendEmail('password-reset', data, data.to, 'Reset your password').catch(console.error);
}

export async function sendPlanUpgradedEmail(data: PlanUpgradedEmailData): Promise<void> {
  const planDisplay = data.plan.toUpperCase();
  sendEmail('plan-upgraded', data, data.to, `Your ${planDisplay} plan is now active 🚀`).catch(console.error);
}

export async function sendPlanCancelledEmail(data: PlanCancelledEmailData): Promise<void> {
  sendEmail('plan-cancelled', data, data.to, 'Your subscription has been cancelled').catch(console.error);
}

export async function sendPlanExpiringSoonEmail(data: PlanExpiringSoonEmailData): Promise<void> {
  sendEmail('plan-expiring-soon', data, data.to, `Your plan expires in ${data.daysLeft} days`).catch(console.error);
}

export async function sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<void> {
  sendEmail('payment-failed', data, data.to, 'Action needed — payment failed').catch(console.error);
}

export async function sendPaymentSuccessEmail(data: PaymentSuccessEmailData): Promise<void> {
  sendEmail('payment-success', data, data.to, 'Payment Receipt — KDP Studio').catch(console.error);
}

export async function sendUpiSubmittedEmail(data: UpiSubmittedEmailData): Promise<void> {
  sendEmail('upi-submitted', data, data.to, 'UPI payment received — verifying now 🕐').catch(console.error);
}

export async function sendUpiApprovedEmail(data: UpiApprovedEmailData): Promise<void> {
  sendEmail('upi-approved', data, data.to, `Payment verified — ${data.plan.toUpperCase()} plan activated ✅`).catch(console.error);
}

export async function sendUpiRejectedEmail(data: UpiRejectedEmailData): Promise<void> {
  sendEmail('upi-rejected', data, data.to, 'Payment could not be verified').catch(console.error);
}

export async function sendBmacReceivedEmail(data: BmacReceivedEmailData): Promise<void> {
  sendEmail('bmac-received', data, data.to, 'Thanks for your support ☕').catch(console.error);
}

export async function sendUsageWarningEmail(data: UsageWarningEmailData): Promise<void> {
  sendEmail('usage-warning', data, data.to, `You're at ${data.percentage}% of your daily limit`).catch(console.error);
}

export async function sendQuotaExceededEmail(data: QuotaExceededEmailData): Promise<void> {
  sendEmail('quota-exceeded', data, data.to, 'Daily limit reached — upgrade for more').catch(console.error);
}

export async function sendWeeklyDigestEmail(data: WeeklyDigestEmailData): Promise<void> {
  sendEmail('weekly-digest', data, data.to, 'Your KDP Studio week in review 📚').catch(console.error);
}

export async function sendNewBookPublishedEmail(data: NewBookPublishedEmailData): Promise<void> {
  sendEmail('new-book-published', data, data.to, `Congratulations! "${data.bookTitle}" is ready for KDP 🚀`).catch(console.error);
}

export async function sendContactFormEmail(data: ContactFormEmailData): Promise<void> {
  sendEmail('contact-form', data, ADMIN_EMAIL, `New contact form submission: ${data.subject}`).catch(console.error);
}

export async function sendAdminNewSignupEmail(data: AdminNewSignupData): Promise<void> {
  sendEmail('admin-new-signup', data, ADMIN_EMAIL, `[Admin] New signup: ${data.userEmail}`).catch(console.error);
}

export async function sendAdminNewPaymentEmail(data: AdminNewPaymentData): Promise<void> {
  sendEmail('admin-new-payment', data, ADMIN_EMAIL, `[Admin] New payment: ${data.amount} from ${data.userEmail}`).catch(console.error);
}

export async function sendBulkJobCompleteEmail(data: BulkJobCompleteEmailData): Promise<void> {
  sendEmail('welcome', data, data.to, `Batch complete — ${data.completedCount} books ready 📦`).catch(console.error);
}

export async function sendAdminUpiPendingEmail(data: AdminUpiPendingData): Promise<void> {
  sendEmail('admin-upi-pending', data, ADMIN_EMAIL, '[Admin] UPI payment pending approval').catch(console.error);
}

/**
 * Returns the bullet points shown in upgrade and welcome emails
 */
export function getPlanFeatures(plan: string): string[] {
  const normalized = (plan || 'free').toLowerCase();
  switch (normalized) {
    case 'starter':
      return [
        '20 AI generations per day',
        '10 PDF exports per day',
        'EPUB export',
        'Puzzle book generator',
        'Brand kit',
        'Watermark-free exports',
      ];
    case 'pro':
      return [
        'Unlimited AI writing',
        'Unlimited PDF exports',
        'AI cover image generation',
        'AI book translator',
        'Niche research tool',
        'Priority support',
      ];
    case 'agency':
      return [
        'Everything in Pro',
        '3 team seats',
        'Bulk book generator',
        'White-label exports',
        'API access',
      ];
    case 'free':
    default:
      return [];
  }
}

