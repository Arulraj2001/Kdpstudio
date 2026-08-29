/**
 * KDP Studio — Analytics & Royalty Tracking Types
 * Phase 15A
 */

export type SalesPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type MarketPlace =
  | 'amazon-us'
  | 'amazon-uk'
  | 'amazon-ca'
  | 'amazon-au'
  | 'amazon-in'
  | 'amazon-de'
  | 'amazon-fr'
  | 'amazon-es'
  | 'amazon-it'
  | 'amazon-jp'
  | 'amazon-br'
  | 'amazon-mx';

export type RoyaltyType = 'ebook' | 'paperback' | 'hardcover';

export interface BookPerformanceEntry {
  id: string;
  bookId: string;
  uid: string;

  // Date
  date: string; // 'YYYY-MM-DD'
  week: string; // 'YYYY-WW'
  month: string; // 'YYYY-MM'
  year: number;

  // Sales Data (manually entered)
  marketplace: MarketPlace;
  royaltyType: RoyaltyType;
  unitsSold: number;
  unitsReturned: number;
  netUnitsSold: number; // unitsSold - unitsReturned

  // Revenue (manually entered)
  grossRevenue: number; // before royalty
  royaltyEarned: number; // actual royalty received
  currency: string; // currency of marketplace
  revenueUSD: number; // converted to USD for totals

  // Book Rank (manually entered)
  bsr: number | null; // Best Seller Rank
  categoryRank: number | null;
  categoryName: string | null;

  // KDP Page Reads (Kindle Unlimited)
  kenpPageReads: number; // KENP pages read
  kenpRoyalty: number; // royalty from page reads

  // Source
  entryMethod: 'manual' | 'import';
  notes: string;

  createdAt: any;
  updatedAt: any;
}

export interface PublishedBook {
  id: string;
  uid: string;

  // Identity
  bookId: string | null; // links to /books/{id} if created in studio
  title: string;
  subtitle: string;
  author: string;
  asin: string; // Amazon Standard ID (B0XXXXXXXX) or ISBN

  // Book Details
  royaltyType: RoyaltyType;
  marketplace: MarketPlace;
  publishedDate: string; // 'YYYY-MM-DD'
  listPrice: number;
  currency: string;
  royaltyPlan: '35' | '70';
  pageCount: number;
  trimSize: string;

  // KDP URLs
  amazonUrl: string;
  kdpDashboardUrl: string;

  // Cover
  coverImageUrl: string | null;

  // Status
  status: 'live' | 'draft' | 'under-review' | 'removed' | 'unpublished';

  // Calculated (updated on each data entry)
  totalUnitsSold: number;
  totalRevenue: number; // in USD
  totalRoyalties: number; // in USD
  averageBsr: number | null;
  bestBsr: number | null;
  bestBsrDate: string | null;
  lastUpdated: string; // 'YYYY-MM-DD'

  createdAt: any;
  updatedAt: any;
}

export interface PublishingGoal {
  id: string;
  uid: string;

  type: 'revenue' | 'units' | 'books-published' | 'bsr' | 'royalties';

  title: string; // "Earn ₹50,000/month"
  targetValue: number;
  currentValue: number; // auto-calculated
  unit: string; // "books" | "₹" | "$" | "BSR"

  period: 'monthly' | 'yearly' | 'total' | 'one-time';
  targetDate: string | null; // 'YYYY-MM-DD'

  status: 'active' | 'achieved' | 'abandoned';
  achievedDate: string | null;

  linkedBookIds: string[]; // which books count toward goal

  createdAt: any;
  updatedAt: any;
}

export interface StreakMilestone {
  days: number; // 7, 30, 100, 365
  achievedDate: string | null;
  badge: string; // emoji badge e.g. 🥉, 🥈, 🥇, 💎
  label: string; // "One Week Streak!"
}

export interface PublishingStreak {
  uid: string;
  currentStreak: number; // days in a row with activity
  longestStreak: number;
  lastActivityDate: string; // 'YYYY-MM-DD'
  totalActiveDays: number;
  streakType: 'publishing' | 'updating' | 'any-activity';
  milestones: StreakMilestone[];
}

export interface RoyaltyProjection {
  unitsSold: number;
  monthlyRoyalty: number;
  yearlyRoyalty: number;
}

export interface RoyaltyCalculation {
  listPrice: number;
  marketplace: MarketPlace;
  royaltyType: RoyaltyType;
  royaltyPlan: '35' | '70';
  pageCount: number;
  fileSizeMB: number;

  // Results
  deliveryCost: number; // only for 70% ebook
  royaltyPerSale: number;
  royaltyPercentage: number;
  minimumPrice: number; // for 70% eligibility or printing cost coverage
  printingCost?: number;
  profitMargin?: number;

  // Projections
  projections: RoyaltyProjection[];
}

export interface AnalyticsSummary {
  uid: string;
  period: SalesPeriod;
  periodLabel: string; // "August 2026"

  totalRevenue: number; // USD
  totalRoyalties: number; // USD
  totalUnitsSold: number;
  totalKenpPages: number;

  topBook: { title: string; revenue: number } | null;
  topMarketplace: MarketPlace | null;

  revenueByBook: { bookTitle: string; revenue: number }[];
  revenueByMarketplace: { marketplace: string; revenue: number }[];
  revenueByDay: { date: string; revenue: number }[];

  vsLastPeriod: {
    revenue: number; // percentage change
    units: number;
    royalties: number;
  };
}

export interface AIInsightItem {
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
  actionItem: string;
}

export interface AIAnalyticsInsights {
  overallHealth: 'excellent' | 'good' | 'fair' | 'needs-attention';
  healthReason: string;
  biggestOpportunity: string;
  topInsights: AIInsightItem[];
  warningFlags: string[];
  encouragement: string;
}

export interface ParsedKdpReport {
  entries: Partial<BookPerformanceEntry>[];
  bookTitles: string[]; // unique titles found
  dateRange: { from: string; to: string };
  totalRevenue: number;
  totalUnits: number;
  errors: string[];
  warnings: string[];
}
