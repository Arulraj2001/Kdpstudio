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
 * Checks if Razorpay has valid client credentials configured
 */
export function isRazorpayConfigured(): boolean {
  const key_id = getEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID', getEnv('RAZORPAY_KEY_ID', getEnv('VITE_RAZORPAY_KEY_ID', '')));
  return Boolean(key_id && key_id.trim().length > 0 && !key_id.includes('placeholder'));
}

/**
 * Checks if PayPal has valid client credentials configured
 */
export function isPayPalConfigured(): boolean {
  const clientId = getEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID', getEnv('PAYPAL_CLIENT_ID', getEnv('VITE_PAYPAL_CLIENT_ID', '')));
  return Boolean(clientId && clientId.trim().length > 0 && !clientId.includes('placeholder'));
}

/**
 * Checks if Buy Me a Coffee URL is configured
 */
export function isBmacConfigured(): boolean {
  const url = getEnv('NEXT_PUBLIC_BMAC_URL', getEnv('VITE_BMAC_URL', ''));
  return Boolean(url && url.trim().length > 0);
}

/**
 * Checks if UPI ID or QR Code is configured
 */
export function isUpiConfigured(): boolean {
  const upiId = getEnv('NEXT_PUBLIC_UPI_ID', getEnv('UPI_ID', getEnv('VITE_UPI_ID', '')));
  const qr = getEnv('NEXT_PUBLIC_UPI_QR_CODE_URL', getEnv('UPI_QR_CODE_URL', getEnv('VITE_UPI_QR_CODE_URL', '')));
  return Boolean((upiId && upiId.trim().length > 0) || (qr && qr.trim().length > 0));
}

export type PaymentTab = 'razorpay' | 'upi' | 'bmac' | 'paypal';

/**
 * Returns the payment tabs that should be shown for a given currency.
 * Mirrors the previous per-component logic: UPI and Buy Me a Coffee are always
 * available, while Razorpay / PayPal are shown only when configured.
 */
export function getAvailablePaymentTabs(currency: string): PaymentTab[] {
  const curr = (currency || 'USD').toUpperCase();
  if (curr === 'INR') {
    const tabs: PaymentTab[] = [];
    if (isRazorpayConfigured()) tabs.push('razorpay');
    tabs.push('upi');
    tabs.push('bmac');
    return tabs;
  }
  const tabs: PaymentTab[] = [];
  if (isPayPalConfigured()) tabs.push('paypal');
  tabs.push('bmac');
  return tabs;
}
