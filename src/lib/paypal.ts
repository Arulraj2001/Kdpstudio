/**
 * Server-side PayPal API Client & Subscription Plan IDs
 * 
 * HOW TO CREATE PAYPAL PLANS:
 * 1. Go to developer.paypal.com → My Apps → Your App → Subscriptions → Plans
 * 2. First create a Product:
 *    Name: KDP Studio, Type: SERVICE, Category: SOFTWARE
 * 3. Then create Plans linked to that product
 * 4. Set billing cycle: MONTH or YEAR
 * 5. Set amount in the correct currency
 * 6. Copy the Plan ID (starts with 'P-')
 * 7. Replace placeholder values in PAYPAL_PLAN_IDS below
 * 8. Create separate plans per currency (USD, GBP, EUR)
 */

import { PlanName, BillingCycle, Currency } from '../types/payment';

let cachedAccessToken: string | null = null;
let tokenExpiryTimestamp: number = 0;

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
 * Returns sandbox or live PayPal Base URL based on PAYPAL_MODE
 */
export function getPayPalBaseUrl(): string {
  const mode = getEnv('PAYPAL_MODE', 'sandbox');
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

/**
 * Retrieves an OAuth 2.0 access token from PayPal, caching it for 8 hours
 */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiryTimestamp) {
    return cachedAccessToken;
  }

  const clientId = getEnv('PAYPAL_CLIENT_ID', getEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID', ''));
  const clientSecret = getEnv('PAYPAL_CLIENT_SECRET', '');

  if (!clientId || !clientSecret) {
    console.warn('[PayPal] PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not configured.');
    return 'mock_paypal_token';
  }

  try {
    const baseUrl = getPayPalBaseUrl();
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`PayPal OAuth failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    cachedAccessToken = data.access_token;
    // Cache for 8 hours (token is usually valid for 9 hours = 32400s)
    const expiresInMs = (data.expires_in ? Number(data.expires_in) - 3600 : 28800) * 1000;
    tokenExpiryTimestamp = now + Math.max(expiresInMs, 60000);

    return cachedAccessToken as string;
  } catch (err: any) {
    console.error('[PayPal] Failed to obtain access token:', err);
    throw err;
  }
}

/**
 * Makes an authenticated request to PayPal's REST API with auto token refresh
 */
export async function paypalRequest<T = any>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const baseUrl = getPayPalBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  let token = await getPayPalAccessToken();

  const makeReq = async (authToken: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    return fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let response = await makeReq(token);

  // If unauthorized, clear cache and retry once
  if (response.status === 401) {
    cachedAccessToken = null;
    token = await getPayPalAccessToken();
    response = await makeReq(token);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(errorBody);
    } catch {
      parsed = { message: errorBody };
    }
    const msg = parsed.message || parsed.error_description || parsed.name || `PayPal request failed with status ${response.status}`;
    throw new Error(msg);
  }

  return response.json();
}

/**
 * PayPal Subscription Plan IDs
 */
export const PAYPAL_PLAN_IDS: Record<string, string> = {
  starter_monthly_usd: getEnv('PAYPAL_PLAN_STARTER_MONTHLY_USD', 'P-REPLACE_WITH_PAYPAL_PLAN_ID'),
  starter_annual_usd: getEnv('PAYPAL_PLAN_STARTER_ANNUAL_USD', 'P-REPLACE_WITH_PAYPAL_PLAN_ID'),
  pro_monthly_usd: getEnv('PAYPAL_PLAN_PRO_MONTHLY_USD', 'P-REPLACE_WITH_PAYPAL_PLAN_ID'),
  pro_annual_usd: getEnv('PAYPAL_PLAN_PRO_ANNUAL_USD', 'P-REPLACE_WITH_PAYPAL_PLAN_ID'),
  agency_monthly_usd: getEnv('PAYPAL_PLAN_AGENCY_MONTHLY_USD', 'P-REPLACE_WITH_PAYPAL_PLAN_ID'),
  agency_annual_usd: getEnv('PAYPAL_PLAN_AGENCY_ANNUAL_USD', 'P-REPLACE_WITH_PAYPAL_PLAN_ID'),
  pro_monthly_gbp: getEnv('PAYPAL_PLAN_PRO_MONTHLY_GBP', 'P-REPLACE_WITH_PAYPAL_PLAN_ID'),
  pro_monthly_eur: getEnv('PAYPAL_PLAN_PRO_MONTHLY_EUR', 'P-REPLACE_WITH_PAYPAL_PLAN_ID'),
};

/**
 * Checks if PayPal is configured with real plan IDs
 */
export function isPayPalConfigured(): boolean {
  const clientId = getEnv('PAYPAL_CLIENT_ID', getEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID', ''));
  const clientSecret = getEnv('PAYPAL_CLIENT_SECRET', '');
  return Boolean(clientId && clientSecret && !clientId.includes('placeholder'));
}

/**
 * Reverse lookup to deduce plan name and cycle from planId
 */
export function getPlanFromPayPalPlanId(planId: string): { plan: PlanName; billingCycle: BillingCycle } | null {
  for (const [key, id] of Object.entries(PAYPAL_PLAN_IDS)) {
    if (id === planId) {
      const parts = key.split('_');
      return {
        plan: (parts[0] || 'pro') as PlanName,
        billingCycle: (parts[1] || 'monthly') as BillingCycle,
      };
    }
  }
  return null;
}

/**
 * Cancels an active PayPal subscription at the provider level
 */
export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason: string = 'User requested cancellation'
): Promise<boolean> {
  if (!subscriptionId || subscriptionId.startsWith('sub_') || subscriptionId.startsWith('mock_')) {
    return true;
  }
  try {
    const baseUrl = getPayPalBaseUrl();
    const token = await getPayPalAccessToken();
    const res = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    return res.status === 204 || res.ok;
  } catch (err) {
    console.warn('[PayPal] cancelPayPalSubscription error:', err);
    return false;
  }
}
