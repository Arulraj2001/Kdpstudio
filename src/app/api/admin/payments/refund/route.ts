/**
 * API Route: POST /api/admin/payments/refund
 * Admin endpoint to process refunds across Razorpay, PayPal, or manual UPI/BMaC.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { processRefund } from '../../../../../lib/adminService';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';

async function verifyAdmin(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email || '';
    if (!ADMIN_EMAIL || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return email;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const adminEmail = await verifyAdmin(request);
  if (!adminEmail) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { paymentId, amount, reason, notes } = body;
  if (!paymentId || !reason?.trim()) {
    return new Response(
      JSON.stringify({ error: 'paymentId and reason are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await processRefund({
      paymentId,
      amount: amount !== undefined ? Number(amount) : undefined,
      reason,
      notes,
      adminEmail,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/payments/refund] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Refund processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
