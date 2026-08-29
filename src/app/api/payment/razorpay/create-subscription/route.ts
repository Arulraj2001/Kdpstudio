/**
 * API Route: /api/payment/razorpay/create-subscription
 * Initializes Razorpay customer and generates subscription ID for checkout
 */

import { getRazorpayClient, RAZORPAY_PLAN_IDS, isRazorpayConfigured } from '../../../../../lib/razorpay';
import { adminAuth } from '../../../../../lib/firebase-admin';
import { getUserDocument, updateUserDocument } from '../../../../../lib/userService';
import { PlanName, BillingCycle } from '../../../../../types/payment';

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
        console.warn('[Razorpay create-sub] Token verify error:', authErr);
      }
    }

    const body = await request.json();
    const { plan, billingCycle } = body as { plan: PlanName; billingCycle: 'monthly' | 'annual' };

    if (!uid && body.uid) {
      uid = body.uid;
    }

    if (!uid) {
      return new Response(JSON.stringify({ error: 'Unauthorized: user token or id required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userDoc = await getUserDocument(uid);
    const email = userDoc?.email || body.email || 'customer@kdpstudio.app';
    const name = userDoc?.displayName || userDoc?.name || body.name || 'Author';

    const planKey = `${plan}_${billingCycle}`;
    const planId = RAZORPAY_PLAN_IDS[planKey];

    const rzpKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';

    // If Razorpay is not configured with real dashboard plan IDs, generate sandbox test subscription ID
    if (!isRazorpayConfigured() || !planId || planId.includes('REPLACE')) {
      console.log(`[Razorpay] Using test sandbox subscription ID for ${planKey}`);
      const mockSubId = `sub_test_${Math.random().toString(36).substring(2, 10)}`;
      return new Response(
        JSON.stringify({
          subscriptionId: mockSubId,
          razorpayKeyId: rzpKeyId,
          isSandbox: true,
          message: 'Running in developer test mode. Real plan IDs can be set in RAZORPAY_PLAN_IDS.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const razorpay = getRazorpayClient();

    // 1. Create or retrieve customer ID
    let customerId = userDoc?.paymentCustomerId;
    if (!customerId) {
      try {
        const customer = await razorpay.customers.create({
          name,
          email,
          notes: { uid, plan },
        });
        customerId = customer.id;
        await updateUserDocument(uid, { paymentCustomerId: customerId });
      } catch (custErr: any) {
        console.warn('[Razorpay] Customer creation note:', custErr?.message || custErr);
      }
    }

    // 2. Create Razorpay Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: billingCycle === 'annual' ? 12 : 120,
      notes: { uid, plan, billingCycle },
    });

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        razorpayKeyId: rzpKeyId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[Razorpay create-sub] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to create subscription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
