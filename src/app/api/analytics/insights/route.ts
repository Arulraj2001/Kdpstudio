/**
 * KDP Studio — AI Publishing Performance Insights API
 * Phase 15A
 */

import { GoogleGenAI } from '@google/genai';
import { withUsageCheck, AuthenticatedUserContext } from '../../../../lib/withUsageCheck';
import { getUserDocument } from '../../../../lib/userService';
import { AIAnalyticsInsights } from '../../../../types/analytics';

export async function analyticsInsightsHandler(
  body: any,
  userContext?: { uid: string; email?: string }
) {
  const uid = userContext?.uid || body?.uid || 'demo-user-123';
  const userDoc = await getUserDocument(uid);
  const plan = userDoc?.plan || 'free';

  // Plan gating: AI insights are available on Pro and Agency plans
  if (plan !== 'pro' && plan !== 'agency' && plan !== 'lifetime') {
    return {
      error: 'AI Performance Insights are exclusive to Pro and Agency plans. Upgrade to unlock.',
      code: 'PLAN_REQUIRED',
      requiredPlan: 'pro',
      status: 403,
    };
  }

  const { summary, books = [], goals = [], streak = null } = body || {};

  if (!summary) {
    return { error: 'Missing analytics summary payload', status: 400 };
  }

  const systemPrompt = `You are a world-class Amazon KDP publishing performance analyst and royalties strategist.
You analyze self-publishing sales data, BSR ranks, page reads, and goals to provide concrete, high-impact tactical advice.

Rules:
1. Reference actual revenue, unit counts, BSR, and percentage changes provided.
2. Give 3-5 concrete, actionable steps to boost royalties, expand categories, or optimize pricing.
3. Identify the single biggest untapped revenue opportunity.
4. Flag any concerning sales dips, rank drops, or return rates.
5. Keep each insight concise (2-3 sentences max).
6. Be encouraging yet realistic. Never recommend black-hat or KDP policy-violating tactics.
7. Return strictly a single valid JSON object. Do not include markdown codeblocks or extra text.`;

  const booksListStr = books.length > 0
    ? books.slice(0, 10).map((b: any) =>
        `- "${b.title}": ${b.totalUnitsSold || 0} units sold, $${b.totalRoyalties || 0} royalties, BSR: ${b.averageBsr || 'Unranked'}, Status: ${b.status}`
      ).join('\n')
    : 'No published books recorded yet.';

  const goalsListStr = goals.length > 0
    ? goals.map((g: any) =>
        `- ${g.title}: ${g.currentValue}/${g.targetValue} ${g.unit} (${g.status})`
      ).join('\n')
    : 'No active goals set.';

  const userPrompt = `Analyze this KDP publisher's performance data:

Period: ${summary.periodLabel || 'Recent'}
Total Revenue: $${summary.totalRevenue || 0}
Total Royalties: $${summary.totalRoyalties || 0}
Total Units Sold: ${summary.totalUnitsSold || 0}
Total KENP Page Reads: ${summary.totalKenpPages || 0}
Top Marketplace: ${summary.topMarketplace || 'None'}
vs Last Period: Revenue ${summary.vsLastPeriod?.revenue || 0}%, Units ${summary.vsLastPeriod?.units || 0}%, Royalties ${summary.vsLastPeriod?.royalties || 0}%

Published Books:
${booksListStr}

Goals:
${goalsListStr}

Publishing Streak: ${streak?.currentStreak || 0} consecutive active days (Longest: ${streak?.longestStreak || 0} days)

Return JSON with exact structure:
{
  "overallHealth": "excellent" | "good" | "fair" | "needs-attention",
  "healthReason": "Clear 1-2 sentence executive assessment of their current performance trajectory",
  "biggestOpportunity": "The #1 high-impact action to unlock immediate additional royalty growth",
  "topInsights": [
    {
      "title": "Short insight title",
      "detail": "Detailed analysis referencing their metrics",
      "priority": "high" | "medium" | "low",
      "actionItem": "Specific action to implement on Amazon KDP dashboard or book studio"
    }
  ],
  "warningFlags": [
    "Any risks like category saturation, pricing misalignment, or sluggish velocity"
  ],
  "encouragement": "Inspiring closing message for the author"
}`;

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  let parsed: AIAnalyticsInsights;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `${systemPrompt}\n\n${userPrompt}`,
      });

      const text = response.text || '';
      const cleaned = text.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn('Gemini AI insights parsing fallback:', parseErr);
      parsed = getDefaultInsights(summary);
    }
  } else {
    parsed = getDefaultInsights(summary);
  }

  return { success: true, insights: parsed };
}

function getDefaultInsights(summary: any): AIAnalyticsInsights {
  return {
    overallHealth: summary?.totalRoyalties > 0 ? 'good' : 'fair',
    healthReason: `Catalog generated $${summary?.totalRoyalties || 0} across ${summary?.totalUnitsSold || 0} units in ${summary?.periodLabel || 'the current period'}.`,
    biggestOpportunity: 'Launch series sequels and optimize Amazon 7 backend keywords to capture long-tail organic search traffic.',
    topInsights: [
      {
        title: 'Optimize Backlist International Pricing',
        detail: 'Setting psychological price points in UK and European Amazon marketplaces boosts global conversion.',
        priority: 'high',
        actionItem: 'Update KDP dashboard pricing for amazon.co.uk and amazon.de to round numbers (e.g. £7.99 / €8.99).',
      },
      {
        title: 'Publish Complementary Low-Content Formats',
        detail: 'Pairing narrative books with matching guided journals or workbooks creates cross-sell opportunities.',
        priority: 'medium',
        actionItem: 'Use KDP Studio Bulk Generator to produce companion puzzle and journal volumes.',
      },
    ],
    warningFlags: [
      summary?.vsLastPeriod?.revenue < 0
        ? 'Revenue dropped vs previous period. Consider running a 5-day promotional discount.'
        : 'Maintain publishing cadence to ensure the Amazon ranking algorithm rewards author velocity.',
    ],
    encouragement: 'Every quality title in your catalog increases your recurring monthly royalty baseline. Keep publishing!',
  };
}

export const POST = withUsageCheck(
  'aiGenerations',
  async (req: Request, { user }: { user: AuthenticatedUserContext }) => {
    try {
      const body = await req.json();
      const result: any = await analyticsInsightsHandler(body, user);
      if (result.error && result.status) {
        return new Response(JSON.stringify(result), {
          status: result.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('Error in /api/analytics/insights:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message || 'Failed to generate AI insights' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
);
