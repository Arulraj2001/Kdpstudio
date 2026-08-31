/**
 * Webhook Security & Signature Verification Utilities
 * Guarantees cryptographic integrity for incoming payment gateway webhooks.
 */

import crypto from 'crypto';

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
