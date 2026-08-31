/**
 * Client-safe Payment Gateway Configuration Helpers
 * Checks whether payment gateways are active and configured in the environment.
 */

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

/**
 * Checks if Stripe has valid client credentials configured
 */
export function isStripeConfigured(): boolean {
  const key = getEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', getEnv('VITE_STRIPE_PUBLISHABLE_KEY', ''));
  return Boolean(key && key.trim().length > 0 && !key.includes('placeholder'));
}

/**
 * Checks if UPI ID or QR Code is configured
 */
export function isUpiConfigured(): boolean {
  const upiId = getEnv('NEXT_PUBLIC_UPI_ID', getEnv('UPI_ID', getEnv('VITE_UPI_ID', '')));
  const qr = getEnv('NEXT_PUBLIC_UPI_QR_CODE_URL', getEnv('UPI_QR_CODE_URL', getEnv('VITE_UPI_QR_CODE_URL', '')));
  return Boolean((upiId && upiId.trim().length > 0) || (qr && qr.trim().length > 0));
}

export type PaymentTab = 'stripe' | 'upi' | 'bmac';

/**
 * Returns the payment tabs that should be shown for a given currency.
 * - Stripe is the global card/subscription processor and is shown only when its keys are configured.
 * - UPI is shown for INR (Indian) users.
 * - Buy Me a Coffee is the universal fallback and is always available.
 */
export function getAvailablePaymentTabs(currency: string): PaymentTab[] {
  const curr = (currency || 'USD').toUpperCase();
  const tabs: PaymentTab[] = [];
  if (isStripeConfigured()) tabs.push('stripe');
  if (curr === 'INR') tabs.push('upi');
  tabs.push('bmac');
  return tabs;
}
