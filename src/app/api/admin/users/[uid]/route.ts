/**
 * API Routes: /api/admin/users/:uid
 * GET  → AdminUserDetail
 * PATCH → update plan, ban/unban, notes
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import {
  getUserDetails,
  adminUpdateUserPlan,
  banUser,
  unbanUser,
  deleteUserAccount,
  updateAdminNotes,
} from '../../../../../lib/adminService';

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

export async function GET(
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
    const detail = await getUserDetails(uid);
    if (!detail) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(detail), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PATCH(
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
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action } = body;

    if (action === 'update_plan') {
      const { plan, billingCycle, reason } = body;
      if (!plan || !billingCycle || !reason?.trim()) {
        return new Response(JSON.stringify({ error: 'plan, billingCycle, and reason are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      await adminUpdateUserPlan(uid, plan, billingCycle, adminEmail, reason);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'ban') {
      const { reason } = body;
      if (!reason?.trim()) {
        return new Response(JSON.stringify({ error: 'reason is required for ban' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      await banUser(uid, adminEmail, reason);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'unban') {
      await unbanUser(uid, adminEmail);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const { reason } = body;
      if (!reason?.trim()) {
        return new Response(JSON.stringify({ error: 'reason is required for delete' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      await deleteUserAccount(uid, adminEmail, reason);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_notes') {
      const { notes } = body;
      await updateAdminNotes(uid, notes || '', adminEmail);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[/api/admin/users/:uid PATCH] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Operation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
