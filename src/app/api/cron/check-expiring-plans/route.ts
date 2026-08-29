import { getAdminDb } from '../../../../lib/firebase-admin';
import { sendPlanExpiringSoonEmail } from '../../../../lib/emailService';
import { APP_URL } from '../../../../lib/resend';

/**
 * CRON Job: Check Expiring Plans
 * Runs daily at 9:00 AM UTC to notify users whose plans will expire in 3 days.
 * Protected by CRON_SECRET authorization header.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid CRON_SECRET' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return new Response(
        JSON.stringify({ message: 'Firestore Admin not initialized (offline/preview)', checked: 0, warned: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];

    const usersSnap = await adminDb.collection('users').get();
    let checkedCount = 0;
    let warnedCount = 0;

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      if (!user.email || !user.plan || user.plan === 'free') continue;
      if (user.subscriptionCancelled === true) continue;

      if (user.planEndDate) {
        checkedCount++;
        const endDate = new Date(user.planEndDate);
        const msUntilExpiry = endDate.getTime() - now.getTime();
        const daysUntilExpiry = Math.ceil(msUntilExpiry / (24 * 60 * 60 * 1000));

        // Check if plan expires within 3 days and is in the future
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 3) {
          // Check if we sent warning in the last 7 days
          let alreadyWarnedRecently = false;
          if (user.lastExpiryWarningDate) {
            const lastWarned = new Date(user.lastExpiryWarningDate);
            const daysSinceWarn = Math.floor((now.getTime() - lastWarned.getTime()) / (24 * 60 * 60 * 1000));
            if (daysSinceWarn < 7) {
              alreadyWarnedRecently = true;
            }
          }

          if (!alreadyWarnedRecently) {
            warnedCount++;
            const userName = user.name || user.displayName || user.email.split('@')[0];

            sendPlanExpiringSoonEmail({
              to: user.email,
              name: userName,
              plan: user.plan,
              expiresOn: endDate.toLocaleDateString(),
              daysLeft: daysUntilExpiry,
              renewUrl: `${APP_URL}/pricing`,
            }).catch(console.error);

            await doc.ref.update({
              lastExpiryWarningDate: todayStr,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: checkedCount,
        warned: warnedCount,
        executedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[CRON check-expiring-plans] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal cron error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
