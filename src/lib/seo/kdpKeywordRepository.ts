/**
 * KDP Studio — Curated High-Intent Keyword Repository
 * 
 * Contains high-volume, low-competition Amazon KDP search clusters
 * targeted for automated organic traffic acquisition and GEO indexing.
 */

import { BlogGenerationType } from '../../types/blog';

export interface KdpKeywordCluster {
  keyword: string;
  category: 'formatting' | 'cover-design' | 'puzzles-low-content' | 'royalties-pricing' | 'troubleshooting' | 'niche-research';
  searchIntent: 'commercial' | 'informational' | 'transactional';
  suggestedType: BlogGenerationType;
  slug: string;
  targetAudience: string;
  recommendedInternalTools: string[]; // e.g. ['formatter', 'cover', 'puzzles', 'royalty']
  essentialFormulasOrData?: string;   // specific facts AI must include
}

export const KDP_KEYWORD_REPOSITORY: KdpKeywordCluster[] = [
  // ── 1. Formatting, Trim Sizes & Interior Typesetting ──
  {
    keyword: 'kdp paperback trim sizes 6x9 guide',
    category: 'formatting',
    searchIntent: 'informational',
    suggestedType: 'ultimate-guide',
    slug: 'kdp-paperback-trim-sizes-6x9-guide',
    targetAudience: 'Self-publishers formatting paperback books on Amazon KDP',
    recommendedInternalTools: ['formatter'],
    essentialFormulasOrData: 'Trim dimensions 6" x 9" (15.24 x 22.86 cm). Margins with bleed: Top 0.25", Bottom 0.25", Outside 0.25". Gutter minimum based on page count: up to 150 pages is 0.375", 151-300 pages is 0.5", 301-500 pages is 0.625".',
  },
  {
    keyword: 'how to calculate kdp spine width',
    category: 'formatting',
    searchIntent: 'informational',
    suggestedType: 'how-to-guide',
    slug: 'how-to-calculate-kdp-spine-width-formula',
    targetAudience: 'Book cover designers and self-publishers',
    recommendedInternalTools: ['cover', 'formatter'],
    essentialFormulasOrData: 'Spine formula for White paper: Page Count × 0.002252 inches (Page Count × 0.0572 mm). Cream paper: Page Count × 0.0025 inches (Page Count × 0.0635 mm). Standard Color: Page Count × 0.002252 inches. Premium Color: Page Count × 0.002347 inches.',
  },
  {
    keyword: 'kdp bleed vs no bleed margins explained',
    category: 'formatting',
    searchIntent: 'informational',
    suggestedType: 'comparison',
    slug: 'kdp-bleed-vs-no-bleed-margins-explained',
    targetAudience: 'Authors experiencing upload rejections due to margin/bleed mismatches',
    recommendedInternalTools: ['formatter'],
    essentialFormulasOrData: 'Bleed requires 0.125" (3.2 mm) added to the top, bottom, and outside edges. A 6x9" book with bleed becomes 6.125" x 9.250" in PDF page size.',
  },
  {
    keyword: 'how to format 8.5 x 11 book for amazon kdp',
    category: 'formatting',
    searchIntent: 'informational',
    suggestedType: 'how-to-guide',
    slug: 'how-to-format-8-5-x-11-book-amazon-kdp',
    targetAudience: 'Workbook, coloring book, and children\'s book creators',
    recommendedInternalTools: ['formatter', 'puzzles'],
    essentialFormulasOrData: 'With bleed: Page size must be 8.625" x 11.25". Minimum gutter margin is 0.375". Text and non-bleed artwork must remain inside the 0.375" minimum safe zone.',
  },
  {
    keyword: 'how to fix kdp margin errors in print previewer',
    category: 'troubleshooting',
    searchIntent: 'informational',
    suggestedType: 'how-to-guide',
    slug: 'how-to-fix-kdp-margin-errors-print-previewer',
    targetAudience: 'Authors getting the red line margin error in Amazon KDP Print Previewer',
    recommendedInternalTools: ['formatter'],
    essentialFormulasOrData: 'Top cause: live elements (page numbers, headers, images) crossing the minimum safe margin line. Solution: gutter adjustment and checking background full bleed extension to trim edge.',
  },
  {
    keyword: 'kdp gutter margin requirements chart',
    category: 'formatting',
    searchIntent: 'informational',
    suggestedType: 'ultimate-guide',
    slug: 'kdp-gutter-margin-requirements-chart',
    targetAudience: 'Publishers typesetting novels, non-fiction, and thick paperbacks',
    recommendedInternalTools: ['formatter'],
    essentialFormulasOrData: 'Amazon official KDP gutter specs: 24-150 pages: 0.375" (9.6 mm); 151-300 pages: 0.500" (12.7 mm); 301-500 pages: 0.625" (15.9 mm); 501-700 pages: 0.750" (19.1 mm); 701-828 pages: 0.875" (22.2 mm).',
  },
  {
    keyword: 'how to create kdp hardcover book formatting guide',
    category: 'formatting',
    searchIntent: 'informational',
    suggestedType: 'tutorial',
    slug: 'how-to-create-kdp-hardcover-book-formatting-guide',
    targetAudience: 'Authors wanting case laminate hardcover editions',
    recommendedInternalTools: ['formatter', 'cover'],
    essentialFormulasOrData: 'Hardcover requires case laminate wrap with 0.563" (14.3 mm) wrap on all 4 sides. Page count minimum is 75 pages, maximum 550 pages.',
  },

  // ── 2. Cover Design, 300 DPI & Barcode Safe Zones ──
  {
    keyword: 'amazon kdp cover dimensions calculator 300 dpi',
    category: 'cover-design',
    searchIntent: 'transactional',
    suggestedType: 'how-to-guide',
    slug: 'amazon-kdp-cover-dimensions-calculator-300-dpi',
    targetAudience: 'Publishers creating print covers in Canva, Photoshop, or KDP Studio',
    recommendedInternalTools: ['cover'],
    essentialFormulasOrData: 'Cover Width = Bleed (0.125") + Back Cover Width + Spine Width + Front Cover Width + Bleed (0.125"). Cover Height = Bleed (0.125") + Trim Height + Bleed (0.125"). Resolution must be exactly 300 DPI with no compression.',
  },
  {
    keyword: 'kdp barcode placement rules and dimensions',
    category: 'cover-design',
    searchIntent: 'informational',
    suggestedType: 'how-to-guide',
    slug: 'kdp-barcode-placement-rules-dimensions',
    targetAudience: 'Self-publishers designing back covers',
    recommendedInternalTools: ['cover'],
    essentialFormulasOrData: 'Amazon default barcode location is bottom right of the back cover, measuring 2" (50.8 mm) wide by 1.2" (30.5 mm) high, located 0.25" from the spine and 0.25" from the bottom trim edge.',
  },
  {
    keyword: 'kdp matte vs glossy book cover which is better',
    category: 'cover-design',
    searchIntent: 'commercial',
    suggestedType: 'comparison',
    slug: 'kdp-matte-vs-glossy-book-cover-comparison',
    targetAudience: 'Authors deciding cover finish for novels vs journals vs children books',
    recommendedInternalTools: ['cover'],
    essentialFormulasOrData: 'Matte: velvet texture, soft aesthetic, ideal for fiction, poetry, memoirs, history. Prone to scuffing and fingerprints. Glossy: shiny protective coating, brings out high-contrast vibrant colors, ideal for children\'s books, cookbooks, workbooks, textbooks.',
  },

  // ── 3. Low-Content, Coloring Books, Puzzles & Activity Books ──
  {
    keyword: 'best coloring book niches for amazon kdp 2026',
    category: 'puzzles-low-content',
    searchIntent: 'commercial',
    suggestedType: 'listicle',
    slug: 'best-coloring-book-niches-amazon-kdp-2026',
    targetAudience: 'Low-content and medium-content KDP creators',
    recommendedInternalTools: ['puzzles', 'research'],
    essentialFormulasOrData: 'High-performing sub-niches: bold & easy cozy hygge coloring, stained glass floral, swear word stress relief for nurses/teachers, mindfulness mandalas for seniors (large print), architectural cityscapes.',
  },
  {
    keyword: 'how to make word search puzzle books for kdp',
    category: 'puzzles-low-content',
    searchIntent: 'informational',
    suggestedType: 'tutorial',
    slug: 'how-to-make-word-search-puzzle-books-kdp',
    targetAudience: 'Puzzle book creators and passive income publishers',
    recommendedInternalTools: ['puzzles', 'formatter'],
    essentialFormulasOrData: 'Standard profitable format: 8.5" x 11", 100-150 pages, 15x15 to 18x18 grid sizes, 20-30 words per puzzle, large print font (16pt+ for seniors), solution keys placed in the back.',
  },
  {
    keyword: 'how to create sudoku books for amazon kdp',
    category: 'puzzles-low-content',
    searchIntent: 'informational',
    suggestedType: 'tutorial',
    slug: 'how-to-create-sudoku-books-amazon-kdp',
    targetAudience: 'Self-publishers building low-content puzzle catalogs',
    recommendedInternalTools: ['puzzles', 'formatter'],
    essentialFormulasOrData: 'Ideal layout: 2 or 4 puzzles per page on 8.5x11" or 6x9", graded difficulties (Easy, Medium, Hard, Extreme), valid single-solution puzzles with answer keys.',
  },
  {
    keyword: 'how to publish a planner on amazon kdp',
    category: 'puzzles-low-content',
    searchIntent: 'informational',
    suggestedType: 'how-to-guide',
    slug: 'how-to-publish-a-planner-on-amazon-kdp',
    targetAudience: 'Entrepreneurs designing daily, weekly, or budget planners',
    recommendedInternalTools: ['formatter', 'cover'],
    essentialFormulasOrData: 'Page counts: 100 to 120 pages for 90-day undated planners (keeps printing cost low at ~$2.15). 8.5x11 or 6x9 trim sizes.',
  },

  // ── 4. Royalties, Pricing & Cost Formulas ──
  {
    keyword: 'amazon kdp royalty calculator formula explained',
    category: 'royalties-pricing',
    searchIntent: 'informational',
    suggestedType: 'ultimate-guide',
    slug: 'amazon-kdp-royalty-calculator-formula-explained',
    targetAudience: 'Self-publishers wanting to calculate actual net profit per copy',
    recommendedInternalTools: ['royalty'],
    essentialFormulasOrData: 'Paperback formula on 60% royalty: Royalty = (List Price × 0.60) - Printing Cost. Printing Cost for B&W paperback (US) = $1.00 fixed cost + (Page Count × $0.012). For example, 150-page book printing cost = $1.00 + (150 × 0.012) = $2.80. If priced at $9.99: ($9.99 × 0.60) - $2.80 = $3.19 profit per sale.',
  },
  {
    keyword: 'kdp 70 vs 35 royalty which should you choose',
    category: 'royalties-pricing',
    searchIntent: 'commercial',
    suggestedType: 'comparison',
    slug: 'kdp-70-vs-35-royalty-ebook-comparison',
    targetAudience: 'Ebook authors setting pricing strategies on Amazon',
    recommendedInternalTools: ['royalty'],
    essentialFormulasOrData: '70% royalty requires price between $2.99 and $9.99 USD, and charges delivery costs ($0.15/MB). 35% royalty has no delivery fee, allows pricing from $0.99 to $200.00, and is best for heavy image files (>10MB).',
  },
  {
    keyword: 'is expanded distribution worth it on kdp',
    category: 'royalties-pricing',
    searchIntent: 'commercial',
    suggestedType: 'comparison',
    slug: 'is-expanded-distribution-worth-it-on-kdp',
    targetAudience: 'Authors considering IngramSpark vs KDP Expanded Distribution',
    recommendedInternalTools: ['royalty'],
    essentialFormulasOrData: 'Expanded Distribution gives 40% royalty instead of 60%: Royalty = (List Price × 0.40) - Printing Cost. Requires higher minimum list price. Distributed to libraries and non-Amazon bookstores like Barnes & Noble.',
  },

  // ── 5. KDP Guidelines, Policies & Keyword Research ──
  {
    keyword: 'amazon kdp 7 backend keywords strategy',
    category: 'niche-research',
    searchIntent: 'informational',
    suggestedType: 'how-to-guide',
    slug: 'amazon-kdp-7-backend-keywords-strategy',
    targetAudience: 'Authors optimizing metadata for Amazon A9/Cosmo search algorithms',
    recommendedInternalTools: ['research'],
    essentialFormulasOrData: 'Amazon allows 7 boxes up to 50 characters each. Rules: Do not repeat words from Title or Subtitle, do not use quotes or punctuation, do not use competitor brand names or ASINs, separate phrases with spaces.',
  },
  {
    keyword: 'kdp title and subtitle rules trademark checklist',
    category: 'troubleshooting',
    searchIntent: 'informational',
    suggestedType: 'ultimate-guide',
    slug: 'kdp-title-and-subtitle-rules-trademark-checklist',
    targetAudience: 'Authors afraid of account termination or book blocking',
    recommendedInternalTools: ['research'],
    essentialFormulasOrData: 'Amazon rules: Title and subtitle must match exactly on cover and interior metadata. No stuffing with search terms (e.g. "Best Sellers", "Free"). No trademarked words (check USPTO TESS database).',
  },
  {
    keyword: 'how to get free isbn for amazon kdp vs bowker',
    category: 'troubleshooting',
    searchIntent: 'informational',
    suggestedType: 'comparison',
    slug: 'free-amazon-kdp-isbn-vs-buying-bowker-isbn',
    targetAudience: 'First-time self-publishers deciding on ISBN ownership',
    recommendedInternalTools: ['formatter'],
    essentialFormulasOrData: 'Free KDP ISBN: Publisher of record is "Independently published", cannot be used on IngramSpark or Barnes & Noble. Custom Bowker ISBN ($125 each or $295 for 10 in US): you are the publisher of record, imprint name of your choice, universal across all distributors.',
  },
];

/**
 * Selects the next unwritten keyword cluster from the repository
 * by filtering out any slugs that already exist in Firestore.
 */
export function getNextUnwrittenKeyword(existingSlugs: string[]): KdpKeywordCluster | null {
  const existingSet = new Set(existingSlugs.map((s) => s.toLowerCase().trim()));

  for (const item of KDP_KEYWORD_REPOSITORY) {
    if (!existingSet.has(item.slug.toLowerCase().trim())) {
      return item;
    }
  }

  // If all are written, return the oldest one for a content refresh / update cycle
  return KDP_KEYWORD_REPOSITORY[0] || null;
}
