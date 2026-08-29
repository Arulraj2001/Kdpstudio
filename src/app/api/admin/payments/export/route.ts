/**
 * API Route: GET /api/admin/payments/export
 * Exports filtered payments as CSV.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { exportPaymentsCSV } from '../../../../../lib/adminService';

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
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;
    const gateway = url.searchParams.get('gateway') || undefined;
    const plan = url.searchParams.get('plan') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const currency = url.searchParams.get('currency') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const csv = await exportPaymentsCSV({
      startDate,
      endDate,
      gateway,
      plan,
      status,
      currency,
      search,
    });

    const filename = `kdpstudio-payments-${new Date().toISOString().split('T')[0]}.csv`;
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
