/**
 * HOW TO SETUP RESEND:
 * 1. Go to resend.com and create a free account
 * 2. Free tier: 3,000 emails/month, 100/day
 * 3. Add and verify your domain in Resend dashboard
 * 4. Create an API key under API Keys section
 * 5. Add DNS records Resend provides to your domain
 * 6. Update EMAIL_FROM to use your verified domain
 * 7. Without domain verification, emails go to spam
 */

import { Resend } from 'resend';

const getEnv = (key: string, fallback = ''): string => {
  if (typeof process !== 'undefined' && process?.env && process.env[key]) {
    return process.env[key] as string;
  }
  const meta = typeof import.meta !== 'undefined' ? (import.meta as any) : undefined;
  if (meta?.env && meta.env[key]) {
    return meta.env[key] as string;
  }
  return fallback;
};

const resendApiKey = getEnv('RESEND_API_KEY', getEnv('VITE_RESEND_API_KEY', ''));

// Lazy / safe Resend instance
export const resend = new Resend(resendApiKey || 're_placeholder_key');

export const EMAIL_FROM =
  getEnv('EMAIL_FROM', getEnv('VITE_EMAIL_FROM', 'KDP Studio <noreply@kdpstudio.com>'));

export const EMAIL_REPLY_TO =
  getEnv('EMAIL_REPLY_TO', getEnv('VITE_EMAIL_REPLY_TO', 'support@kdpstudio.com'));

export const APP_URL =
  getEnv('NEXT_PUBLIC_APP_URL', getEnv('VITE_APP_URL', getEnv('APP_URL', 'http://localhost:3000')));

export const APP_NAME = 'KDP Studio';

/**
 * Generic transactional email helper used by the server-side admin service.
 * Wraps the Resend SDK so sending code does not depend on SDK internals.
 */
export async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  text?: string;
}): Promise<any> {
  return resend.emails.send({
    from: payload.from || EMAIL_FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo || EMAIL_REPLY_TO,
  });
}
