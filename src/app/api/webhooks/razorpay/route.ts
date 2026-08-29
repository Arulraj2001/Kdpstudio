/**
 * Razorpay Webhooks Handler
 * 
 * Register this webhook URL in Razorpay Dashboard:
 * {NEXT_PUBLIC_APP_URL}/api/webhooks/razorpay
 * 
 * Select events:
 * - payment.captured
 * - subscription.charged
 * - subscription.cancelled
 * - subscription.halted
 * - payment.failed
 */

import { verifyRazorpayWebhook, getRawBody } from '../../../../lib/webhookSecurity';
import { 
  activateUserPlan, 
  createPaymentRecord, 
  updateSubscriptionRecord, 
  getUserActiveSubscription 
} from '../../../../lib/paymentService';
import { updateUserDocument, getUserDocument } from '../../../../lib/userService';
import { PlanName, BillingCycle } from '../../../../types/payment';
import { sendPaymentFailedEmail } from '../../../../lib/emailService';
import { APP_URL } from '../../../../lib/resend';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const rawBody = await getRawBody(request);
    const signature = request.headers.get('x-razorpay-signature') || '';

    // 1. Cryptographic signature check
    const isValid = verifyRazorpayWebhook(rawBody, signature);
    if (!isValid) {
      console.warn('[Razorpay Webhook] Invalid webhook signature. Rejecting.');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse payload
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = payload?.payment?.entity;
        console.log(`[Razorpay Webhook] Payment captured: ${paymentEntity?.id} - Amount: ₹${(paymentEntity?.amount || 0) / 100}`);
        break;
      }

      case 'subscription.charged': {
        const subEntity = payload?.subscription?.entity;
        const paymentEntity = payload?.payment?.entity;
        const subscriptionId = subEntity?.id;
        const notes = subEntity?.notes || paymentEntity?.notes || {};
        const uid = notes.uid;
        const plan = (notes.plan || 'pro') as PlanName;
        const billingCycle = (notes.billingCycle || 'monthly') as BillingCycle;
        const amountPaise = paymentEntity?.amount || (subEntity?.plan_id ? 149900 : 0);

        console.log(`[Razorpay Webhook] Subscription charged: ${subscriptionId} for user ${uid}`);

        if (uid) {
          // Authoritative Plan Activation / Renewal
          await activateUserPlan(
            uid,
            plan,
            billingCycle,
            'razorpay',
            paymentEntity?.id || subscriptionId
          );

          // Clear any paymentFailed flag
          await updateUserDocument(uid, {
            paymentFailed: false,
          });

          // Create payment record
          const now = new Date();
          const planEndDate = billingCycle === 'annual'
            ? new Date(now.getTime() + 365 * 86400000)
            : new Date(now.getTime() + 30 * 86400000);

          await createPaymentRecord({
            uid,
            email: paymentEntity?.email || notes.email || '',
            gateway: 'razorpay',
            gatewayPaymentId: paymentEntity?.id || `pay_${Date.now()}`,
            gatewaySubscriptionId: subscriptionId || null,
            gatewayCustomerId: subEntity?.customer_id || null,
            plan,
            billingCycle,
            amount: amountPaise,
            currency: 'INR',
            status: 'completed',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            planStartDate: now.toISOString(),
            planEndDate: planEndDate.toISOString(),
            metadata: {
              eventType: 'subscription.charged',
              rawEventId: event.id,
            },
          });
        }
        break;
      }

      case 'subscription.cancelled': {
        const subEntity = payload?.subscription?.entity;
        const subscriptionId = subEntity?.id;
        const notes = subEntity?.notes || {};
        const uid = notes.uid;

        console.log(`[Razorpay Webhook] Subscription cancelled: ${subscriptionId}, UID: ${uid}`);

        if (subscriptionId) {
          await updateSubscriptionRecord(subscriptionId, {
            status: 'cancelled',
            cancelAtPeriodEnd: true,
          });
        }

        if (uid) {
          const userDoc = await getUserDocument(uid);
          console.log(`[Razorpay Webhook] User ${uid} subscription cancelled. Plan remains active until ${userDoc?.planEndDate || 'period end'}.`);
        }
        break;
      }

      case 'subscription.halted': {
        const subEntity = payload?.subscription?.entity;
        const subscriptionId = subEntity?.id;
        const notes = subEntity?.notes || {};
        const uid = notes.uid;

        console.warn(`[Razorpay Webhook] Subscription halted due to payment failures: ${subscriptionId}, UID: ${uid}`);

        if (subscriptionId) {
          await updateSubscriptionRecord(subscriptionId, {
            status: 'past_due',
          });
        }

        if (uid) {
          await updateUserDocument(uid, {
            paymentFailed: true,
          });

          // Non-blocking payment failure email dispatch
          getUserDocument(uid).then((doc) => {
            if (doc?.email) {
              const email = doc.email;
              const name = doc.name || doc.displayName || email.split('@')[0];
              const plan = notes.plan || doc.plan || 'pro';
              sendPaymentFailedEmail({
                to: email,
                name,
                plan,
                amount: '₹1,499',
                gateway: 'Razorpay',
                retryUrl: APP_URL + '/settings/billing',
              }).catch(console.error);
            }
          }).catch(console.error);
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = payload?.payment?.entity;
        const notes = paymentEntity?.notes || {};
        const uid = notes.uid;
        console.warn(`[Razorpay Webhook] Payment failed: ${paymentEntity?.id} - Reason: ${paymentEntity?.error_description}`);

        if (uid) {
          await updateUserDocument(uid, {
            paymentFailed: true,
          });

          // Non-blocking payment failure email dispatch
          getUserDocument(uid).then((doc) => {
            if (doc?.email) {
              const email = doc.email;
              const name = doc.name || doc.displayName || email.split('@')[0];
              const plan = notes.plan || doc.plan || 'pro';
              const amtFormatted = paymentEntity?.amount ? `₹${paymentEntity.amount / 100}` : '₹1,499';
              sendPaymentFailedEmail({
                to: email,
                name,
                plan,
                amount: amtFormatted,
                gateway: 'Razorpay',
                retryUrl: APP_URL + '/settings/billing',
              }).catch(console.error);
            }
          }).catch(console.error);
        }
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Razorpay Webhook] Server error processing webhook:', error);
    // Return 200 to prevent Razorpay storming retries for unrecoverable server parsing issues
    return new Response(JSON.stringify({ error: error.message || 'Webhook internal error' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
