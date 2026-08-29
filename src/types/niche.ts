/**
 * KDP Studio — AI Niche Research Types
 * Phase 13A
 */

export type NicheCategory =
  | 'non-fiction'
  | 'self-help'
  | 'children'
  | 'coloring-books'
  | 'puzzle-books'
  | 'journals-planners'
  | 'fiction'
  | 'cookbooks'
  | 'business'
  | 'health-wellness'
  | 'education'
  | 'low-content';

export type NicheDifficulty = 'very-easy' | 'easy' | 'medium' | 'hard' | 'very-hard';

export type NicheTrend = 'rising' | 'stable' | 'declining' | 'seasonal' | 'new';

export type NicheTargetMarket = 'amazon-us' | 'amazon-uk' | 'amazon-ca' | 'amazon-in';

export interface NicheBookIdea {
  title: string;
  subtitle: string;
  angle: string;               // what makes this unique
  targetReader: string;
  estimatedPageCount: number;
  suggestedPrice: string;
}

export interface NicheResult {
  id: string;

  // Core Identity
  nicheTitle: string;          // e.g. "Anxiety Journals for Teen Girls"
  category: NicheCategory;
  subcategory: string;         // e.g. "Mental Health Journals"
  description: string;         // 2-3 sentence overview

  // Opportunity Scores (all 1-100)
  opportunityScore: number;    // overall score: weighted avg (demand*0.4 + (100-comp)*0.35 + profit*0.25)
  demandScore: number;         // how much people search
  competitionScore: number;    // lower = less competition
  profitScore: number;         // earning potential
  trendScore: number;          // momentum score

  // Market Data
  estimatedMonthlySales: string;   // e.g. "Estimated: 500-2,000 units/month"
  averagePrice: string;            // e.g. "$7.99-$14.99"
  topBsrRange: string;             // e.g. "BSR 1,000-50,000"
  estimatedMonthlyRevenue: string; // e.g. "$3,000-$15,000"

  // Competition Analysis
  difficulty: NicheDifficulty;
  competitorCount: string;         // e.g. "50-200 books"
  topCompetitorStrength: 'Weak' | 'Moderate' | 'Strong' | string;
  marketGap: string;               // what's missing in this niche

  // Trend Data
  trend: NicheTrend;
  trendReason: string;             // why it's trending/declining
  seasonality: string | null;      // e.g. "Peaks Nov-Dec"

  // KDP Specifics
  recommendedBisacCategories: string[];
  suggestedKeywords: string[];     // 10 keyword ideas
  recommendedPrice: string;
  royaltyPlan: '35%' | '70%';
  recommendedTrimSize: string;
  pageCountRange: string;          // e.g. "100-200 pages"

  // Book Ideas
  bookIdeas: NicheBookIdea[];      // 3 specific book ideas

  // Quick Assessment
  pros: string[];                  // 2-3 reasons to enter
  cons: string[];                  // 1-2 reasons to be cautious
  verdict: string;                 // one sentence conclusion
  timeToFirstSale: string;         // e.g. "2-4 weeks"

  // Meta
  generatedAt: string | Date;
  searchQuery: string;             // original user query
  dataSource: 'ai-analysis';
}

export interface NicheSearchHistory {
  id: string;
  uid: string;
  query: string;
  category: NicheCategory | 'all';
  results: NicheResult[];
  savedNiches: string[];           // IDs of starred results within this search
  createdAt: string | Date;
}

export type SavedNicheStatus = 'considering' | 'researching' | 'writing' | 'published' | 'abandoned';

export interface SavedNiche {
  id: string;
  uid: string;
  nicheResult: NicheResult;
  notes: string;                   // user's personal notes
  status: SavedNicheStatus;
  linkedBookId: string | null;
  savedAt: string | Date;
}

export interface TrendingNichePreview {
  title: string;
  category: NicheCategory;
  trendDirection: 'rising' | 'stable';
  opportunityScore: number;
  oneLineReason: string;           // why it's hot right now
  badgeText: string;               // e.g. "🔥 Hot" "⭐ New" "📈 Rising"
}

export interface TrendingNichesCache {
  niches: TrendingNichePreview[];
  updatedAt: string;
  nextUpdate: string;
}

export const NICHE_CATEGORIES: { id: NicheCategory; label: string; icon: string }[] = [
  { id: 'non-fiction', label: 'Non-Fiction', icon: 'BookOpen' },
  { id: 'self-help', label: 'Self-Help & Personal Growth', icon: 'Sparkles' },
  { id: 'children', label: 'Children’s Books', icon: 'Smile' },
  { id: 'coloring-books', label: 'Coloring Books', icon: 'Palette' },
  { id: 'puzzle-books', label: 'Puzzle & Activity Books', icon: 'Grid' },
  { id: 'journals-planners', label: 'Journals & Planners', icon: 'Calendar' },
  { id: 'fiction', label: 'Fiction & Romance', icon: 'Heart' },
  { id: 'cookbooks', label: 'Cookbooks & Recipes', icon: 'Utensils' },
  { id: 'business', label: 'Business & Money', icon: 'Briefcase' },
  { id: 'health-wellness', label: 'Health & Wellness', icon: 'Activity' },
  { id: 'education', label: 'Education & Workbooks', icon: 'GraduationCap' },
  { id: 'low-content', label: 'Low-Content & Notebooks', icon: 'Layers' },
];

export function calculateOpportunityScore(
  demandScore: number,
  competitionScore: number,
  profitScore: number
): number {
  const weighted = demandScore * 0.4 + (100 - competitionScore) * 0.35 + profitScore * 0.25;
  return Math.min(100, Math.max(1, Math.round(weighted)));
}
