/**
 * API Route: /api/admin/upi/reject
 * Administrator endpoint to reject a pending UPI payment with a specified reason & notes.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { rejectUpiPayment } from '../../../../../lib/paymentService';
import { db, isFirebaseConfigured } from '../../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { sendUpiRejectedEmail } from '../../../../../lib/emailService';
import { EMAIL_REPLY_TO } from '../../../../../lib/resend';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    let requesterEmail = request.headers.get('x-user-email') || '';

    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        requesterEmail = decoded.email || requesterEmail;
      } catch (authErr) {
        console.warn('[Admin UPI Reject] Token verify error:', authErr);
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';
    const body = await request.json();
    const emailToCheck = requesterEmail || body.adminEmail || '';

    // Verify Admin authorization
    if (emailToCheck.toLowerCase() !== adminEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Administrator credentials required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { pendingId, reason = 'Verification failed', notes = '' } = body as {
      pendingId: string;
      reason: string;
      notes: string;
    };

    if (!pendingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: pendingId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let userEmail = 'customer@kdpstudio.app';
    let userName = 'Kindle Author';
    let plan = 'pro';
    let amount = '1499';

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'upiPending', pendingId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          userEmail = data.email || userEmail;
          userName = data.name || userName;
          plan = data.plan || plan;
          amount = String(data.amount || amount);
        }
      } catch (err) {}
    }

    const fullReason = notes ? `${reason} (${notes})` : reason;
    await rejectUpiPayment(pendingId, fullReason, adminEmail);

    // Send rejection email to user
    sendUpiRejectedEmail({
      to: userEmail,
      name: userName,
      plan,
      amount: '₹' + amount,
      reason: fullReason,
      supportEmail: EMAIL_REPLY_TO,
    }).catch(console.error);


    return new Response(
      JSON.stringify({
        success: true,
        message: `UPI payment ${pendingId} rejected successfully`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Admin UPI Reject] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to reject UPI payment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
