/**
 * API Route: /api/payment/upi/submit
 * Handles manual UPI payment submissions and registers them in /upiPending for admin review.
 */

import { adminAuth } from '../../../../../lib/firebase-admin';
import { submitUpiPayment, checkUtrExists } from '../../../../../lib/paymentService';
import { PlanName, BillingCycle } from '../../../../../types/payment';
import { sendAdminUpiPendingEmail, sendUpiSubmittedEmail } from '../../../../../lib/emailService';
import { APP_URL } from '../../../../../lib/resend';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    let uid = request.headers.get('x-user-id') || '';

    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (authErr) {
        console.warn('[UPI submit] Token verify error:', authErr);
      }
    }

    const body = await request.json();
    const { 
      plan, 
      billingCycle = 'monthly', 
      amount, 
      utrNumber, 
      screenshotUrl = null,
      email,
      name
    } = body as {
      plan: PlanName;
      billingCycle: BillingCycle;
      amount: number;
      utrNumber: string;
      screenshotUrl?: string | null;
      email?: string;
      name?: string;
      uid?: string;
    };

    if (!uid && body.uid) {
      uid = body.uid;
    }

    if (!uid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: User identification required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate UTR format (alphanumeric, 12 to 22 characters)
    const cleanUtr = (utrNumber || '').trim().toUpperCase();
    const utrRegex = /^[A-Z0-9]{12,22}$/;
    if (!cleanUtr || !utrRegex.test(cleanUtr)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid UTR reference number. Must be 12-22 alphanumeric characters.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check duplicate UTR submissions
    const isDuplicate = await checkUtrExists(cleanUtr);
    if (isDuplicate) {
      return new Response(
        JSON.stringify({ 
          error: 'This UTR reference number has already been submitted for verification.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Submit UPI payment to Firestore / local pending store
    const userEmail = email || 'customer@kdpstudio.app';
    const userName = name || 'Kindle Author';

    const pendingId = await submitUpiPayment({
      uid,
      email: userEmail,
      name: userName,
      plan,
      billingCycle,
      amount: Number(amount) || 0,
      utrNumber: cleanUtr,
      screenshotUrl: screenshotUrl || null,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      notes: null,
    });

    // Send admin notification & user confirmation
    sendAdminUpiPendingEmail({
      userName,
      userEmail,
      plan,
      amount: '₹' + amount,
      utrNumber: cleanUtr,
      pendingId,
      adminUrl: APP_URL + '/admin',
    }).catch(console.error);

    sendUpiSubmittedEmail({
      to: userEmail,
      name: userName,
      plan,
      amount: '₹' + amount,
      utrNumber: cleanUtr,
      estimatedTime: '2-4 hours (business hours IST)',
    }).catch(console.error);


    return new Response(
      JSON.stringify({
        success: true,
        pendingId,
        message: 'UPI payment submitted successfully for verification.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[UPI submit] Internal Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error processing UPI submission' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
