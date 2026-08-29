/**
 * CRON Job: Refresh Trending Niches
 * Runs daily at 6:00 AM UTC to refresh the 12 trending KDP niches in Firestore cache.
 * Protected by CRON_SECRET authorization header.
 */

import { generateTrendingNiches } from '../../niche/trending/route';

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

    const data = await generateTrendingNiches();

    return new Response(
      JSON.stringify({
        success: true,
        count: data.niches.length,
        updatedAt: data.updatedAt,
        nextUpdate: data.nextUpdate,
        executedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[CRON refresh-trending-niches] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal cron error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
