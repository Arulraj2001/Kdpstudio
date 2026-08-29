/**
 * API Route: /api/payment/paypal/success
 * Handles return redirect from PayPal after successful buyer authorization
 */

import { paypalRequest, getPlanFromPayPalPlanId, isPayPalConfigured } from '../../../../../lib/paypal';
import { activateUserPlan, createPaymentRecord, createSubscriptionRecord } from '../../../../../lib/paymentService';
import { getUserDocument } from '../../../../../lib/userService';
import { PlanName, BillingCycle } from '../../../../../types/payment';
import { PRICING_TABLE } from '../../../../../lib/geo';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subscriptionId = url.searchParams.get('subscription_id') || url.searchParams.get('subscriptionId') || '';
  const paramUid = url.searchParams.get('uid') || '';
  const paramPlan = url.searchParams.get('plan') as PlanName || 'pro';
  const paramCycle = url.searchParams.get('billingCycle') as BillingCycle || 'monthly';

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';

  try {
    if (!subscriptionId) {
      console.warn('[PayPal Success] Missing subscription_id query param');
      return Response.redirect(`${appUrl}/pricing?error=payment_failed`, 302);
    }

    let uid = paramUid;
    let plan: PlanName = paramPlan;
    let billingCycle: BillingCycle = paramCycle;
    let amountUsd = (PRICING_TABLE[plan as 'starter' | 'pro' | 'agency']?.USD || 19) * 100;

    let subDetails: any = null;
    let payerId: string | null = null;

    // If configured and not a mock test, fetch subscription details from PayPal
    if (isPayPalConfigured() && !subscriptionId.startsWith('I-MOCK_')) {
      subDetails = await paypalRequest('GET', `/v1/billing/subscriptions/${subscriptionId}`);

      if (!subDetails || (subDetails.status !== 'ACTIVE' && subDetails.status !== 'APPROVAL_PENDING')) {
        console.warn(`[PayPal Success] Unexpected subscription status: ${subDetails?.status}`);
      }

      if (subDetails?.custom_id) {
        uid = subDetails.custom_id;
      }

      payerId = subDetails?.subscriber?.payer_id || null;

      if (subDetails?.plan_id) {
        const detected = getPlanFromPayPalPlanId(subDetails.plan_id);
        if (detected) {
          plan = detected.plan;
          billingCycle = detected.billingCycle;
        }
      }
    }

    if (!uid) {
      console.error('[PayPal Success] Could not resolve user UID');
      return Response.redirect(`${appUrl}/pricing?error=user_not_found`, 302);
    }

    const userDoc = await getUserDocument(uid);
    const email = userDoc?.email || 'customer@kdpstudio.app';

    // Calculate amounts
    const baseUsd = PRICING_TABLE[plan as 'starter' | 'pro' | 'agency']?.USD || 19;
    const finalAmountUsd = billingCycle === 'annual' ? Math.round(baseUsd * 10) : baseUsd;
    amountUsd = finalAmountUsd * 100; // in cents

    const now = new Date();
    const planEndDate = billingCycle === 'annual'
      ? new Date(now.getTime() + 365 * 86400000)
      : new Date(now.getTime() + 30 * 86400000);

    // 1. Authoritatively activate user plan
    await activateUserPlan(uid, plan, billingCycle, 'paypal', subscriptionId);

    // 2. Create Payment Record
    await createPaymentRecord({
      uid,
      email,
      gateway: 'paypal',
      gatewayPaymentId: `pay_pp_${Date.now()}`,
      gatewaySubscriptionId: subscriptionId,
      gatewayCustomerId: payerId,
      plan,
      billingCycle,
      amount: amountUsd,
      currency: 'USD',
      status: 'completed',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      planStartDate: now.toISOString(),
      planEndDate: planEndDate.toISOString(),
      metadata: {
        subscriptionId,
        activatedVia: 'paypal_success_redirect',
      },
    });

    // 3. Create Subscription Record
    await createSubscriptionRecord({
      uid,
      gateway: 'paypal',
      gatewaySubscriptionId: subscriptionId,
      plan,
      billingCycle,
      status: 'active',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: planEndDate.toISOString(),
      cancelAtPeriodEnd: false,
      currency: 'USD',
      amount: amountUsd,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    console.log(`[PayPal Success] Successfully activated ${plan} plan for user ${uid}`);
    return Response.redirect(`${appUrl}/dashboard?payment=success&plan=${plan}`, 302);
  } catch (err: any) {
    console.error('[PayPal Success] Error handling return:', err);
    return Response.redirect(`${appUrl}/pricing?error=payment_failed`, 302);
  }
}
