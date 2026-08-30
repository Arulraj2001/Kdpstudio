/**
 * Live SEO & EEAT Content Scoring Engine
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

import { BlogPost } from '../types/blog';

export interface SeoCheck {
  id: string;
  category: 'keyword' | 'meta' | 'content' | 'eeat' | 'technical';
  label: string;
  status: 'pass' | 'fail' | 'warning';
  points: number;
  maxPoints: number;
  hint: string;
  currentValue?: string | number;
}

export interface SeoScoreResult {
  score: number;
  grade: 'excellent' | 'good' | 'needs-work' | 'poor';
  gradeColor: string;
  checks: SeoCheck[];
  keywordDensity: number;
  wordCount: number;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

export function calculateSeoScore(post: Partial<BlogPost>): SeoScoreResult {
  const checks: SeoCheck[] = [];
  const content = post.content || '';
  const plainText = stripHtml(content);
  const words = plainText ? plainText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const focusKeyword = (post.focusKeyword || '').trim().toLowerCase();
  const title = (post.title || '').trim();
  const metaTitle = (post.metaTitle || title).trim();
  const metaDesc = (post.metaDescription || post.excerpt || '').trim();
  const slug = (post.slug || '').trim();

  // ─────────────────────────────────────────
  // 1. Focus Keyword Checks (30 Points Total)
  // ─────────────────────────────────────────

  // Check 1: Keyword is set (5 pts)
  if (focusKeyword) {
    checks.push({
      id: 'kw-set',
      category: 'keyword',
      label: 'Focus keyword defined',
      status: 'pass',
      points: 5,
      maxPoints: 5,
      hint: `Targeting "${focusKeyword}"`,
    });
  } else {
    checks.push({
      id: 'kw-set',
      category: 'keyword',
      label: 'Focus keyword defined',
      status: 'fail',
      points: 0,
      maxPoints: 5,
      hint: 'Define a primary target search keyword for this post',
    });
  }

  // Check 2: Keyword in Title (8 pts)
  if (focusKeyword && title.toLowerCase().includes(focusKeyword)) {
    checks.push({
      id: 'kw-title',
      category: 'keyword',
      label: 'Keyword in title',
      status: 'pass',
      points: 8,
      maxPoints: 8,
      hint: 'Focus keyword appears prominently in the post title',
    });
  } else {
    checks.push({
      id: 'kw-title',
      category: 'keyword',
      label: 'Keyword in title',
      status: 'fail',
      points: 0,
      maxPoints: 8,
      hint: focusKeyword ? 'Include your exact focus keyword in the title' : 'Set a focus keyword first',
    });
  }

  // Check 3: Keyword in Meta Description (5 pts)
  if (focusKeyword && metaDesc.toLowerCase().includes(focusKeyword)) {
    checks.push({
      id: 'kw-meta-desc',
      category: 'keyword',
      label: 'Keyword in meta description',
      status: 'pass',
      points: 5,
      maxPoints: 5,
      hint: 'Focus keyword is present in the search snippet meta description',
    });
  } else {
    checks.push({
      id: 'kw-meta-desc',
      category: 'keyword',
      label: 'Keyword in meta description',
      status: 'fail',
      points: 0,
      maxPoints: 5,
      hint: 'Add your focus keyword to the meta description for higher search CTR',
    });
  }

  // Check 4: Keyword in First Paragraph (5 pts)
  const firstParagraphMatch = /<p[^>]*>(.*?)<\/p>/i.exec(content);
  const firstParagraphText = firstParagraphMatch ? stripHtml(firstParagraphMatch[1]).toLowerCase() : plainText.slice(0, 300).toLowerCase();
  if (focusKeyword && firstParagraphText.includes(focusKeyword)) {
    checks.push({
      id: 'kw-first-para',
      category: 'keyword',
      label: 'Keyword in first paragraph',
      status: 'pass',
      points: 5,
      maxPoints: 5,
      hint: 'Focus keyword appears early in the introduction',
    });
  } else {
    checks.push({
      id: 'kw-first-para',
      category: 'keyword',
      label: 'Keyword in first paragraph',
      status: 'warning',
      points: 0,
      maxPoints: 5,
      hint: 'Include your focus keyword within the first 100 words of content',
    });
  }

  // Check 5: Keyword in H2 Subheadings (4 pts)
  const h2Matches = Array.from(content.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)).map((m) => stripHtml(m[1]).toLowerCase());
  const hasKwInH2 = focusKeyword ? h2Matches.some((h2) => h2.includes(focusKeyword)) : false;
  if (hasKwInH2) {
    checks.push({
      id: 'kw-h2',
      category: 'keyword',
      label: 'Keyword in H2 subheadings',
      status: 'pass',
      points: 4,
      maxPoints: 4,
      hint: 'Focus keyword found in major section subheadings',
    });
  } else {
    checks.push({
      id: 'kw-h2',
      category: 'keyword',
      label: 'Keyword in H2 subheadings',
      status: h2Matches.length > 0 ? 'warning' : 'fail',
      points: 0,
      maxPoints: 4,
      hint: 'Include the focus keyword in at least one H2 section header',
    });
  }

  // Check 6: Keyword Density 0.5% – 2.5% (3 pts)
  let kwCount = 0;
  let keywordDensity = 0;
  if (focusKeyword && wordCount > 0) {
    const kwRegex = new RegExp(`\\b${focusKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = plainText.match(kwRegex);
    kwCount = matches ? matches.length : 0;
    keywordDensity = Math.round((kwCount / wordCount) * 1000) / 10; // e.g. 1.4%
  }

  if (focusKeyword && keywordDensity >= 0.5 && keywordDensity <= 2.5) {
    checks.push({
      id: 'kw-density',
      category: 'keyword',
      label: `Keyword density (${keywordDensity}%)`,
      status: 'pass',
      points: 3,
      maxPoints: 3,
      hint: `Optimal density (${kwCount} occurrences in ${wordCount} words)`,
      currentValue: `${keywordDensity}%`,
    });
  } else if (focusKeyword && keywordDensity > 2.5) {
    checks.push({
      id: 'kw-density',
      category: 'keyword',
      label: `Keyword density (${keywordDensity}%)`,
      status: 'warning',
      points: 1,
      maxPoints: 3,
      hint: 'Keyword density is high (>2.5%). Avoid keyword stuffing penalty.',
      currentValue: `${keywordDensity}%`,
    });
  } else {
    checks.push({
      id: 'kw-density',
      category: 'keyword',
      label: `Keyword density (${keywordDensity}%)`,
      status: 'warning',
      points: 0,
      maxPoints: 3,
      hint: 'Aim for 0.5%–2.5% keyword density throughout your article',
      currentValue: `${keywordDensity}%`,
    });
  }

  // ─────────────────────────────────────────
  // 2. Meta Tags Checks (20 Points Total)
  // ─────────────────────────────────────────

  // Check 7: Meta Title 50–60 chars (8 pts)
  const metaTitleLen = metaTitle.length;
  if (metaTitleLen >= 50 && metaTitleLen <= 60) {
    checks.push({
      id: 'meta-title-len',
      category: 'meta',
      label: `Meta title length (${metaTitleLen}/60 chars)`,
      status: 'pass',
      points: 8,
      maxPoints: 8,
      hint: 'Optimal title length for Google SERP displays',
      currentValue: `${metaTitleLen} chars`,
    });
  } else if (metaTitleLen >= 40 && metaTitleLen <= 70) {
    checks.push({
      id: 'meta-title-len',
      category: 'meta',
      label: `Meta title length (${metaTitleLen}/60 chars)`,
      status: 'warning',
      points: 5,
      maxPoints: 8,
      hint: metaTitleLen < 50 ? 'Add a few more characters (aim for 50-60)' : 'Shorten slightly to prevent truncation in Google',
      currentValue: `${metaTitleLen} chars`,
    });
  } else {
    checks.push({
      id: 'meta-title-len',
      category: 'meta',
      label: `Meta title length (${metaTitleLen}/60 chars)`,
      status: 'fail',
      points: 0,
      maxPoints: 8,
      hint: 'Meta title should be between 50 and 60 characters for best CTR',
      currentValue: `${metaTitleLen} chars`,
    });
  }

  // Check 8: Meta Description 140–160 chars (8 pts)
  const metaDescLen = metaDesc.length;
  if (metaDescLen >= 140 && metaDescLen <= 160) {
    checks.push({
      id: 'meta-desc-len',
      category: 'meta',
      label: `Meta description length (${metaDescLen}/160 chars)`,
      status: 'pass',
      points: 8,
      maxPoints: 8,
      hint: 'Perfect length for full search snippet display',
      currentValue: `${metaDescLen} chars`,
    });
  } else if (metaDescLen >= 120 && metaDescLen <= 175) {
    checks.push({
      id: 'meta-desc-len',
      category: 'meta',
      label: `Meta description length (${metaDescLen}/160 chars)`,
      status: 'warning',
      points: 5,
      maxPoints: 8,
      hint: 'Aim for 140–160 characters for complete search preview',
      currentValue: `${metaDescLen} chars`,
    });
  } else {
    checks.push({
      id: 'meta-desc-len',
      category: 'meta',
      label: `Meta description length (${metaDescLen}/160 chars)`,
      status: 'fail',
      points: 0,
      maxPoints: 8,
      hint: 'Write a compelling summary between 140 and 160 characters',
      currentValue: `${metaDescLen} chars`,
    });
  }

  // Check 9: Featured Image Alt Text (4 pts)
  const hasAlt = Boolean(post.featuredImage?.alt && post.featuredImage.alt.trim().length > 3);
  if (hasAlt) {
    checks.push({
      id: 'featured-img-alt',
      category: 'meta',
      label: 'Featured image alt text',
      status: 'pass',
      points: 4,
      maxPoints: 4,
      hint: 'Descriptive alt text configured for accessibility & image SEO',
    });
  } else {
    checks.push({
      id: 'featured-img-alt',
      category: 'meta',
      label: 'Featured image alt text',
      status: 'fail',
      points: 0,
      maxPoints: 4,
      hint: 'Add descriptive alt text to your featured image',
    });
  }

  // ─────────────────────────────────────────
  // 3. Content Quality Checks (25 Points Total)
  // ─────────────────────────────────────────

  // Check 10: Word count >= 800 (8 pts)
  if (wordCount >= 800) {
    checks.push({
      id: 'word-count-800',
      category: 'content',
      label: `Word count (${wordCount} words)`,
      status: 'pass',
      points: 8,
      maxPoints: 8,
      hint: 'Substantial depth that avoids thin content penalties',
      currentValue: `${wordCount} words`,
    });
  } else {
    checks.push({
      id: 'word-count-800',
      category: 'content',
      label: `Word count (${wordCount} words)`,
      status: 'fail',
      points: Math.min(6, Math.floor((wordCount / 800) * 8)),
      maxPoints: 8,
      hint: 'Aim for at least 800 words of comprehensive publishing advice',
      currentValue: `${wordCount} words`,
    });
  }

  // Check 11: Word count >= 1500 (5 bonus pts)
  if (wordCount >= 1500) {
    checks.push({
      id: 'word-count-1500',
      category: 'content',
      label: 'Long-form comprehensive guide (1500+ words)',
      status: 'pass',
      points: 5,
      maxPoints: 5,
      hint: 'Exemplary long-form content favored by Google rankings',
    });
  } else {
    checks.push({
      id: 'word-count-1500',
      category: 'content',
      label: 'Long-form comprehensive guide (1500+ words)',
      status: 'warning',
      points: 0,
      maxPoints: 5,
      hint: 'Comprehensive guides (1500+ words) rank higher for competitive keywords',
    });
  }

  // Check 12: At least 2 H2 Headings (5 pts)
  if (h2Matches.length >= 2) {
    checks.push({
      id: 'h2-count',
      category: 'content',
      label: `H2 subheadings (${h2Matches.length} sections)`,
      status: 'pass',
      points: 5,
      maxPoints: 5,
      hint: 'Well-structured with clear topic sections',
    });
  } else {
    checks.push({
      id: 'h2-count',
      category: 'content',
      label: `H2 subheadings (${h2Matches.length} sections)`,
      status: 'fail',
      points: 0,
      maxPoints: 5,
      hint: 'Add at least 2 H2 headings to divide content into scannable blocks',
    });
  }

  // Check 13: Internal content structure / TOC (4 pts)
  const hasTocOrH3 = h2Matches.length >= 2 && (post.tableOfContents?.length || 0) >= 2;
  if (hasTocOrH3) {
    checks.push({
      id: 'toc-structure',
      category: 'content',
      label: 'Table of contents structure',
      status: 'pass',
      points: 4,
      maxPoints: 4,
      hint: 'Structured hierarchy enables quick reader navigation',
    });
  } else {
    checks.push({
      id: 'toc-structure',
      category: 'content',
      label: 'Table of contents structure',
      status: 'warning',
      points: 0,
      maxPoints: 4,
      hint: 'Add clear H2 & H3 headings so a Table of Contents can be generated',
    });
  }

  // Check 14: Outbound links in content (3 pts)
  const hasOutboundLinks = /<a\s+[^>]*href=["']https?:\/\/(?!kdpstudio)[^"']+["']/i.test(content);
  if (hasOutboundLinks) {
    checks.push({
      id: 'outbound-links',
      category: 'content',
      label: 'Outbound reference links',
      status: 'pass',
      points: 3,
      maxPoints: 3,
      hint: 'Includes authoritative external citations and resources',
    });
  } else {
    checks.push({
      id: 'outbound-links',
      category: 'content',
      label: 'Outbound reference links',
      status: 'warning',
      points: 0,
      maxPoints: 3,
      hint: 'Add 1–2 outbound links to authoritative publishing or Amazon resources',
    });
  }

  // ─────────────────────────────────────────
  // 4. EEAT Signals (15 Points Total)
  // ─────────────────────────────────────────

  // Check 15: Author Assigned (5 pts)
  const hasAuthor = Boolean(post.authorName || post.authorId);
  if (hasAuthor) {
    checks.push({
      id: 'author-assigned',
      category: 'eeat',
      label: `Author attributed (${post.authorName || 'Assigned'})`,
      status: 'pass',
      points: 5,
      maxPoints: 5,
      hint: 'Establishes authorship credentials for Google EEAT evaluation',
    });
  } else {
    checks.push({
      id: 'author-assigned',
      category: 'eeat',
      label: 'Author attributed',
      status: 'fail',
      points: 0,
      maxPoints: 5,
      hint: 'Assign a named author with verified publishing experience',
    });
  }

  // Check 16: Sources / References Added (5 pts)
  const sourcesCount = post.sources?.length || 0;
  if (sourcesCount >= 1) {
    checks.push({
      id: 'sources-cited',
      category: 'eeat',
      label: `Citations & sources (${sourcesCount} references)`,
      status: 'pass',
      points: 5,
      maxPoints: 5,
      hint: 'Verified facts backed up by cited industry sources',
    });
  } else {
    checks.push({
      id: 'sources-cited',
      category: 'eeat',
      label: 'Citations & sources',
      status: 'warning',
      points: 0,
      maxPoints: 5,
      hint: 'Add at least 1 verified source or Amazon documentation link to boost trustworthiness',
    });
  }

  // Check 17: Expert Reviewed (5 pts)
  if (post.isExpertReviewed) {
    checks.push({
      id: 'expert-reviewed',
      category: 'eeat',
      label: `Expert reviewed (${post.reviewedBy || 'Verified Expert'})`,
      status: 'pass',
      points: 5,
      maxPoints: 5,
      hint: 'Expert badge builds strong reader confidence and search quality rating',
    });
  } else {
    checks.push({
      id: 'expert-reviewed',
      category: 'eeat',
      label: 'Expert reviewed badge',
      status: 'warning',
      points: 0,
      maxPoints: 5,
      hint: 'Mark as expert-reviewed by an editor or senior KDP publisher',
    });
  }

  // ─────────────────────────────────────────
  // 5. Technical Checks (10 Points Total)
  // ─────────────────────────────────────────

  // Check 18: Slug URL-friendly (3 pts)
  const isSlugValid = Boolean(slug && /^[a-z0-9-]+$/.test(slug));
  if (isSlugValid) {
    checks.push({
      id: 'slug-valid',
      category: 'technical',
      label: 'Clean URL slug',
      status: 'pass',
      points: 3,
      maxPoints: 3,
      hint: 'Short, clean, lowercase hyphenated URL structure',
    });
  } else {
    checks.push({
      id: 'slug-valid',
      category: 'technical',
      label: 'Clean URL slug',
      status: 'fail',
      points: 0,
      maxPoints: 3,
      hint: 'Ensure slug contains only lowercase letters, numbers, and hyphens',
    });
  }

  // Check 19: Slug Length <= 75 chars (2 pts)
  if (slug && slug.length <= 75) {
    checks.push({
      id: 'slug-len',
      category: 'technical',
      label: `Slug length (${slug.length}/75 chars)`,
      status: 'pass',
      points: 2,
      maxPoints: 2,
      hint: 'Concise URL slug easy to share and index',
    });
  } else {
    checks.push({
      id: 'slug-len',
      category: 'technical',
      label: `Slug length (${slug.length}/75 chars)`,
      status: 'warning',
      points: 0,
      maxPoints: 2,
      hint: 'Keep slug under 75 characters for cleaner URL indexing',
    });
  }

  // Check 20: Featured image set (3 pts)
  if (post.featuredImage?.url) {
    checks.push({
      id: 'featured-img-set',
      category: 'technical',
      label: 'Featured image configured',
      status: 'pass',
      points: 3,
      maxPoints: 3,
      hint: 'Eye-catching social & Google Discover featured visual',
    });
  } else {
    checks.push({
      id: 'featured-img-set',
      category: 'technical',
      label: 'Featured image configured',
      status: 'fail',
      points: 0,
      maxPoints: 3,
      hint: 'Set a high-resolution 1200×630 featured image',
    });
  }

  // Check 21: Schema type selected (2 pts)
  if (post.schemaType) {
    checks.push({
      id: 'schema-type',
      category: 'technical',
      label: `Schema markup (${post.schemaType})`,
      status: 'pass',
      points: 2,
      maxPoints: 2,
      hint: 'Structured data rich snippet generator active',
    });
  } else {
    checks.push({
      id: 'schema-type',
      category: 'technical',
      label: 'Schema markup',
      status: 'fail',
      points: 0,
      maxPoints: 2,
      hint: 'Select a schema type (Article, HowTo, FAQPage)',
    });
  }

  // ─────────────────────────────────────────
  // Total Score & Grade Calculation
  // ─────────────────────────────────────────
  const score = Math.min(100, Math.max(0, checks.reduce((acc, c) => acc + c.points, 0)));

  let grade: 'excellent' | 'good' | 'needs-work' | 'poor' = 'poor';
  let gradeColor = '#ef4444'; // Red

  if (score >= 80) {
    grade = 'excellent';
    gradeColor = '#10b981'; // Green
  } else if (score >= 60) {
    grade = 'good';
    gradeColor = '#3b82f6'; // Blue
  } else if (score >= 40) {
    grade = 'needs-work';
    gradeColor = '#f59e0b'; // Amber
  }

  return {
    score,
    grade,
    gradeColor,
    checks,
    keywordDensity,
    wordCount,
  };
}
