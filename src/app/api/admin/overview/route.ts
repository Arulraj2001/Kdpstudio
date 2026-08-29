/**
 * API Route: GET /api/admin/overview
 * Returns AdminOverviewStats + activity feed.
 * Requires admin email authorization.
 */

import { adminAuth } from '../../../../lib/firebase-admin';
import { getAdminOverviewStats, getActivityFeed } from '../../../../lib/adminService';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

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
    const [stats, activity] = await Promise.all([
      getAdminOverviewStats(),
      getActivityFeed(20),
    ]);
    return new Response(JSON.stringify({ stats, activity }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/overview] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch overview' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
