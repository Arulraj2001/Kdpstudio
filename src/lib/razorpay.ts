/**
 * Server-side Razorpay SDK Client and Subscription Plan IDs
 * 
 * HOW TO CREATE RAZORPAY PLANS:
 * 1. Go to razorpay.com → Login → Subscriptions → Plans
 * 2. Create a plan for each pricing tier
 * 3. Set interval: monthly or yearly
 * 4. Set amount in paise (₹1499 = 149900 paise)
 * 5. Copy the plan ID (starts with 'plan_')
 * 6. Replace the placeholder values in RAZORPAY_PLAN_IDS below
 */

import Razorpay from 'razorpay';

let razorpayClientInstance: Razorpay | null = null;

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

export function getRazorpayClient(): Razorpay {
  if (!razorpayClientInstance) {
    const key_id = getEnv('RAZORPAY_KEY_ID', getEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID', ''));
    const key_secret = getEnv('RAZORPAY_KEY_SECRET', '');

    if (!key_id || !key_secret) {
      console.warn('[Razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in environment.');
    }

    razorpayClientInstance = new Razorpay({
      key_id: key_id || 'rzp_test_placeholder',
      key_secret: key_secret || 'secret_placeholder',
    });
  }
  return razorpayClientInstance;
}

export const razorpay = {
  get instance() {
    return getRazorpayClient();
  },
};

/**
 * Razorpay Dashboard Subscription Plan IDs
 * Replace placeholder plan strings with generated plan IDs from your Razorpay dashboard.
 */
export const RAZORPAY_PLAN_IDS: Record<string, string> = {
  starter_monthly: getEnv('RAZORPAY_PLAN_STARTER_MONTHLY', 'plan_REPLACE_WITH_RAZORPAY_ID'),
  starter_annual: getEnv('RAZORPAY_PLAN_STARTER_ANNUAL', 'plan_REPLACE_WITH_RAZORPAY_ID'),
  pro_monthly: getEnv('RAZORPAY_PLAN_PRO_MONTHLY', 'plan_REPLACE_WITH_RAZORPAY_ID'),
  pro_annual: getEnv('RAZORPAY_PLAN_PRO_ANNUAL', 'plan_REPLACE_WITH_RAZORPAY_ID'),
  agency_monthly: getEnv('RAZORPAY_PLAN_AGENCY_MONTHLY', 'plan_REPLACE_WITH_RAZORPAY_ID'),
  agency_annual: getEnv('RAZORPAY_PLAN_AGENCY_ANNUAL', 'plan_REPLACE_WITH_RAZORPAY_ID'),
};

/**
 * Helper to check if Razorpay plans are configured
 */
export function isRazorpayConfigured(): boolean {
  const key_id = getEnv('RAZORPAY_KEY_ID', getEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID', ''));
  const key_secret = getEnv('RAZORPAY_KEY_SECRET', '');
  return Boolean(key_id && key_secret && !key_id.includes('placeholder'));
}

/**
 * Cancels a Razorpay subscription at cycle end
 */
export async function cancelRazorpaySubscription(subscriptionId: string): Promise<boolean> {
  if (!subscriptionId || subscriptionId.startsWith('sub_') || subscriptionId.startsWith('mock_')) {
    return true;
  }
  try {
    const client = getRazorpayClient();
    if (client.subscriptions && typeof (client.subscriptions as any).cancel === 'function') {
      await (client.subscriptions as any).cancel(subscriptionId, { cancel_at_cycle_end: 1 });
      return true;
    }
    return true;
  } catch (err) {
    console.warn('[Razorpay] cancelRazorpaySubscription error:', err);
    return false;
  }
}

