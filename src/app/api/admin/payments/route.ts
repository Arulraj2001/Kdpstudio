/**
 * API Route: GET /api/admin/payments
 * Returns paginated, filtered payments history across all gateways.
 */

import { adminAuth } from '../../../../lib/firebase-admin';
import { getAllPayments } from '../../../../lib/adminService';

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
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const gateway = url.searchParams.get('gateway') || undefined;
    const plan = url.searchParams.get('plan') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const currency = url.searchParams.get('currency') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const result = await getAllPayments({
      limit,
      offset,
      startDate,
      endDate,
      gateway,
      plan,
      status,
      currency,
      search,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/payments] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch payments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
