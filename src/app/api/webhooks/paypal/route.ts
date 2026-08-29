/**
 * PayPal Webhook Handler
 * 
 * Register PayPal webhook URL in developer.paypal.com:
 * URL: {NEXT_PUBLIC_APP_URL}/api/webhooks/paypal
 * 
 * Events to subscribe:
 * - BILLING.SUBSCRIPTION.ACTIVATED
 * - BILLING.SUBSCRIPTION.CANCELLED
 * - BILLING.SUBSCRIPTION.SUSPENDED
 * - PAYMENT.SALE.COMPLETED
 * - PAYMENT.SALE.DENIED
 */

import { verifyPayPalWebhook, getRawBody } from '../../../../lib/webhookSecurity';
import { 
  activateUserPlan, 
  createPaymentRecord, 
  updateSubscriptionRecord 
} from '../../../../lib/paymentService';
import { updateUserDocument, getUserDocument } from '../../../../lib/userService';
import { getPlanFromPayPalPlanId } from '../../../../lib/paypal';
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

    // 1. Verify PayPal webhook signature
    const isValid = await verifyPayPalWebhook(request.headers, rawBody);
    if (!isValid) {
      console.warn('[PayPal Webhook] Webhook signature verification failed. Rejecting.');
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse event payload
    const event = JSON.parse(rawBody);
    const eventType = event.event_type;
    const resource = event.resource || {};

    console.log(`[PayPal Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subscriptionId = resource.id;
        const uid = resource.custom_id;
        const planId = resource.plan_id;
        const detected = getPlanFromPayPalPlanId(planId);
        const plan: PlanName = detected?.plan || 'pro';
        const billingCycle: BillingCycle = detected?.billingCycle || 'monthly';

        console.log(`[PayPal Webhook] Subscription activated: ${subscriptionId} for user: ${uid}`);

        if (uid) {
          await activateUserPlan(uid, plan, billingCycle, 'paypal', subscriptionId);
          await updateUserDocument(uid, { paymentFailed: false });

          const now = new Date();
          const planEndDate = billingCycle === 'annual'
            ? new Date(now.getTime() + 365 * 86400000)
            : new Date(now.getTime() + 30 * 86400000);

          await createPaymentRecord({
            uid,
            email: resource.subscriber?.email_address || '',
            gateway: 'paypal',
            gatewayPaymentId: `pay_pp_${Date.now()}`,
            gatewaySubscriptionId: subscriptionId,
            gatewayCustomerId: resource.subscriber?.payer_id || null,
            plan,
            billingCycle,
            amount: (resource.billing_info?.last_payment?.amount?.value || 19) * 100,
            currency: resource.billing_info?.last_payment?.amount?.currency_code || 'USD',
            status: 'completed',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            planStartDate: now.toISOString(),
            planEndDate: planEndDate.toISOString(),
            metadata: { eventType, rawEventId: event.id },
          });
        }
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        const subscriptionId = resource.billing_agreement_id;
        const amountValue = Number(resource.amount?.total || 19) * 100;
        const currencyCode = resource.amount?.currency || 'USD';
        const uid = resource.custom || '';

        console.log(`[PayPal Webhook] Sale completed: ${resource.id} for subscription: ${subscriptionId}`);

        if (uid) {
          await activateUserPlan(uid, 'pro', 'monthly', 'paypal', subscriptionId);
          await updateUserDocument(uid, { paymentFailed: false });

          const now = new Date();
          const planEndDate = new Date(now.getTime() + 30 * 86400000);

          await createPaymentRecord({
            uid,
            email: '',
            gateway: 'paypal',
            gatewayPaymentId: resource.id || `sale_${Date.now()}`,
            gatewaySubscriptionId: subscriptionId || null,
            gatewayCustomerId: null,
            plan: 'pro',
            billingCycle: 'monthly',
            amount: amountValue,
            currency: currencyCode as any,
            status: 'completed',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            planStartDate: now.toISOString(),
            planEndDate: planEndDate.toISOString(),
            metadata: { eventType, rawEventId: event.id },
          });
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = resource.id;
        console.log(`[PayPal Webhook] Subscription cancelled: ${subscriptionId}`);

        if (subscriptionId) {
          await updateSubscriptionRecord(subscriptionId, {
            status: 'cancelled',
            cancelAtPeriodEnd: true,
          });
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const subscriptionId = resource.id;
        const uid = resource.custom_id;
        console.warn(`[PayPal Webhook] Subscription suspended: ${subscriptionId}, UID: ${uid}`);

        if (subscriptionId) {
          await updateSubscriptionRecord(subscriptionId, {
            status: 'past_due',
          });
        }
        if (uid) {
          await updateUserDocument(uid, { paymentFailed: true });

          getUserDocument(uid).then((doc) => {
            if (doc?.email) {
              const email = doc.email;
              const name = doc.name || doc.displayName || email.split('@')[0];
              const plan = doc.plan || 'pro';
              sendPaymentFailedEmail({
                to: email,
                name,
                plan,
                amount: '$19.00',
                gateway: 'PayPal',
                retryUrl: APP_URL + '/settings/billing',
              }).catch(console.error);
            }
          }).catch(console.error);
        }
        break;
      }

      case 'PAYMENT.SALE.DENIED': {
        const uid = resource.custom;
        console.warn(`[PayPal Webhook] Payment sale denied: ${resource.id}, UID: ${uid}`);
        if (uid) {
          await updateUserDocument(uid, { paymentFailed: true });

          getUserDocument(uid).then((doc) => {
            if (doc?.email) {
              const email = doc.email;
              const name = doc.name || doc.displayName || email.split('@')[0];
              const plan = doc.plan || 'pro';
              const amtFormatted = resource.amount?.total ? `$${resource.amount.total}` : '$19.00';
              sendPaymentFailedEmail({
                to: email,
                name,
                plan,
                amount: amtFormatted,
                gateway: 'PayPal',
                retryUrl: APP_URL + '/settings/billing',
              }).catch(console.error);
            }
          }).catch(console.error);
        }
        break;
      }

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[PayPal Webhook] Server error processing webhook:', error);
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
