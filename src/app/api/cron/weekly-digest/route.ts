import { getAdminDb } from '../../../../lib/firebase-admin';
import { sendWeeklyDigestEmail } from '../../../../lib/emailService';
import { APP_URL } from '../../../../lib/resend';

export const WEEKLY_TIPS = [
  {
    title: 'Use long-tail keywords for better KDP ranking',
    body: "Instead of 'fitness book', try '30-day morning workout plan for busy moms'. Specific keywords have less competition and more buyer intent.",
    link: `${APP_URL}/kdp`,
  },
  {
    title: 'Coloring books are the fastest KDP niche',
    body: "Low-content coloring books can be created in hours and require no writing. Adult coloring is consistently one of KDP's top categories.",
    link: `${APP_URL}/studio`,
  },
  {
    title: 'Optimize your book description with HTML',
    body: 'KDP allows basic HTML in descriptions. Use <b>bold text</b> for key benefits and <br> for spacing. Our KDP Assistant does this automatically.',
    link: `${APP_URL}/kdp`,
  },
  {
    title: 'Price your book between $2.99 and $9.99',
    body: "This range qualifies for KDP's 70% royalty rate. At $4.99 you earn ~$3.44 per sale vs $1.74 at $1.99.",
    link: `${APP_URL}/kdp`,
  },
  {
    title: 'Series sell better than standalone books',
    body: 'Readers who buy book 1 of a series convert at 60%+ for book 2. Use our Series Manager to keep consistent branding across all books.',
    link: `${APP_URL}/books`,
  },
  {
    title: 'Update your keywords every 90 days',
    body: "Amazon's search trends shift. Keywords that worked 3 months ago may be saturated now. Refresh all 7 keywords quarterly.",
    link: `${APP_URL}/kdp`,
  },
  {
    title: 'Your cover is your #1 marketing tool',
    body: 'Readers decide in under 2 seconds. Thumbnail size matters most — test your cover at 80×120px to see if the title is still readable.',
    link: `${APP_URL}/cover`,
  },
];

/**
 * CRON Job: Weekly Digest Dispatcher
 * Runs every Monday at 8:00 AM UTC.
 * Computes weekly stats and rotates publishing tips for all subscribers.
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
        JSON.stringify({ message: 'Firestore Admin not initialized (offline/preview)', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Calculate Week Range (last Monday to last Sunday)
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday
    const daysSinceLastSunday = dayOfWeek === 0 ? 7 : dayOfWeek;
    const weekEnd = new Date(now.getTime() - daysSinceLastSunday * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);

    // 2. Select rotating tip based on week number
    const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
    const tip = WEEKLY_TIPS[weekNumber % WEEKLY_TIPS.length];

    // 3. Query all users
    const usersSnap = await adminDb.collection('users').get();
    let sentCount = 0;
    let errorCount = 0;

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      if (!user.email) continue;

      // Check email preferences (defaults to true)
      if (user.settings?.emailPreferences?.weeklyDigest === false) {
        continue;
      }

      const userName = user.name || user.displayName || user.email.split('@')[0];
      const booksCreated = Number(user.usage?.allTime?.booksCreated || 0);
      const aiGenerations = Number(user.usage?.monthly?.aiGenerations || 0);
      const pdfsExported = Number(user.usage?.monthly?.pdfExports || 0);

      try {
        sendWeeklyDigestEmail({
          to: user.email,
          name: userName,
          weekStart: weekStart.toLocaleDateString(),
          weekEnd: weekEnd.toLocaleDateString(),
          booksCreated,
          aiGenerations,
          pdfsExported,
          currentPlan: user.plan || 'free',
          tipTitle: tip.title,
          tipBody: tip.body,
          tipLink: tip.link,
        }).catch(console.error);

        sentCount++;
      } catch (err) {
        console.error(`[Weekly Digest] Error sending to ${user.email}:`, err);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        errors: errorCount,
        weekStart: weekStart.toLocaleDateString(),
        weekEnd: weekEnd.toLocaleDateString(),
        tipSelected: tip.title,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[CRON weekly-digest] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error processing weekly digest' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
