/**
 * API Route: /api/payment/paypal/create-subscription
 * Initializes PayPal subscription and returns the PayPal approval redirect URL
 */

import { paypalRequest, PAYPAL_PLAN_IDS, isPayPalConfigured } from '../../../../../lib/paypal';
import { adminAuth } from '../../../../../lib/firebase-admin';
import { getUserDocument } from '../../../../../lib/userService';
import { PlanName, BillingCycle, Currency } from '../../../../../types/payment';

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
        console.warn('[PayPal create-sub] Token verify error:', authErr);
      }
    }

    const body = await request.json();
    const { plan, billingCycle, currency = 'USD' } = body as {
      plan: PlanName;
      billingCycle: BillingCycle;
      currency?: Currency;
    };

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
    const fullName = userDoc?.displayName || userDoc?.name || body.name || 'Author User';
    const nameParts = fullName.trim().split(' ');
    const given_name = nameParts[0] || 'Author';
    const surname = nameParts.slice(1).join(' ') || 'User';

    const normalizedCurr = (currency || 'USD').toLowerCase();
    let planKey = `${plan}_${billingCycle}_${normalizedCurr}`;
    if (!PAYPAL_PLAN_IDS[planKey] || PAYPAL_PLAN_IDS[planKey].includes('REPLACE')) {
      planKey = `${plan}_${billingCycle}_usd`;
    }

    const planId = PAYPAL_PLAN_IDS[planKey];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';

    // If PayPal is unconfigured or in developer test mode, generate sandbox success URL
    if (!isPayPalConfigured() || !planId || planId.includes('REPLACE')) {
      console.log(`[PayPal] Using mock sandbox redirect URL for ${planKey}`);
      const mockSubId = `I-MOCK_PAYPAL_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const mockApprovalUrl = `/api/payment/paypal/success?subscription_id=${mockSubId}&token=MOCK_TOKEN&uid=${encodeURIComponent(uid)}&plan=${plan}&billingCycle=${billingCycle}`;

      return new Response(
        JSON.stringify({
          approvalUrl: mockApprovalUrl,
          subscriptionId: mockSubId,
          isSandbox: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const payload = {
      plan_id: planId,
      subscriber: {
        name: {
          given_name,
          surname,
        },
        email_address: email,
      },
      application_context: {
        brand_name: 'KDP Studio',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${appUrl}/api/payment/paypal/success`,
        cancel_url: `${appUrl}/pricing?cancelled=true`,
      },
      custom_id: uid,
    };

    const subResponse = await paypalRequest('POST', '/v1/billing/subscriptions', payload);
    const approveLink = subResponse.links?.find((l: any) => l.rel === 'approve')?.href;

    if (!approveLink) {
      throw new Error('PayPal did not return an approval link in the subscription response');
    }

    return new Response(
      JSON.stringify({
        approvalUrl: approveLink,
        subscriptionId: subResponse.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[PayPal create-sub] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to create PayPal subscription' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
