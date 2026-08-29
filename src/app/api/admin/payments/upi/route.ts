/**
 * API Route: GET /api/admin/payments/upi
 * Returns pending UPI queue items, stats, and recently reviewed history.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { getPendingUpiPayments, getUpiRecentHistory } from '../../../../../lib/adminService';

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

export async function GET(request: Request) {
  const adminEmail = await verifyAdmin(request);
  if (!adminEmail) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const [pendingData, history] = await Promise.all([
      getPendingUpiPayments(),
      getUpiRecentHistory(10),
    ]);

    return new Response(
      JSON.stringify({
        stats: pendingData.stats,
        items: pendingData.items,
        history,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[/api/admin/payments/upi] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to fetch UPI queue' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
