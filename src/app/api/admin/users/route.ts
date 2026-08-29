/**
 * API Route: GET /api/admin/users
 * Returns paginated AdminUserView list.
 * Query params: limit, offset, search, plan, status, sortBy, sortOrder
 */

import { adminAuth } from '../../../../lib/firebase-admin';
import { getAllUsers } from '../../../../lib/adminService';

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
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const searchQuery = url.searchParams.get('search') || undefined;
    const planFilter = url.searchParams.get('plan') || undefined;
    const statusFilter = url.searchParams.get('status') || undefined;
    const countryFilter = url.searchParams.get('country') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const result = await getAllUsers({
      limit,
      offset,
      searchQuery,
      planFilter,
      statusFilter,
      countryFilter,
      sortBy,
      sortOrder,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/users] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
