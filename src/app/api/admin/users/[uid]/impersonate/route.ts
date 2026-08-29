/**
 * API Route: POST /api/admin/users/:uid/impersonate
 * Creates a Firebase custom token for the target user.
 * Admin only.
 */

import { adminAuth, getAdminAuth } from '../../../../../../lib/firebase-admin';

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

export async function POST(
  request: Request,
  context: { params: { uid: string } }
) {
  const adminEmail = await verifyAdmin(request);
  if (!adminEmail) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const uid = context.params.uid;
  if (!uid) {
    return new Response(JSON.stringify({ error: 'Missing uid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const auth = getAdminAuth();
    if (!auth) {
      return new Response(
        JSON.stringify({
          error: 'Impersonation requires full Firebase Admin credentials. Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in your environment.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create custom token with admin claim so the banner can detect it
    const customToken = await auth.createCustomToken(uid, {
      impersonatedBy: adminEmail,
    });

    // Log this action
    const { logAdminAction } = await import('../../../../../../lib/adminService');
    await logAdminAction({
      adminEmail,
      action: 'impersonate_user',
      targetUid: uid,
      details: { note: 'Custom token issued for impersonation' },
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ customToken }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/users/:uid/impersonate] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to create impersonation token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
