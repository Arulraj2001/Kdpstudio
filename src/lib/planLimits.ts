/**
 * KDP Studio Plan Limits, Feature Access Matrix & Dynamic Admin Tier System
 * 
 * Features:
 * - Growth-Led Free Tier Defaults (Extra limits to hook & acquire creators)
 * - Dynamic Admin Customization via Firestore (appConfig/planLimits)
 * - 0ms In-Memory Caching with real-time onSnapshot subscription
 * - Zero-Downtime Fallback to canonical presets
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface PlanLimitsConfig {
  daily: {
    aiGenerations: number;
    pdfExports: number;
    imageGenerations: number;
    coverExports: number;
    puzzleGenerations: number;
    epubExports: number;
    nicheSearches?: number;
    [key: string]: number | undefined;
  };
  monthly: {
    aiGenerations: number;
    pdfExports: number;
    imageGenerations: number;
    [key: string]: number | undefined;
  };
  total: {
    bookProjects: number;
    bookSeries: number;
    teamSeats: number;
    versionHistory: number;
    [key: string]: number | undefined;
  };
}

export type PlanTier = 'free' | 'starter' | 'pro' | 'agency' | 'lifetime';

/**
 * Growth-Led Canonical Plan Limits (Default Fallbacks)
 */
export const PLAN_LIMITS: Record<string, PlanLimitsConfig> = {
  free: {
    daily: {
      aiGenerations: 15,       // Extra generous to let users outline & draft chapters
      pdfExports: 3,           // Up from 1
      imageGenerations: 3,     // Up from 1
      coverExports: 3,         // Up from 1
      puzzleGenerations: 5,    // Unlocked! 5 daily puzzles for free users
      epubExports: 1,          // 1 daily test ePub
      nicheSearches: 5,        // 5 daily niche explorations
    },
    monthly: {
      aiGenerations: 150,      // Up from 30
      pdfExports: 30,          // Up from 10
      imageGenerations: 25,    // Up from 5
    },
    total: {
      bookProjects: 3,         // Up from 1, allowing 3 simultaneous books
      bookSeries: 1,           // 1 series
      teamSeats: 1,
      versionHistory: 3,
    },
  },
  starter: {
    daily: {
      aiGenerations: 30,
      pdfExports: 15,
      imageGenerations: 15,
      coverExports: 10,
      puzzleGenerations: 15,
      epubExports: 10,
      nicheSearches: 20,
    },
    monthly: {
      aiGenerations: 500,
      pdfExports: 150,
      imageGenerations: 150,
    },
    total: {
      bookProjects: 15,
      bookSeries: 3,
      teamSeats: 1,
      versionHistory: 10,
    },
  },
  pro: {
    daily: {
      aiGenerations: -1, // -1 means unlimited
      pdfExports: -1,
      imageGenerations: 50,
      coverExports: -1,
      puzzleGenerations: 50,
      epubExports: -1,
      nicheSearches: -1,
    },
    monthly: {
      aiGenerations: -1,
      pdfExports: -1,
      imageGenerations: 500,
    },
    total: {
      bookProjects: -1,
      bookSeries: -1,
      teamSeats: 1,
      versionHistory: 30,
    },
  },
  agency: {
    daily: {
      aiGenerations: -1,
      pdfExports: -1,
      imageGenerations: -1,
      coverExports: -1,
      puzzleGenerations: -1,
      epubExports: -1,
      nicheSearches: -1,
    },
    monthly: {
      aiGenerations: -1,
      pdfExports: -1,
      imageGenerations: -1,
    },
    total: {
      bookProjects: -1,
      bookSeries: -1,
      teamSeats: 5,
      versionHistory: -1,
    },
  },
  lifetime: {
    daily: {
      aiGenerations: -1,
      pdfExports: -1,
      imageGenerations: 50,
      coverExports: -1,
      puzzleGenerations: 50,
      epubExports: -1,
      nicheSearches: -1,
    },
    monthly: {
      aiGenerations: -1,
      pdfExports: -1,
      imageGenerations: 500,
    },
    total: {
      bookProjects: -1,
      bookSeries: -1,
      teamSeats: 1,
      versionHistory: 30,
    },
  },
};

export const FEATURE_ACCESS: Record<string, PlanTier> = {
  aiWrite: 'free',
  pdfExport: 'free',
  coverBuilder: 'free',
  aiCoverImage: 'starter',
  epubExport: 'free',
  puzzleGenerator: 'free',         // Unlocked for free users!
  coloringBookGenerator: 'free',   // Unlocked for free users!
  nicheResearch: 'free',           // Unlocked for free users!
  bulkGenerator: 'agency',
  teamSeats: 'agency',
  brandKit: 'starter',
  whiteLabel: 'agency',
  versionHistory: 'free',
  bookSeries: 'free',
  aiTranslator: 'pro',
  analyticsAdvanced: 'pro',
  prioritySupport: 'pro',
  removeWatermark: 'starter',
};

export const PLAN_RANKS: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  agency: 3,
  lifetime: 2,
};

export const FEATURE_LABELS: Record<string, string> = {
  aiGenerations: 'AI Writing & Generation',
  aiWrite: 'AI Writing & Outlining',
  pdfExports: 'PDF Interior Export',
  pdfExport: 'PDF Interior Export',
  imageGenerations: 'AI Image Generation',
  aiCoverImage: 'AI Cover Art Generation',
  coverExports: 'Cover Export',
  coverBuilder: 'Cover Designer',
  puzzleGenerations: 'Puzzle Generation',
  puzzleGenerator: 'Puzzle & Activity Book Engine',
  epubExports: 'ePub Kindle Export',
  epubExport: 'ePub Kindle Export',
  coloringBookGenerator: 'Coloring Book Generator',
  nicheResearch: 'KDP Niche & Keyword Analysis',
  bulkGenerator: 'Bulk Low-Content Generator',
  teamSeats: 'Multi-User Team Workspace',
  brandKit: 'Custom Brand Kit',
  whiteLabel: 'White-Label Book PDFs',
  versionHistory: 'Full Version History',
  bookSeries: 'Book Series Management',
  aiTranslator: 'AI Multilingual Translation',
  analyticsAdvanced: 'Advanced KDP Market Analytics',
  prioritySupport: 'Priority Author Support',
  removeWatermark: 'No Watermark',
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Firestore Configuration & Live Caching
// ─────────────────────────────────────────────────────────────────────────────

export interface DynamicPlanLimitsConfig {
  version: number;
  updatedAt?: string;
  updatedBy?: string;
  tiers: Record<string, PlanLimitsConfig>;
  featureAccess: Record<string, PlanTier>;
  growthPromo?: {
    enabled: boolean;
    bannerText: string;
    extraAiGenerationsBonus: number;
    extraBookProjectsBonus: number;
  };
}

let inMemoryDynamicConfig: DynamicPlanLimitsConfig | null = null;
let isSubscribedToFirestore = false;

/**
 * Initializes and subscribes to real-time Firestore updates on appConfig/planLimits
 */
export function initPlanLimitsSubscription(onUpdate?: (config: DynamicPlanLimitsConfig) => void): () => void {
  if (typeof window === 'undefined' || !db) {
    return () => {};
  }

  // Load from localStorage cache if available for instant 0ms startup
  try {
    const cached = localStorage.getItem('kdp_dynamic_plan_limits');
    if (cached) {
      inMemoryDynamicConfig = JSON.parse(cached);
    }
  } catch {}

  if (isSubscribedToFirestore) {
    return () => {};
  }

  try {
    const docRef = doc(db, 'appConfig', 'planLimits');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DynamicPlanLimitsConfig;
        inMemoryDynamicConfig = data;
        try {
          localStorage.setItem('kdp_dynamic_plan_limits', JSON.stringify(data));
        } catch {}
        if (onUpdate) onUpdate(data);
      }
    }, (err) => {
      console.warn('[PlanLimits] Real-time subscription notice:', err);
    });

    isSubscribedToFirestore = true;
    return unsubscribe;
  } catch (err) {
    console.warn('[PlanLimits] Failed to initialize subscription:', err);
    return () => {};
  }
}

/**
 * Fetches dynamic plan limits once from Firestore
 */
export async function fetchDynamicPlanLimits(): Promise<DynamicPlanLimitsConfig> {
  if (inMemoryDynamicConfig) {
    return inMemoryDynamicConfig;
  }

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'appConfig', 'planLimits'));
      if (snap.exists()) {
        const data = snap.data() as DynamicPlanLimitsConfig;
        inMemoryDynamicConfig = data;
        return data;
      }
    } catch (err) {
      console.warn('[PlanLimits] Fetch notice:', err);
    }
  }

  // Fallback to canonical defaults
  return {
    version: 1,
    tiers: PLAN_LIMITS,
    featureAccess: FEATURE_ACCESS,
    growthPromo: {
      enabled: true,
      bannerText: '🎉 Special Creator Launch: Free tier upgraded with extra daily AI credits & puzzle generation!',
      extraAiGenerationsBonus: 5,
      extraBookProjectsBonus: 2,
    },
  };
}

/**
 * Returns the live quota limit configuration for a specific plan tier
 */
export function getLivePlanLimits(plan: string = 'free'): PlanLimitsConfig {
  const normPlan = plan.toLowerCase();
  if (inMemoryDynamicConfig?.tiers && inMemoryDynamicConfig.tiers[normPlan]) {
    return inMemoryDynamicConfig.tiers[normPlan];
  }
  return PLAN_LIMITS[normPlan] || PLAN_LIMITS.free;
}

/**
 * Returns the required plan tier for a specific feature
 */
export function getLiveFeatureAccess(feature: string): PlanTier {
  if (inMemoryDynamicConfig?.featureAccess && inMemoryDynamicConfig.featureAccess[feature]) {
    return inMemoryDynamicConfig.featureAccess[feature];
  }
  return FEATURE_ACCESS[feature] || 'free';
}

/**
 * Saves dynamic plan limits and feature access matrix to Firestore
 */
export async function saveDynamicPlanLimits(
  config: Partial<DynamicPlanLimitsConfig>,
  adminEmail: string = 'admin'
): Promise<boolean> {
  if (!db) return false;
  try {
    const payload: DynamicPlanLimitsConfig = {
      version: (inMemoryDynamicConfig?.version || 1) + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
      tiers: config.tiers || inMemoryDynamicConfig?.tiers || PLAN_LIMITS,
      featureAccess: config.featureAccess || inMemoryDynamicConfig?.featureAccess || FEATURE_ACCESS,
      growthPromo: config.growthPromo || inMemoryDynamicConfig?.growthPromo || {
        enabled: true,
        bannerText: '🎉 Special Creator Launch: Free tier upgraded with extra daily AI credits & puzzle generation!',
        extraAiGenerationsBonus: 5,
        extraBookProjectsBonus: 2,
      },
    };

    await setDoc(doc(db, 'appConfig', 'planLimits'), payload, { merge: true });
    inMemoryDynamicConfig = payload;
    try {
      localStorage.setItem('kdp_dynamic_plan_limits', JSON.stringify(payload));
    } catch {}
    return true;
  } catch (err) {
    console.error('[PlanLimits] Error saving dynamic limits to Firestore:', err);
    throw err;
  }
}
