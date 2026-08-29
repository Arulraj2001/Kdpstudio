/**
 * API Route: POST /api/admin/support/reply
 * Replies to a contact/support ticket and updates its status.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { replySupportTicket } from '../../../../../lib/adminService';

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
    const { ticketId, replyText } = await request.json();
    if (!ticketId || !replyText?.trim()) {
      return new Response(
        JSON.stringify({ error: 'ticketId and replyText are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await replySupportTicket(ticketId, replyText, adminEmail);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/support/reply] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to reply to ticket' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
