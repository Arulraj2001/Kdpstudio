export type PageRoute = 
  | 'home'
  | 'pricing'
  | 'about'
  | 'terms'
  | 'privacy'
  | 'contact'
  | 'changelog'
  | 'blog'
  | 'dashboard'
  | 'studio'
  | 'formatter'
  | 'cover'
  | 'puzzles'
  | 'word-search'
  | 'word-search-generating'
  | 'word-search-detail'
  | 'word-fit'
  | 'word-fit-generating'
  | 'word-fit-detail'
  | 'coloring'
  | 'coloring-generating'
  | 'coloring-detail'
  | 'color-by-number'
  | 'color-by-number-generating'
  | 'color-by-number-detail'
  | 'kdp'
  | 'research'
  | 'research-detail'
  | 'research-saved'
  | 'bulk'
  | 'bulk-template-new'
  | 'bulk-template-detail'
  | 'bulk-job-detail'
  | 'bulk-job-results'
  | 'analytics'
  | 'analytics-calculator'
  | 'analytics-goals'
  | 'analytics-books'
  | 'books'
  | 'series'
  | 'series-new'
  | 'series-detail'
  | 'publish'
  | 'brand-kit'
  | 'settings'
  | 'billing'
  | 'admin'
  | 'admin-users'
  | 'admin-user-detail'
  | 'admin-revenue'
  | 'admin-payments'
  | 'admin-payments-upi'
  | 'admin-payments-bmac'
  | 'admin-usage'
  | 'admin-health'
  | 'admin-broadcast'
  | 'admin-settings'
  | 'admin-support'
  | 'admin-content'
  | 'admin-content-audits'
  | 'admin-blog'
  | 'admin-blog-new'
  | 'admin-blog-edit'
  | 'admin-blog-authors'
  | 'admin-blog-import'
  | 'admin-blog-ads'
  | 'admin-blog-analytics'
  | 'admin-blog-seo'
  | 'geo-test'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'verify-email'
  | 'onboarding'
  | 'payment-success'
  | 'blog-detail'
  | 'launch';

export * from './blog';

export type BookStatus = 'draft' | 'formatting' | 'ready' | 'published';

export type TrimSize = '5x8' | '5.5x8.5' | '6x9' | '8.5x11';

export type PaperType = 'white' | 'cream';

export interface Chapter {
  id: string;
  title: string;
  content: string;   // HTML string from editor
  order: number;
  wordCount: number;
}

export interface FrontMatter {
  titlePage: boolean;
  copyrightPage: boolean;
  copyrightText?: string;
  dedication: string;
  tableOfContents: boolean;
  preface: string;
}

export interface BackMatter {
  aboutAuthor: string;
  aboutAuthorText?: string;
  otherBooks: string;
  resources: string;
}

export interface KDPMetadata {
  description: string;
  keywords: string[];
  categories: string[];
  price: number;
  royaltyPlan: '35' | '70';
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  language: string;
  genre: string;
  trimSize: TrimSize;
  paperType: PaperType;
  status: BookStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  chapters: Chapter[];
  frontMatter: FrontMatter;
  backMatter: BackMatter;
  metadata: KDPMetadata;
  kdpMetadata?: KDPMetadata;
  seriesId?: string;
  volumeNumber?: number;
  coverImage?: string;
  coverData?: any;
}

export interface CoverConfig {
  trimSize: TrimSize;
  pageCount: number;
  paperType: PaperType;
  spineWidthInches: number;
  totalWidthInches: number;
  totalHeightInches: number;
  bleedInches: number;
  frontCoverPrompt?: string;
  titleText: string;
  subtitleText?: string;
  authorText: string;
  spineText?: string;
  backCoverBlurb?: string;
  backgroundColor: string;
  fontFamily: string;
}

export interface KdpCalculationResult {
  spineWidth: number;
  fullWidth: number;
  fullHeight: number;
  bleed: number;
  safetyMargin: number;
  printingCost: number;
  recommendedListPrice: number;
}

export interface DashboardStats {
  totalBooks: number;
  publishedBooks: number;
  inProgress: number;
  totalCoversMade: number;
}

export type FormatterFontFamily =
  | 'Garamond'
  | 'Times New Roman'
  | 'Georgia'
  | 'Palatino'
  | 'Book Antiqua';

export type FormatterFontSize = '10pt' | '11pt' | '12pt';
export type FormatterLineSpacing = '1.0' | '1.15' | '1.5' | '2.0';
export type FormatterParagraphIndent = 'none' | '0.25in' | '0.5in';
export type PageNumberPosition = 'bottom-center' | 'bottom-outer' | 'none';
export type ChapterStart = 'same-page' | 'always-new-page';
export type RunningHeaderType = 'none' | 'book-title' | 'chapter-name';

export interface IncludedSections {
  titlePage: boolean;
  copyright: boolean;
  dedication: boolean;
  toc: boolean;
  preface: boolean;
  chapters: boolean;
  aboutAuthor: boolean;
}

export interface FormatterSettings {
  fontFamily: FormatterFontFamily;
  fontSize: FormatterFontSize;
  lineSpacing: FormatterLineSpacing;
  paragraphIndent: FormatterParagraphIndent;
  dropCaps: boolean;
  trimSize: TrimSize;
  paperType: PaperType;
  pageNumberPosition: PageNumberPosition;
  chapterStart: ChapterStart;
  runningHeader: RunningHeaderType;
  includedSections: IncludedSections;
  customText?: string;
}

export interface Margins {
  top: number;
  bottom: number;
  inside: number;
  outside: number;
}

export interface TrimDimensions {
  width: number;
  height: number;
}

export interface UserSettings {
  authorLegalName: string;
  penName: string;
  publisherImprint: string;
  website: string;
  defaultTrimSize: TrimSize;
  defaultPaperType: PaperType;
  defaultFont: FormatterFontFamily;
  defaultLanguage: string;
  autoSaveIntervalSec: number;
  bleedDefault: boolean;
  exportDpi: 300 | 600;
  geminiModel: string;
}

export interface PublishStepStatus {
  stepId: 'interior' | 'cover' | 'metadata' | 'pricing' | 'kdp_portal';
  title: string;
  description: string;
  status: 'complete' | 'incomplete' | 'warning' | 'blocked';
  details: string[];
}

export type { Currency, PlanName, PaymentMethod, LocationData } from '../lib/geo';
export type { AuthUser } from '../lib/authStore';
export type { UserDocument, UserUsage, UserSettings as UserDocSettings } from '../lib/userService';
export * from './payment';
export * from './niche';
export * from './bulk';
export * from './analytics';
export * from './versions';
export * from './audit';


