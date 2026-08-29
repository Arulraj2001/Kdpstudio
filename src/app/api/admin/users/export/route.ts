/**
 * API Route: GET /api/admin/users/export
 * Returns a CSV download of all users.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { exportUsersCSV } from '../../../../../lib/adminService';

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
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const plan = url.searchParams.get('plan') || undefined;
    const csv = await exportUsersCSV({ planFilter: plan });
    const filename = `kdpstudio-users-${new Date().toISOString().split('T')[0]}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
