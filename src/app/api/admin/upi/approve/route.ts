/**
 * API Route: /api/admin/upi/approve
 * Administrator endpoint to verify & approve a pending UPI payment, activating user's plan.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { approveUpiPayment } from '../../../../../lib/paymentService';
import { db, isFirebaseConfigured } from '../../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { sendUpiApprovedEmail } from '../../../../../lib/emailService';

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
        console.warn('[Admin UPI Approve] Token verify error:', authErr);
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

    const { pendingId } = body as { pendingId: string };
    if (!pendingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: pendingId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify status is still 'pending' to prevent double approvals
    let userEmail = 'customer@kdpstudio.app';
    let userName = 'Kindle Author';
    let plan = 'pro';
    let amount = '1499';
    let billingCycle = 'monthly';

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'upiPending', pendingId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.status !== 'pending') {
            return new Response(
              JSON.stringify({ error: `Payment is already ${data.status}` }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
          userEmail = data.email || userEmail;
          userName = data.name || userName;
          plan = data.plan || plan;
          amount = String(data.amount || amount);
          billingCycle = data.billingCycle || billingCycle;
        }
      } catch (err) {
        console.warn('[Admin UPI Approve] Firestore check error:', err);
      }
    }

    // Execute plan activation, status update, and payment record creation
    await approveUpiPayment(pendingId, adminEmail);

    const planEndDate = billingCycle === 'lifetime'
      ? null
      : new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 86400000);

    // Send confirmation email to user
    sendUpiApprovedEmail({
      to: userEmail,
      name: userName,
      plan,
      amount: '₹' + amount,
      activeUntil: planEndDate?.toLocaleDateString() || null,
    }).catch(console.error);


    return new Response(
      JSON.stringify({
        success: true,
        message: `UPI payment ${pendingId} approved successfully`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Admin UPI Approve] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to approve UPI payment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
