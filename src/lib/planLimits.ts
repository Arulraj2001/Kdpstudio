/**
 * KDP Studio Plan Limits & Feature Access Matrix
 * 
 * Note on Credits:
 * Credits are an ADDITIONAL pool — they refill limits when daily quotas are exhausted.
 * They don't replace the plan system, but allow users to pay-as-you-go for extra AI/export actions.
 */

export interface PlanLimitsConfig {
  daily: {
    aiGenerations: number;
    pdfExports: number;
    imageGenerations: number;
    coverExports: number;
    puzzleGenerations: number;
    epubExports: number;
    [key: string]: number;
  };
  monthly: {
    aiGenerations: number;
    pdfExports: number;
    imageGenerations: number;
    [key: string]: number;
  };
  total: {
    bookProjects: number;
    bookSeries: number;
    teamSeats: number;
    versionHistory: number;
    [key: string]: number;
  };
}

export type PlanTier = 'free' | 'starter' | 'pro' | 'agency' | 'lifetime';

export const PLAN_LIMITS: Record<string, PlanLimitsConfig> = {
  free: {
    daily: {
      aiGenerations: 3,
      pdfExports: 1,
      imageGenerations: 1,
      coverExports: 1,
      puzzleGenerations: 0,
      epubExports: 0,
    },
    monthly: {
      aiGenerations: 30,
      pdfExports: 10,
      imageGenerations: 5,
    },
    total: {
      bookProjects: 1,
      bookSeries: 0,
      teamSeats: 1,
      versionHistory: 0,
    },
  },
  starter: {
    daily: {
      aiGenerations: 20,
      pdfExports: 10,
      imageGenerations: 10,
      coverExports: 5,
      puzzleGenerations: 5,
      epubExports: 5,
    },
    monthly: {
      aiGenerations: 300,
      pdfExports: 100,
      imageGenerations: 100,
    },
    total: {
      bookProjects: 10,
      bookSeries: 1,
      teamSeats: 1,
      versionHistory: 5,
    },
  },
  pro: {
    daily: {
      aiGenerations: -1, // -1 means unlimited
      pdfExports: -1,
      imageGenerations: 50,
      coverExports: -1,
      puzzleGenerations: 30,
      epubExports: -1,
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
    },
    monthly: {
      aiGenerations: -1,
      pdfExports: -1,
      imageGenerations: -1,
    },
    total: {
      bookProjects: -1,
      bookSeries: -1,
      teamSeats: 3,
      versionHistory: -1,
    },
  },
  lifetime: {
    daily: {
      aiGenerations: -1,
      pdfExports: -1,
      imageGenerations: 50,
      coverExports: -1,
      puzzleGenerations: 30,
      epubExports: -1,
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
  aiCoverImage: 'pro',
  epubExport: 'starter',
  puzzleGenerator: 'starter',
  coloringBookGenerator: 'starter',
  nicheResearch: 'pro',
  bulkGenerator: 'agency',
  teamSeats: 'agency',
  brandKit: 'starter',
  whiteLabel: 'agency',
  versionHistory: 'starter',
  bookSeries: 'starter',
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
  aiGenerations: 'AI Generation',
  aiWrite: 'AI Writing & Outlining',
  pdfExports: 'PDF Interior Export',
  pdfExport: 'PDF Interior Export',
  imageGenerations: 'AI Image Generation',
  aiCoverImage: 'AI Cover Art Generation',
  coverExports: 'Cover Export',
  coverBuilder: 'Cover Designer',
  puzzleGenerations: 'Puzzle Generation',
  puzzleGenerator: 'Puzzle & Activity Book Engine',
  epubExports: 'ePub Export',
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
