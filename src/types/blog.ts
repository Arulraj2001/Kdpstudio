/**
 * Database-Driven Blog CMS & EEAT Architecture Types
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

export type BlogStatus = 'draft' | 'review' | 'published' | 'archived';

export type BlogSchemaType = 
  | 'Article' 
  | 'HowToArticle' 
  | 'FAQPage' 
  | 'NewsArticle' 
  | 'Review';

export type AdPosition = 
  | 'header' 
  | 'in-article-1' 
  | 'in-article-2' 
  | 'in-article-3' 
  | 'sidebar' 
  | 'footer' 
  | 'between-posts' 
  | 'above-comments';

export interface BlogAuthor {
  id: string;
  name: string;
  slug: string;
  bio: string;
  shortBio: string;        // 1 sentence for byline
  credentials: string;     // e.g. "KDP Publisher, 5+ years"
  photoUrl: string | null;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  expertise: string[];     // e.g. ["Amazon KDP", "Self-Publishing", "Book Formatting"]
  isVerifiedExpert: boolean;
  totalPosts: number;      // auto-updated
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BlogTocItem {
  id: string;              // heading anchor ID
  text: string;            // heading text
  level: 2 | 3 | 4;        // h2, h3, h4
}

export interface BlogSource {
  title: string;
  url: string;
  publishedDate?: string;
  publisher?: string;
}

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogHowToStep {
  name: string;
  text: string;
  imageUrl?: string;
}

export interface AdOverride {
  positionId: string;
  enabled: boolean;        // override global setting
}

export interface BlogFeaturedImage {
  url: string;
  alt: string;             // required for SEO
  caption: string;
  width: number;
  height: number;
}

export interface BlogPost {
  id: string;
  
  // ── Core Content ──
  title: string;
  slug: string;            // URL-friendly, unique
  content: string;         // HTML from Tiptap editor
  excerpt: string;         // 150-160 chars for meta desc
  status: BlogStatus;
  
  // ── Author (EEAT) ──
  authorId: string;
  authorName: string;      // denormalized for speed
  authorPhotoUrl: string | null;
  authorCredentials: string;
  
  // ── Dates (EEAT critical) ──
  createdAt: string | Date;
  publishedAt: string | Date | null;
  updatedAt: string | Date;
  lastReviewedAt: string | Date | null;
  reviewedBy: string | null;   // expert reviewer name
  isExpertReviewed: boolean;
  
  // ── Taxonomy ──
  category: string;
  tags: string[];
  
  // ── Media ──
  featuredImage: BlogFeaturedImage | null;
  
  // ── SEO Fields ──
  metaTitle: string;       // if empty, use title
  metaDescription: string; // if empty, use excerpt
  focusKeyword: string;    // primary keyword to target
  secondaryKeywords: string[];
  canonicalUrl: string;    // if empty, auto-generate
  noIndex: boolean;        // default false
  
  // ── Open Graph ──
  ogTitle: string;         // if empty, use metaTitle
  ogDescription: string;   // if empty, use metaDescription
  ogImage: string | null;  // if null, use featuredImage
  
  // ── Twitter Card ──
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string | null;
  
  // ── Content Metrics ──
  readingTimeMinutes: number;  // auto-calculated
  wordCount: number;           // auto-calculated
  tableOfContents: BlogTocItem[];  // auto-generated
  
  // ── Schema Markup ──
  schemaType: BlogSchemaType;
  faqItems: BlogFaqItem[];     // for FAQPage schema
  howToSteps: BlogHowToStep[]; // for HowToArticle schema
  
  // ── Sources (EEAT) ──
  sources: BlogSource[];
  
  // ── Ad Settings ──
  adsEnabled: boolean;         // default: true
  adOverrides: AdOverride[];   // per-position overrides
  
  // ── Engagement ──
  viewCount: number;
  estimatedReadCount: number;  // views × avg scroll depth
  
  // ── Internal ──
  publishedBy: string;         // admin email
  lastEditedBy: string;
  revisionCount: number;
  internalNotes: string;       // not shown publicly
}

export interface AdPositionConfig {
  id: string;                  // matches AdPosition
  name: string;                // "In-Article #1"
  description: string;         // where it appears
  adUnitId: string;            // from Google AdSense
  enabled: boolean;
  hideForLoggedIn: boolean;    // hide for any logged in user
  hideForPaidUsers: boolean;   // hide for paid plans only
  minWordCount: number;        // only show if post >= words
}

export interface AdConfig {
  adsensePublisherId: string;  // ca-pub-XXXXXXXXXXXXXXXX
  globalAdsEnabled: boolean;
  autoAdsEnabled: boolean;     // AdSense auto ads
  positions: AdPositionConfig[];
  updatedAt: string | Date;
  updatedBy: string;
}

export interface BulkImportPost {
  title: string;               // required
  slug?: string;               // auto-generated if missing
  content: string;             // required, HTML or markdown
  excerpt?: string;
  category: string;            // required
  tags?: string[];
  authorId?: string;
  authorName?: string;
  status?: BlogStatus;
  publishedAt?: string;        // ISO date string
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  schemaType?: BlogSchemaType;
  faqItems?: BlogFaqItem[];
  sources?: BlogSource[];
  isExpertReviewed?: boolean;
  reviewedBy?: string;
}

export interface BulkImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface BulkImportDuplicate {
  title: string;
  slug: string;
}

export interface BulkImportResult {
  totalRows: number;
  valid: number;
  invalid: number;
  duplicateSlugs: number;
  validCount?: number;
  errorCount?: number;
  duplicateCount?: number;
  errors: BulkImportError[];
  preview: BulkImportPost[];   // first 5 valid posts
  validPosts?: BulkImportPost[]; // all valid posts for ingestion
  duplicates?: BulkImportDuplicate[];
}

// ── AI Blog Post Generation Types ──

export type BlogGenerationType =
  | 'how-to-guide'
  | 'listicle'
  | 'case-study'
  | 'comparison'
  | 'tutorial'
  | 'news-analysis'
  | 'ultimate-guide'
  | 'quick-tips';

export type BlogTone =
  | 'authoritative'
  | 'conversational'
  | 'educational'
  | 'motivational'
  | 'analytical';

export interface BlogOutlineItem {
  level: 2 | 3;
  heading: string;
  summary: string;
  estimatedWords?: number;
}

export interface BlogGenerationRequest {
  keyword: string;
  secondaryKeywords?: string[];
  postType: BlogGenerationType;
  targetWordCount: number;
  tone: BlogTone;
  audience?: string;
  includeSchema?: BlogSchemaType;
  includeFaq?: boolean;
  includeHowTo?: boolean;
  authorId?: string;
  category?: string;
  outline?: string;
}

export interface BlogGenerationResult {
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  excerpt: string;
  content: string;
  outline: BlogOutlineItem[];
  focusKeyword: string;
  secondaryKeywords: string[];
  tags: string[];
  faqItems: BlogFaqItem[];
  howToSteps: BlogHowToStep[];
  suggestedSources: BlogSource[];
  internalLinkSuggestions: string[];
  estimatedReadingTime: number;
  wordCount: number;
  seoScore: number;
}
