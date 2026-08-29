import { resolveBmacUnmatchedPayment, matchBmacTier } from '../../../../../lib/bmac';
import { getUserByEmail, getUserDocument, addCredits } from '../../../../../lib/userService';
import { activateUserPlan, createPaymentRecord } from '../../../../../lib/paymentService';

/**
 * Administrator Manual Match for BMaC Payment
 * Endpoint: POST /api/admin/bmac/match
 * 
 * Allows admin to associate an unmatched BMaC payment with a target user ID or email.
 */
export async function POST(request: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'arulraj8637@gmail.com';
    const requesterEmail = request.headers.get('x-user-email') || '';

    if (requesterEmail.toLowerCase() !== adminEmail.toLowerCase() && process.env.NODE_ENV === 'production') {
      return new Response(JSON.stringify({ error: 'Forbidden: Administrator credentials required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { unmatchedId, targetUid, targetEmail, amount, supportCoffees = 1 } = body;

    if (!unmatchedId || (!targetUid && !targetEmail)) {
      return new Response(
        JSON.stringify({ error: 'Missing unmatchedId or target user identifier' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Resolve user document
    let targetUser = targetUid ? await getUserDocument(targetUid) : null;
    if (!targetUser && targetEmail) {
      targetUser = await getUserByEmail(targetEmail);
    }

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: `Target user (${targetUid || targetEmail}) not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const paidAmount = Number(amount) || 6;
    const matchedTier = matchBmacTier(paidAmount);
    let rewardGrantedDesc = '';
    const nowIso = new Date().toISOString();

    if (matchedTier?.reward === 'credits') {
      const creditsToAdd = matchedTier.credits || (supportCoffees * 50);
      await addCredits(targetUser.uid, creditsToAdd);
      rewardGrantedDesc = `${creditsToAdd} Bonus Credits`;

      await createPaymentRecord({
        uid: targetUser.uid,
        email: targetUser.email,
        gateway: 'bmac',
        gatewayPaymentId: unmatchedId,
        gatewaySubscriptionId: null,
        gatewayCustomerId: null,
        plan: targetUser.plan || 'free',
        billingCycle: 'monthly',
        amount: paidAmount,
        currency: 'USD',
        status: 'completed',
        createdAt: nowIso,
        updatedAt: nowIso,
        planStartDate: nowIso,
        planEndDate: targetUser.planEndDate || null,
        metadata: {
          reward: 'credits',
          creditsGranted: creditsToAdd,
          matchedByAdmin: adminEmail,
        },
      });
    } else if (matchedTier?.reward === 'plan' && matchedTier.plan) {
      const planToSet = matchedTier.plan;
      const cycleToSet = matchedTier.billingCycle || 'monthly';

      await activateUserPlan(
        targetUser.uid,
        planToSet,
        cycleToSet,
        'bmac',
        unmatchedId
      );
      rewardGrantedDesc = `${planToSet.toUpperCase()} Plan (${cycleToSet})`;

      await createPaymentRecord({
        uid: targetUser.uid,
        email: targetUser.email,
        gateway: 'bmac',
        gatewayPaymentId: unmatchedId,
        gatewaySubscriptionId: null,
        gatewayCustomerId: null,
        plan: planToSet,
        billingCycle: cycleToSet,
        amount: paidAmount,
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
          matchedByAdmin: adminEmail,
        },
      });
    } else {
      const creditsToAdd = Math.max(10, Math.round(paidAmount * 10));
      await addCredits(targetUser.uid, creditsToAdd);
      rewardGrantedDesc = `${creditsToAdd} Bonus Credits`;
    }

    // Mark unmatched as resolved
    await resolveBmacUnmatchedPayment(unmatchedId, targetUser.uid, adminEmail, rewardGrantedDesc);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully matched payment ${unmatchedId} to ${targetUser.email}. Granted: ${rewardGrantedDesc}`,
        targetUid: targetUser.uid,
        rewardGranted: rewardGrantedDesc,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Admin BMaC Match] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to match BMaC payment' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
