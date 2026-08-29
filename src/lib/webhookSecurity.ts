/**
 * Webhook Security & Signature Verification Utilities
 * Guarantees cryptographic integrity for incoming payment gateway webhooks.
 */

import crypto from 'crypto';

/**
 * Verifies HMAC-SHA256 signature for Razorpay webhooks
 * @param body Raw request payload string
 * @param signature X-Razorpay-Signature header value
 * @returns boolean True if signature is cryptographically valid
 */
export function verifyRazorpayWebhook(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[WebhookSecurity] RAZORPAY_WEBHOOK_SECRET is not configured in environment.');
    return process.env.NODE_ENV !== 'production';
  }

  if (!signature || !body) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (err) {
    console.error('[WebhookSecurity] Razorpay signature verification error:', err);
    return false;
  }
}

/**
 * Verifies PayPal webhook signature via PayPal's verify-webhook-signature API
 * @param headers Request headers object or Web Headers
 * @param body Raw request payload string
 * @param webhookId Configured PayPal webhook ID
 * @returns Promise<boolean> True if verified by PayPal API
 */
export async function verifyPayPalWebhook(
  headers: Headers | Record<string, string | string[] | undefined>,
  body: string,
  webhookId?: string
): Promise<boolean> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const configuredWebhookId = webhookId || process.env.PAYPAL_WEBHOOK_ID;
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  if (!clientId || !secret || !configuredWebhookId) {
    console.warn('[WebhookSecurity] PayPal credentials or PAYPAL_WEBHOOK_ID missing.');
    return process.env.NODE_ENV !== 'production';
  }

  try {
    const baseUrl = mode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // 1. Get OAuth Access Token
    const authString = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      console.error('[WebhookSecurity] Failed to get PayPal OAuth token for verification');
      return false;
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Helper to get header
    const getHeader = (name: string): string => {
      if (typeof (headers as any).get === 'function') {
        return (headers as Headers).get(name) || '';
      }
      const val = (headers as Record<string, any>)[name.toLowerCase()] || (headers as Record<string, any>)[name];
      return Array.isArray(val) ? val[0] : (val || '');
    };

    // 2. Call verify-webhook-signature
    const parsedEvent = JSON.parse(body);
    const verifyPayload = {
      auth_algo: getHeader('paypal-auth-algo'),
      cert_url: getHeader('paypal-cert-url'),
      transmission_id: getHeader('paypal-transmission-id'),
      transmission_sig: getHeader('paypal-transmission-sig'),
      transmission_time: getHeader('paypal-transmission-time'),
      webhook_id: configuredWebhookId,
      webhook_event: parsedEvent,
    };

    const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyPayload),
    });

    if (!verifyRes.ok) {
      return false;
    }

    const verifyResult = await verifyRes.json();
    return verifyResult.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('[WebhookSecurity] PayPal verification exception:', err);
    return false;
  }
}

/**
 * Verifies Buy Me a Coffee webhook HMAC-SHA256 signature
 * @param body Raw request payload
 * @param signature Signature header
 * @returns boolean True if signature matches
 */
export function verifyBmacWebhook(body: string, signature: string): boolean {
  const secret = process.env.BMAC_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[WebhookSecurity] BMAC_WEBHOOK_SECRET is not configured in environment.');
    return process.env.NODE_ENV !== 'production';
  }

  if (!signature || !body) return false;

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch (err) {
    console.error('[WebhookSecurity] BMAC signature verification error:', err);
    return false;
  }
}

/**
 * Extracts raw string body from incoming request for signature checking
 * @param request Fetch Request or Node incoming request
 * @returns Promise<string> Raw request text
 */
export async function getRawBody(request: Request | any): Promise<string> {
  if (typeof request.text === 'function') {
    return request.text();
  }

  if (typeof request.body === 'string') {
    return request.body;
  }

  if (Buffer.isBuffer(request.body)) {
    return request.body.toString('utf8');
  }

  if (request.rawBody) {
    return typeof request.rawBody === 'string'
      ? request.rawBody
      : request.rawBody.toString('utf8');
  }

  // Node stream readable
  if (typeof request.on === 'function') {
    return new Promise((resolve, reject) => {
      let data = '';
      request.on('data', (chunk: any) => {
        data += chunk;
      });
      request.on('end', () => resolve(data));
      request.on('error', (err: any) => reject(err));
    });
  }

  if (typeof request.body === 'object') {
    return JSON.stringify(request.body);
  }

  return '';
}
