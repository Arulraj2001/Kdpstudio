/**
 * API Route: GET /api/admin/support
 * Returns support tickets and aggregate ticket response statistics.
 */

import { adminAuth } from '../../../../lib/firebase-admin';
import { getSupportTickets, getSupportStats } from '../../../../lib/adminService';

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
    const status = url.searchParams.get('status') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const [tickets, stats] = await Promise.all([
      getSupportTickets(status, search),
      getSupportStats(),
    ]);

    return new Response(JSON.stringify({ tickets, stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/support] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to fetch support tickets' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
