/**
 * KDP Studio — Trending Niches API
 * Phase 13A
 * Public GET handler returning 12 cached trending KDP niches with 24-hour TTL.
 */

import { GoogleGenAI } from '@google/genai';
import { getAdminDb } from '../../../../lib/firebase-admin';
import { db, isFirebaseConfigured } from '../../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  TrendingNichePreview,
  TrendingNichesCache,
  NicheCategory,
} from '../../../../types/niche';

const CACHE_DOC_ID = 'trendingNiches';
const CACHE_COLLECTION = 'cache';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// In-memory fallback cache for server runtime / preview
let inMemoryTrendingCache: TrendingNichesCache | null = null;

const DEFAULT_TRENDING_NICHES: TrendingNichePreview[] = [
  {
    title: 'Somatic Nervous System Reset Journals',
    category: 'health-wellness',
    trendDirection: 'rising',
    opportunityScore: 92,
    oneLineReason: 'Viral TikTok & wellness interest with low competition in structured guided formats.',
    badgeText: '🔥 Hot',
  },
  {
    title: 'Cognitive Decline Prevention Puzzles for Seniors',
    category: 'puzzle-books',
    trendDirection: 'rising',
    opportunityScore: 89,
    oneLineReason: 'Aging demographic surge seeking large-print mental acuity exercise books.',
    badgeText: '📈 Rising',
  },
  {
    title: 'High-Protein Mediterranean Meal Planners',
    category: 'cookbooks',
    trendDirection: 'rising',
    opportunityScore: 87,
    oneLineReason: 'Sustained fitness and metabolic health interest paired with daily shopping checklists.',
    badgeText: '🔥 Hot',
  },
  {
    title: 'Homeschool Nature Science Exploration Logs',
    category: 'children',
    trendDirection: 'rising',
    opportunityScore: 85,
    oneLineReason: 'Booming outdoor homeschooling movement with heavy demand for printable/bound logs.',
    badgeText: '⭐ New',
  },
  {
    title: 'ADHD Dopamine Menu & Workday Architect',
    category: 'self-help',
    trendDirection: 'rising',
    opportunityScore: 94,
    oneLineReason: 'Massive organic demand for neurodivergent-friendly time and energy management tools.',
    badgeText: '🔥 Hot',
  },
  {
    title: 'Cozy Cottagecore Line Art Adult Coloring',
    category: 'coloring-books',
    trendDirection: 'stable',
    opportunityScore: 86,
    oneLineReason: 'Evergreen relaxation category with strong repeat gift-buyer loyalty.',
    badgeText: '📈 Rising',
  },
  {
    title: 'Solo Travel Safety & Reflection Logs for Women',
    category: 'journals-planners',
    trendDirection: 'rising',
    opportunityScore: 83,
    oneLineReason: 'Surge in female solo travel trends requiring emergency and itinerary logbooks.',
    badgeText: '⭐ New',
  },
  {
    title: 'Micro-Habits Workbook for Introverted Leaders',
    category: 'business',
    trendDirection: 'rising',
    opportunityScore: 81,
    oneLineReason: 'Underserved workplace niche looking for non-aggressive management frameworks.',
    badgeText: '📈 Rising',
  },
  {
    title: 'Emotional Regulation Stories for Toddlers',
    category: 'children',
    trendDirection: 'stable',
    opportunityScore: 88,
    oneLineReason: 'Consistent parental demand for short bedtime stories teaching big emotions.',
    badgeText: '🔥 Hot',
  },
  {
    title: 'Daily Budgeting & Cash Envelope Tracking Logs',
    category: 'low-content',
    trendDirection: 'stable',
    opportunityScore: 82,
    oneLineReason: 'Inflation-conscious buyers seeking physical debt-payoff and savings trackers.',
    badgeText: '📈 Rising',
  },
  {
    title: 'Mindful Gardening & Seed Inventory Journals',
    category: 'non-fiction',
    trendDirection: 'rising',
    opportunityScore: 84,
    oneLineReason: 'Seasonal gardening boom with high demand for planting schedules and harvest logs.',
    badgeText: '🌱 Seasonal',
  },
  {
    title: 'Pre-Algebra Visual Concept Workbooks for Kids',
    category: 'education',
    trendDirection: 'stable',
    opportunityScore: 86,
    oneLineReason: 'Parents supplementing math education with visual, gamified step-by-step pages.',
    badgeText: '⭐ New',
  },
];

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  return cleaned.trim();
}

/**
 * Regenerates the 12 hottest Amazon KDP niches using Gemini with Google Search web grounding
 */
export async function generateTrendingNiches(): Promise<TrendingNichesCache> {
  const now = new Date();
  const next = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);
  const nowIso = now.toISOString();
  const nextIso = next.toISOString();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE') || apiKey === 'MY_GEMINI_API_KEY') {
    const fallbackCache: TrendingNichesCache = {
      niches: DEFAULT_TRENDING_NICHES,
      updatedAt: nowIso,
      nextUpdate: nextIso,
    };
    inMemoryTrendingCache = fallbackCache;
    return fallbackCache;
  }

  const prompt = `What are the 12 hottest Amazon KDP book niches right now?
Focus on:
- Currently trending topics and search surges on Amazon
- Underserved audiences and reader gaps
- Seasonal and emerging high-converting content formats (e.g. journals, workbooks, guides, puzzles, coloring)

Use web search to inspect current Amazon bestseller data, publishing trends, and buyer demand.

Return as a clean JSON array of 12 objects matching this structure:
[
  {
    "title": "Specific Niche Title",
    "category": "non-fiction" | "self-help" | "children" | "coloring-books" | "puzzle-books" | "journals-planners" | "fiction" | "cookbooks" | "business" | "health-wellness" | "education" | "low-content",
    "trendDirection": "rising" | "stable",
    "opportunityScore": 88,
    "oneLineReason": "Brief explanation of why this niche is hot right now",
    "badgeText": "🔥 Hot" | "⭐ New" | "📈 Rising" | "🌱 Seasonal"
  }
]

CRITICAL: Return ONLY valid JSON array. No markdown code blocks, no other text.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    let rawText = '';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite Amazon KDP publishing market intelligence analyst.',
          tools: [{ googleSearch: {} }],
          temperature: 0.3,
        },
      });
      rawText = response.text || '';
    } catch (groundingErr) {
      console.warn('Trending niches web grounding failed, falling back:', groundingErr);
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite Amazon KDP publishing market intelligence analyst.',
          temperature: 0.4,
        },
      });
      rawText = response.text || '';
    }

    const cleaned = cleanJsonText(rawText);
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (Array.isArray(parsed) && parsed.length >= 6) {
      const niches: TrendingNichePreview[] = parsed.slice(0, 12).map((item, idx) => ({
        title: String(item.title || `Trending Niche ${idx + 1}`),
        category: (item.category as NicheCategory) || 'self-help',
        trendDirection: item.trendDirection === 'stable' ? 'stable' : 'rising',
        opportunityScore: Math.min(100, Math.max(70, Number(item.opportunityScore) || 85)),
        oneLineReason: String(item.oneLineReason || 'Strong buyer demand and low competitor quality on Amazon.'),
        badgeText: String(item.badgeText || (idx < 3 ? '🔥 Hot' : idx < 7 ? '📈 Rising' : '⭐ New')),
      }));

      const cacheObj: TrendingNichesCache = {
        niches,
        updatedAt: nowIso,
        nextUpdate: nextIso,
      };

      // Save to Firestore & In-Memory
      inMemoryTrendingCache = cacheObj;
      await saveTrendingToFirestore(cacheObj);
      return cacheObj;
    }
  } catch (err) {
    console.error('Error generating trending niches with Gemini:', err);
  }

  const fallbackCache: TrendingNichesCache = {
    niches: DEFAULT_TRENDING_NICHES,
    updatedAt: nowIso,
    nextUpdate: nextIso,
  };
  inMemoryTrendingCache = fallbackCache;
  return fallbackCache;
}

async function saveTrendingToFirestore(data: TrendingNichesCache): Promise<void> {
  // Try adminDb first (server-side)
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      await adminDb.collection(CACHE_COLLECTION).doc(CACHE_DOC_ID).set(data);
      return;
    } catch (err) {
      console.warn('Failed to save trending cache via Admin Firestore:', err);
    }
  }

  // Fallback to client db
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, CACHE_COLLECTION, CACHE_DOC_ID);
      await setDoc(docRef, data);
    } catch (err) {
      console.warn('Failed to save trending cache via Client Firestore:', err);
    }
  }
}

async function readTrendingFromFirestore(): Promise<TrendingNichesCache | null> {
  const adminDb = getAdminDb();
  if (adminDb) {
    try {
      const snap = await adminDb.collection(CACHE_COLLECTION).doc(CACHE_DOC_ID).get();
      if (snap.exists) {
        return snap.data() as TrendingNichesCache;
      }
    } catch (err) {
      console.warn('Failed to read trending cache via Admin Firestore:', err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, CACHE_COLLECTION, CACHE_DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as TrendingNichesCache;
      }
    } catch (err) {
      console.warn('Failed to read trending cache via Client Firestore:', err);
    }
  }

  return null;
}

export async function getTrendingNichesHandler(): Promise<TrendingNichesCache> {
  const now = Date.now();

  // 1. Check in-memory cache
  if (inMemoryTrendingCache?.updatedAt) {
    const age = now - new Date(inMemoryTrendingCache.updatedAt).getTime();
    if (age < TWENTY_FOUR_HOURS_MS) {
      return inMemoryTrendingCache;
    }
  }

  // 2. Check Firestore cache
  const firestoreCache = await readTrendingFromFirestore();
  if (firestoreCache?.updatedAt) {
    const age = now - new Date(firestoreCache.updatedAt).getTime();
    if (age < TWENTY_FOUR_HOURS_MS) {
      inMemoryTrendingCache = firestoreCache;
      return firestoreCache;
    }
  }

  // 3. Stale or missing — regenerate and save
  return await generateTrendingNiches();
}

export async function GET() {
  try {
    const data = await getTrendingNichesHandler();
    return new Response(JSON.stringify({ success: true, ...data }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('API /api/niche/trending error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
