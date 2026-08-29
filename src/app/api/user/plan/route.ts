/**
 * User Plan Status API Route
 * Allows client frontend to query and poll authoritative plan status,
 * expiration dates, payment gateway method, and active usage statistics.
 */

import { getUserDocument } from '../../../../lib/userService';
import { adminAuth } from '../../../../lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

    let uid = '';

    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (authErr) {
        console.warn('[API/user/plan] Token verification failed:', authErr);
      }
    }

    // Fallback: check query parameter or demo fallback
    if (!uid) {
      const url = new URL(request.url);
      uid = url.searchParams.get('uid') || '';
    }

    if (!uid) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token or uid' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userDoc = await getUserDocument(uid);
    if (!userDoc) {
      return new Response(JSON.stringify({
        plan: 'free',
        planEndDate: null,
        billingCycle: null,
        paymentMethod: null,
        usage: { daily: {}, monthly: {} }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      plan: userDoc.plan || 'free',
      planEndDate: userDoc.planEndDate || null,
      billingCycle: userDoc.billingCycle || null,
      paymentMethod: userDoc.paymentMethod || null,
      usage: userDoc.usage || { daily: {}, monthly: {} }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API/user/plan] Internal error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
