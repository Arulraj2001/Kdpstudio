/**
 * API Route: GET /api/admin/revenue
 * Returns RevenueSummary and DailyRevenue history for charts.
 */

import { adminAuth } from '../../../../lib/firebase-admin';
import { getRevenueSummary, getDailyRevenue } from '../../../../lib/adminService';

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
    const period = (url.searchParams.get('period') || 'month') as 'today' | 'week' | 'month' | 'year' | 'all';
    const days = parseInt(url.searchParams.get('days') || '90', 10);

    const [summary, dailyRevenue] = await Promise.all([
      getRevenueSummary(period),
      getDailyRevenue(days),
    ]);

    return new Response(JSON.stringify({ summary, dailyRevenue }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/revenue] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch revenue analytics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
