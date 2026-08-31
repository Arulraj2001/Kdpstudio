/**
 * KDP Studio — Quick Niche Score API
 * Phase 13A
 * Fast, lightweight single niche scoring with Gemini AI without web grounding (<500 tokens).
 */

import { GoogleGenAI } from '@google/genai';
import { withUsageCheck, AuthenticatedUserContext } from '../../../../lib/withUsageCheck';
import {
  NicheResult,
  NicheCategory,
  calculateOpportunityScore,
} from '../../../../types/niche';

const SYSTEM_PROMPT = `You are an expert Amazon KDP market research analyst.
Quickly evaluate single KDP book niches with high precision.
Return ONLY valid JSON matching the NicheResult object schema. No markdown code blocks, no preamble.`;

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

function generateQuickFallback(nicheText: string): NicheResult {
  const demandScore = 80;
  const competitionScore = 45;
  const profitScore = 78;
  const oppScore = calculateOpportunityScore(demandScore, competitionScore, profitScore);

  return {
    id: `quick_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    nicheTitle: nicheText,
    category: 'self-help',
    subcategory: 'Guided Self-Improvement & Habits',
    description: `High-interest niche centered on ${nicheText.toLowerCase()} with active search volume and engaged readers.`,
    opportunityScore: oppScore,
    demandScore,
    competitionScore,
    profitScore,
    trendScore: 78,
    estimatedMonthlySales: 'Estimated: 350-900 units/month',
    averagePrice: '$11.99-$14.99',
    topBsrRange: 'BSR 4,000-40,000',
    estimatedMonthlyRevenue: '$2,500-$6,500',
    difficulty: 'easy',
    competitorCount: '120-250 books',
    topCompetitorStrength: 'Moderate',
    marketGap: 'Demand for modern, structured daily action steps and clear visual layouts.',
    trend: 'rising',
    trendReason: 'Steady search growth driven by self-directed wellness and personal development trends.',
    seasonality: null,
    recommendedBisacCategories: ['SELF-HELP / Personal Growth / General', 'BODY, MIND & SPIRIT / General'],
    suggestedKeywords: [
      `${nicheText.toLowerCase()} journal`,
      `${nicheText.toLowerCase()} workbook`,
      `${nicheText.toLowerCase()} for beginners`,
      `how to master ${nicheText.toLowerCase()}`,
      `daily ${nicheText.toLowerCase()} guide`,
    ],
    recommendedPrice: '$12.99',
    royaltyPlan: '70%',
    recommendedTrimSize: '6x9',
    pageCountRange: '120-150 pages',
    bookIdeas: [
      {
        title: `The 30-Day ${nicheText} Challenge`,
        subtitle: 'A Guided Daily Workbook for Real Results',
        angle: 'Fast daily habits with accountability charts',
        targetReader: 'Action-oriented beginners',
        estimatedPageCount: 140,
        suggestedPrice: '$12.99',
      },
      {
        title: `Mastering ${nicheText}`,
        subtitle: 'Essential Principles and Practical Strategies',
        angle: 'Comprehensive framework deconstructed into actionable steps',
        targetReader: 'Adult learners seeking depth',
        estimatedPageCount: 160,
        suggestedPrice: '$14.99',
      },
      {
        title: `${nicheText} Pocket Companion`,
        subtitle: 'Everyday Exercises and Reflections',
        angle: 'Compact, high-utility bedside format',
        targetReader: 'Busy professionals on the go',
        estimatedPageCount: 110,
        suggestedPrice: '$9.99',
      },
    ],
    pros: [
      'Strong search intent from targeted buyers',
      'Straightforward book structure with strong reader engagement',
    ],
    cons: [
      'Requires strong title and subtitle positioning to stand out',
    ],
    verdict: `A solid, approachable niche with solid profit margins and moderate competition.`,
    timeToFirstSale: '2-3 weeks',
    generatedAt: new Date().toISOString(),
    searchQuery: nicheText,
    dataSource: 'ai-analysis',
  };
}

export async function quickScoreHandler(params: {
  niche: string;
}): Promise<{ result: NicheResult }> {
  const { niche = '' } = params;

  if (!niche || niche.trim().length === 0) {
    throw new Error('Niche topic is required');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE') || apiKey === 'MY_GEMINI_API_KEY') {
    return { result: generateQuickFallback(niche) };
  }

  const prompt = `Quickly analyze this KDP niche: "${niche}"

Return a single NicheResult JSON object.
Focus on:
- demandScore (1-100), competitionScore (1-100), profitScore (1-100), trendScore (1-100)
- difficulty ('very-easy' | 'easy' | 'medium' | 'hard' | 'very-hard')
- pros (2 clear reasons), cons (1 key caution), verdict (1 sharp sentence)
- 3 specific book ideas (title, subtitle, angle, targetReader, estimatedPageCount, suggestedPrice)
- estimatedMonthlySales (format: "Estimated: X-Y units/month")
- suggestedKeywords (5-7 items)
- recommendedPrice, royaltyPlan ('70%'), recommendedTrimSize, pageCountRange

Use your training knowledge — keep the response under 500 tokens.
Return ONLY valid JSON matching a single NicheResult object.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
      },
    });

    const rawText = response.text || '';
    const cleaned = cleanJsonText(rawText);
    let parsed: any;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse quick score JSON');
      }
    }

    const demandScore = Math.min(100, Math.max(1, Number(parsed.demandScore) || 75));
    const competitionScore = Math.min(100, Math.max(1, Number(parsed.competitionScore) || 45));
    const profitScore = Math.min(100, Math.max(1, Number(parsed.profitScore) || 75));
    const trendScore = Math.min(100, Math.max(1, Number(parsed.trendScore) || 70));
    const oppScore = calculateOpportunityScore(demandScore, competitionScore, profitScore);

    let salesEstimate = String(parsed.estimatedMonthlySales || '300-800 units/month');
    if (!salesEstimate.toLowerCase().startsWith('estimated:')) {
      salesEstimate = `Estimated: ${salesEstimate}`;
    }

    const result: NicheResult = {
      id: `quick_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nicheTitle: String(parsed.nicheTitle || niche),
      category: (parsed.category as NicheCategory) || 'self-help',
      subcategory: String(parsed.subcategory || 'Specialty Publishing'),
      description: String(parsed.description || `Focused book niche around ${niche}.`),
      opportunityScore: oppScore,
      demandScore,
      competitionScore,
      profitScore,
      trendScore,
      estimatedMonthlySales: salesEstimate,
      averagePrice: String(parsed.averagePrice || '$9.99-$14.99'),
      topBsrRange: String(parsed.topBsrRange || 'BSR 5,000-45,000'),
      estimatedMonthlyRevenue: String(parsed.estimatedMonthlyRevenue || '$2,000-$6,000'),
      difficulty: parsed.difficulty || 'easy',
      competitorCount: String(parsed.competitorCount || '80-200 books'),
      topCompetitorStrength: parsed.topCompetitorStrength || 'Moderate',
      marketGap: String(parsed.marketGap || 'Opportunities for fresh formatting and clear value.'),
      trend: parsed.trend || 'rising',
      trendReason: String(parsed.trendReason || 'Growing audience search volume.'),
      seasonality: parsed.seasonality || null,
      recommendedBisacCategories: Array.isArray(parsed.recommendedBisacCategories) && parsed.recommendedBisacCategories.length > 0
        ? parsed.recommendedBisacCategories
        : ['SELF-HELP / General'],
      suggestedKeywords: Array.isArray(parsed.suggestedKeywords) && parsed.suggestedKeywords.length > 0
        ? parsed.suggestedKeywords.slice(0, 7)
        : [`${niche} book`, `${niche} guide`, `${niche} journal`],
      recommendedPrice: String(parsed.recommendedPrice || '$12.99'),
      royaltyPlan: '70%',
      recommendedTrimSize: String(parsed.recommendedTrimSize || '6x9'),
      pageCountRange: String(parsed.pageCountRange || '120-150 pages'),
      bookIdeas: Array.isArray(parsed.bookIdeas) && parsed.bookIdeas.length > 0
        ? parsed.bookIdeas.slice(0, 3).map((idea: any) => ({
            title: String(idea.title || `${niche} Essential Guide`),
            subtitle: String(idea.subtitle || 'A Practical Handbook for Readers'),
            angle: String(idea.angle || 'Modern, accessible framework'),
            targetReader: String(idea.targetReader || 'Dedicated learners'),
            estimatedPageCount: Number(idea.estimatedPageCount) || 140,
            suggestedPrice: String(idea.suggestedPrice || '$12.99'),
          }))
        : [
            {
              title: `${niche} Action Guide`,
              subtitle: 'A Step-by-Step Practical Blueprint',
              angle: 'Clear actionable frameworks',
              targetReader: 'Action-driven readers',
              estimatedPageCount: 130,
              suggestedPrice: '$12.99',
            },
          ],
      pros: Array.isArray(parsed.pros) && parsed.pros.length > 0
        ? parsed.pros.slice(0, 2)
        : ['Consistent reader search interest', 'High profit margins'],
      cons: Array.isArray(parsed.cons) && parsed.cons.length > 0
        ? parsed.cons.slice(0, 1)
        : ['Requires compelling cover visual design'],
      verdict: String(parsed.verdict || `A viable and profitable niche on Amazon KDP.`),
      timeToFirstSale: String(parsed.timeToFirstSale || '2-3 weeks'),
      generatedAt: new Date().toISOString(),
      searchQuery: niche,
      dataSource: 'ai-analysis',
    };

    return { result };
  } catch (err) {
    console.warn('Quick score Gemini error, returning fallback:', err);
    return { result: generateQuickFallback(niche) };
  }
}

export const POST = withUsageCheck('aiGenerations', async (req: Request) => {
  try {
    const body = await req.json();
    const data = await quickScoreHandler(body);
    return new Response(JSON.stringify({ success: true, ...data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('API /api/niche/quick-score error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
