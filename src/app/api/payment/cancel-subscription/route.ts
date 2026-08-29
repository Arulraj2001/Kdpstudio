import { cancelPayPalSubscription } from '../../../../lib/paypal';
import { cancelRazorpaySubscription } from '../../../../lib/razorpay';
import { getUserActiveSubscription, updateSubscriptionRecord } from '../../../../lib/paymentService';
import { getUserDocument, updateUserDocument } from '../../../../lib/userService';
import { sendPlanCancelledEmail } from '../../../../lib/emailService';

/**
 * Cancel Subscription API Route
 * Cancels recurring billing at the provider and flags user profile
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const userIdHeader = req.headers.get('x-user-id') || '';
    const body = await req.json().catch(() => ({}));
    const { uid: bodyUid, reason = 'User requested cancellation', notes = '' } = body;

    const uid = bodyUid || userIdHeader;
    if (!uid) {
      return new Response(JSON.stringify({ error: 'Unauthorized: User identifier required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userDoc = await getUserDocument(uid);
    if (!userDoc) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch active subscription
    const activeSub = await getUserActiveSubscription(uid);

    // 2. Cancel on gateway if recurring provider exists
    if (activeSub) {
      if (activeSub.gateway === 'razorpay' && activeSub.gatewaySubscriptionId) {
        await cancelRazorpaySubscription(activeSub.gatewaySubscriptionId);
      } else if (activeSub.gateway === 'paypal' && activeSub.gatewaySubscriptionId) {
        await cancelPayPalSubscription(activeSub.gatewaySubscriptionId, reason);
      }

      // 3. Mark subscription cancelled in Firestore
      await updateSubscriptionRecord(activeSub.id, {
        status: 'cancelled',
        cancelAtPeriodEnd: true,
      });
    }

    // 4. Update user profile - keep plan until planEndDate
    const planEndDate = userDoc.planEndDate || new Date(Date.now() + 30 * 86400000).toISOString();
    await updateUserDocument(uid, {
      subscriptionCancelled: true,
      subscriptionCancelReason: reason,
      subscriptionCancelNotes: notes,
    });

    // 5. Send cancellation email
    const userEmail = userDoc.email || 'customer@kdpstudio.app';
    const userName = userDoc.name || userDoc.displayName || userEmail.split('@')[0];
    const plan = userDoc.plan || 'pro';
    const endFormatted = userDoc.planEndDate ? new Date(userDoc.planEndDate).toLocaleDateString() : new Date(Date.now() + 30 * 86400000).toLocaleDateString();

    sendPlanCancelledEmail({
      to: userEmail,
      name: userName,
      plan: plan,
      activeUntil: endFormatted,
    }).catch(console.error);


    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription cancelled successfully',
        activeUntil: planEndDate,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[API cancel-subscription] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
