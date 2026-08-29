import { verifyBmacWebhook, getRawBody } from '../../../../lib/webhookSecurity';
import { matchBmacTier, saveBmacUnmatchedPayment } from '../../../../lib/bmac';
import { getUserByEmail, addCredits } from '../../../../lib/userService';
import { activateUserPlan, createPaymentRecord } from '../../../../lib/paymentService';
import { sendBmacReceivedEmail } from '../../../../lib/emailService';

/**
 * Buy Me a Coffee Webhook Route Handler
 * Endpoint: POST /api/webhooks/bmac
 * 
 * Always responds with 200 to prevent BMaC webhook drops,
 * and records unmatched supporter emails for admin matching.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await getRawBody(request);
    const signature = 
      request.headers.get('x-signature-sha256') || 
      request.headers.get('x-bmac-signature') ||
      request.headers.get('x-webhook-signature') ||
      '';

    const isValid = verifyBmacWebhook(rawBody, signature);
    if (!isValid && process.env.NODE_ENV === 'production') {
      console.warn('[BMaC Webhook] Signature verification failed');
      // Per specification, return 200 even on failures
      return new Response(JSON.stringify({ received: true, warning: 'Invalid signature' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ received: true, error: 'Invalid JSON' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = payload.data || payload.response || payload;
    const amountPaid = parseFloat(data.amount || data.total_amount || data.payment_amount || '0');
    const supportCoffees = parseInt(data.support_coffees || data.coffees || data.quantity || '0', 10) || Math.max(1, Math.floor(amountPaid / 6));
    const rawEmail = (data.supporter_email || data.email || data.payer_email || '').toLowerCase().trim();
    const supporterName = data.supporter_name || data.name || data.payer_name || 'Kindle Creator Supporter';
    const bmacPaymentId = data.support_id || data.order_id || data.payment_id || data.id || `bmac_${Date.now()}`;
    const supportNote = data.support_note || data.note || data.message || '';
    const isSubscription = Boolean(data.is_subscription || payload.type?.includes('subscription'));

    console.log(`[BMaC Webhook] Received payment: $${amountPaid} (${supportCoffees} coffees) from ${rawEmail}`);

    if (!rawEmail) {
      // Save to unmatched collection if no email present
      await saveBmacUnmatchedPayment({
        bmacPaymentId,
        amount: amountPaid,
        supportCoffees,
        supporterEmail: 'anonymous@buymeacoffee.com',
        supporterName,
        supportNote,
        isSubscription,
      });

      return new Response(JSON.stringify({ received: true, status: 'unmatched_no_email' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Match tier
    const matchedTier = matchBmacTier(amountPaid);

    // Look up user by email
    const userDoc = await getUserByEmail(rawEmail);

    if (!userDoc) {
      console.warn(`[BMaC Webhook] Supporter email ${rawEmail} not found in KDP Studio user base. Logging to /bmacUnmatched`);
      await saveBmacUnmatchedPayment({
        bmacPaymentId,
        amount: amountPaid,
        supportCoffees,
        supporterEmail: rawEmail,
        supporterName,
        supportNote,
        isSubscription,
      });

      return new Response(
        JSON.stringify({
          received: true,
          status: 'unmatched_saved',
          message: 'Supporter email saved to unmatched queue for admin resolution',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const nowIso = new Date().toISOString();

    // Process Reward for matched user
    if (matchedTier?.reward === 'credits') {
      const creditsToAdd = matchedTier.credits || (supportCoffees * 50);
      await addCredits(userDoc.uid, creditsToAdd);

      await createPaymentRecord({
        uid: userDoc.uid,
        email: userDoc.email,
        gateway: 'bmac',
        gatewayPaymentId: String(bmacPaymentId),
        gatewaySubscriptionId: null,
        gatewayCustomerId: null,
        plan: userDoc.plan || 'free',
        billingCycle: 'monthly',
        amount: amountPaid,
        currency: 'USD',
        status: 'completed',
        createdAt: nowIso,
        updatedAt: nowIso,
        planStartDate: nowIso,
        planEndDate: userDoc.planEndDate || null,
        metadata: {
          reward: 'credits',
          creditsGranted: creditsToAdd,
          supportCoffees,
          supporterName,
          supportNote,
        },
      });

      // Send BMaC received email
      sendBmacReceivedEmail({
        to: rawEmail,
        name: supporterName,
        amount: '$' + amountPaid,
        reward: matchedTier.description,
        credits: creditsToAdd,
      }).catch(console.error);

      console.log(`[BMaC Webhook] Granted ${creditsToAdd} credits to ${userDoc.uid}`);
    } else if (matchedTier?.reward === 'plan' && matchedTier.plan) {
      const planToSet = matchedTier.plan;
      const cycleToSet = matchedTier.billingCycle || 'monthly';

      await activateUserPlan(
        userDoc.uid,
        planToSet,
        cycleToSet,
        'bmac',
        String(bmacPaymentId)
      );

      await createPaymentRecord({
        uid: userDoc.uid,
        email: userDoc.email,
        gateway: 'bmac',
        gatewayPaymentId: String(bmacPaymentId),
        gatewaySubscriptionId: null,
        gatewayCustomerId: null,
        plan: planToSet,
        billingCycle: cycleToSet,
        amount: amountPaid,
        currency: 'USD',
        status: 'completed',
        createdAt: nowIso,
        updatedAt: nowIso,
        planStartDate: nowIso,
        planEndDate:
          cycleToSet === 'lifetime'
            ? null
            : new Date(Date.now() + (cycleToSet === 'annual' ? 365 : 30) * 86400000).toISOString(),
        metadata: {
          reward: 'plan',
          planGranted: planToSet,
          billingCycle: cycleToSet,
          supportCoffees,
          supporterName,
          supportNote,
        },
      });

      sendBmacReceivedEmail({
        to: rawEmail,
        name: supporterName,
        amount: '$' + amountPaid,
        reward: matchedTier.description,
        plan: planToSet,
      }).catch(console.error);

      console.log(`[BMaC Webhook] Activated ${planToSet} (${cycleToSet}) for ${userDoc.uid}`);
    } else {
      // Fallback for custom amounts below $6: grant proportional credits (10 credits per dollar)
      const bonusCredits = Math.max(10, Math.round(amountPaid * 10));
      await addCredits(userDoc.uid, bonusCredits);

      sendBmacReceivedEmail({
        to: rawEmail,
        name: supporterName,
        amount: '$' + amountPaid,
        reward: 'Bonus Credits',
        credits: bonusCredits,
      }).catch(console.error);

      console.log(`[BMaC Webhook] Custom amount $${amountPaid}: Granted ${bonusCredits} credits to ${userDoc.uid}`);
    }


    return new Response(
      JSON.stringify({
        received: true,
        status: 'success',
        uid: userDoc.uid,
        tier: matchedTier?.description || 'Bonus Credits',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[BMaC Webhook] Unhandled processing error:', error);
    // Always return 200 to BMaC
    return new Response(
      JSON.stringify({ received: true, status: 'error_caught', message: error.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
