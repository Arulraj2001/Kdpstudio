/**
 * API Route: /api/payment/upi/status
 * Returns current user's active pending UPI payment if one exists.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { getUserPendingUpiPayment } from '../../../../../lib/paymentService';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUid = url.searchParams.get('uid');
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    let uid = request.headers.get('x-user-id') || queryUid || '';

    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (authErr) {
        console.warn('[UPI status] Token verify error:', authErr);
      }
    }

    if (!uid) {
      return new Response(
        JSON.stringify({ pending: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pending = await getUserPendingUpiPayment(uid);

    return new Response(
      JSON.stringify({ pending }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[UPI status] Error:', error);
    return new Response(
      JSON.stringify({ pending: null, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
