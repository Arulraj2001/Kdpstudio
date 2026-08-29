/**
 * API Route: POST /api/admin/broadcast/send
 * Queues and executes a broadcast email in batches of 100 with rate limiting.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { sendBroadcastEmail } from '../../../../../lib/adminService';

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

  try {
    const { subject, preheader, bodyMarkdown, audience, isTest } = await request.json();
    if (!subject?.trim() || !bodyMarkdown?.trim()) {
      return new Response(
        JSON.stringify({ error: 'subject and bodyMarkdown are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await sendBroadcastEmail({
      subject,
      preheader,
      bodyMarkdown,
      audience: audience || { type: 'all', excludeBanned: true, excludeUnsubscribed: true },
      adminEmail,
      isTest: Boolean(isTest),
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/broadcast/send] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to dispatch broadcast email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
