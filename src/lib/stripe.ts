/**
 * Server-side Stripe SDK Client & Subscription Helpers
 */

import Stripe from 'stripe';

let stripeClientInstance: Stripe | null = null;

const getEnv = (key: string, fallback = ''): string => {
  if (typeof process !== 'undefined' && process?.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export function isStripeConfigured(): boolean {
  const secret = getEnv('STRIPE_SECRET_KEY');
  return Boolean(secret && secret.trim().length > 0 && !secret.includes('placeholder'));
}

export function getStripeClient(): Stripe {
  if (!stripeClientInstance) {
    const secret = getEnv('STRIPE_SECRET_KEY');
    if (!secret) {
      console.warn('[Stripe] STRIPE_SECRET_KEY not set in environment.');
    }
    stripeClientInstance = new Stripe(secret || 'sk_test_placeholder', {
      apiVersion: '2026-08-26.dahlia' as any,
    });
  }
  return stripeClientInstance;
}

export const STRIPE_WEBHOOK_SECRET = getEnv('STRIPE_WEBHOOK_SECRET');

/**
 * Cancels a Stripe subscription at period end
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  reason = 'User requested cancellation'
): Promise<boolean> {
  if (!subscriptionId || !subscriptionId.startsWith('sub_')) {
    return true;
  }
  try {
    const stripe = getStripeClient();
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: { cancelReason: reason },
    });
    return true;
  } catch (err) {
    console.warn('[Stripe] cancelStripeSubscription error:', err);
    return false;
  }
}

/**
 * Creates a Stripe billing customer portal session
 */
export async function createStripeCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  if (!customerId || !customerId.startsWith('cus_')) return null;
  try {
    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return portalSession.url;
  } catch (err) {
    console.warn('[Stripe] createStripeCustomerPortalSession error:', err);
    return null;
  }
}