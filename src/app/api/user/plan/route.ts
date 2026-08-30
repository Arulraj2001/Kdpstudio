/**
 * User Plan Status API Route
 * Allows client frontend to query and poll authoritative plan status,
 * expiration dates, payment gateway method, and active usage statistics.
 */

import { getUserDocument } from '../../../../lib/userService';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

export async function GET(request: Request) {
  try {
    // 1. Get Authorization header
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: empty token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify token
    let uid = '';
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (authErr) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!uid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get user plan from Firestore / userService
    const userDoc = await getUserDocument(uid);
    if (!userDoc) {
      return new Response(
        JSON.stringify({
          plan: 'free',
          planEndDate: null,
          billingCycle: null,
          paymentMethod: null,
          usage: { daily: {}, monthly: {} }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        plan: userDoc.plan || 'free',
        planEndDate: userDoc.planEndDate || null,
        billingCycle: userDoc.billingCycle || null,
        paymentMethod: userDoc.paymentMethod || null,
        usage: userDoc.usage || { daily: {}, monthly: {} }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[API/user/plan] Internal error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
