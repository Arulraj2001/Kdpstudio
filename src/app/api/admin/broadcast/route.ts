/**
 * API Route: GET /api/admin/broadcast & POST preview count
 * Returns broadcast history and audience estimation.
 */

import { adminAuth } from '../../../../lib/firebase-admin';
import { getBroadcastHistory, getBroadcastAudienceCount } from '../../../../lib/adminService';

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
    const history = await getBroadcastHistory();
    return new Response(JSON.stringify({ history }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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

  try {
    const { audience } = await request.json();
    const count = await getBroadcastAudienceCount(audience || { type: 'all' });
    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
