/**
 * AI Blog Post Draft & Outline Generation Engine
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

import {
  BlogGenerationRequest,
  BlogGenerationResult,
  BlogOutlineItem,
  BlogGenerationType,
  BlogFaqItem,
  BlogPost,
} from '../types/blog';
import { callGemini } from './gemini';
import { calculateSeoScore } from './seoScorer';
import { countWords, calculateReadingTime, generateSlug } from './blogUtils';
import {
  scanAiCliches,
  humanizeContent,
  calculateBurstiness,
  HumanizerScanResult,
  BurstinessResult,
} from './seo/humanizerRules';

export interface QualityGateResult {
  passed: boolean;
  score: number;
  wordCount: number;
  clicheScan: HumanizerScanResult;
  burstiness: BurstinessResult;
  gateFailures: string[];
}

/**
 * Validates generated content against strict deterministic quality gates
 */
export function validatePostQuality(
  post: Partial<BlogPost> & { content: string },
  options: { minWordCount?: number; maxClicheCount?: number; minSeoScore?: number } = {}
): QualityGateResult {
  const minWords = options.minWordCount ?? 1800;
  const maxCliches = options.maxClicheCount ?? 0;
  const minScore = options.minSeoScore ?? 85;

  const gateFailures: string[] = [];
  const content = post.content || '';
  const wordCount = countWords(content);

  // Gate 1: Word Count
  if (wordCount < minWords) {
    gateFailures.push(`Word count too low (${wordCount} words; required minimum is ${minWords})`);
  }

  // Gate 2: Heading Hierarchy
  const h2Count = (content.match(/<h2[\s>]/gi) || []).length;
  const h3Count = (content.match(/<h3[\s>]/gi) || []).length;
  if (h2Count < 5) {
    gateFailures.push(`Insufficient H2 headings (${h2Count} found; required minimum is 5)`);
  }
  if (h3Count < 2) {
    gateFailures.push(`Insufficient H3 subheadings (${h3Count} found; required minimum is 2)`);
  }

  // Gate 3: Structural Elements (Tables & Lists)
  const hasTable = /<table[\s>]/gi.test(content);
  if (!hasTable) {
    gateFailures.push('Missing comparison or data table (<table> tag is required)');
  }

  // Gate 4: FAQ Check
  const faqCount = (post.faqItems || []).length;
  if (faqCount < 3) {
    gateFailures.push(`Insufficient FAQ items (${faqCount} found; required minimum is 3)`);
  }

  // Gate 5: AI Cliche Scan
  const clicheScan = scanAiCliches(content);
  if (clicheScan.totalViolations > maxCliches) {
    const phrases = clicheScan.violations.map((v) => `"${v.phrase}" (${v.count}x)`).join(', ');
    gateFailures.push(`Contains banned AI filler phrases: ${phrases}`);
  }

  // Gate 6: Burstiness
  const burstiness = calculateBurstiness(content);

  // Gate 7: SEO Score
  const seoResult = calculateSeoScore(post);
  if (seoResult.score < minScore) {
    gateFailures.push(`SEO score below threshold (${seoResult.score}/100; required minimum is ${minScore})`);
  }

  return {
    passed: gateFailures.length === 0,
    score: seoResult.score,
    wordCount,
    clicheScan,
    burstiness,
    gateFailures,
  };
}

/**
 * Suggests 5 SEO-optimized keyword ideas for a given seed topic
 */
export async function generateKeywordSuggestions(seed: string): Promise<string[]> {
  const prompt = `Suggest exactly 5 high-intent, SEO-optimized search keywords for Amazon KDP self-publishers related to "${seed}".
Return ONLY a JSON array of 5 strings. No markdown, no commentary. Example: ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"]`;

  try {
    const raw = await callGemini(prompt, 'You are an Amazon KDP keyword research specialist. Output valid JSON only.');
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 5).map((k: string) => String(k).trim());
    }
  } catch (err) {
    console.warn('[AiBlogGenerator] Keyword suggestion fallback:', err);
  }

  return [
    `${seed} kdp guide`,
    `how to publish ${seed}`,
    `best ${seed} niches 2026`,
    `${seed} formatting tips`,
    `${seed} royalties on amazon`,
  ];
}

/**
 * Generates a structured blog post outline
 */
export async function generateBlogOutline(
  keyword: string,
  postType: BlogGenerationType,
  targetWordCount: number = 2000,
  audience: string = 'Amazon KDP self-publishers'
): Promise<BlogOutlineItem[]> {
  const prompt = `Create a comprehensive, high-ranking outline for a ${postType} blog post targeting the focus keyword "${keyword}".
Target audience: ${audience}
Target word count: ${targetWordCount} words

Return ONLY a JSON array of outline section objects with this exact structure:
[
  {
    "level": 2,
    "heading": "Heading title",
    "summary": "1 sentence describing what is taught or analyzed in this section",
    "estimatedWords": 250
  }
]
Include 6-9 major H2 sections, subheadings where appropriate, a comparison data table, and troubleshooting. Output pure JSON only.`;

  try {
    const raw = await callGemini(prompt, 'You are an SEO content architect. Return valid JSON only.');
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[AiBlogGenerator] Outline fallback:', err);
  }

  return [
    { level: 2, heading: `Quick Summary: What You Need to Know About ${keyword}`, summary: `Direct 40-word definition and quick-reference answer for AI overviews and readers.`, estimatedWords: 200 },
    { level: 2, heading: `Understanding the Mechanics & Industry Standards`, summary: `Detailed breakdown of Amazon KDP specifications, file requirements, and rules.`, estimatedWords: 350 },
    { level: 2, heading: `Step-by-Step Implementation Guide`, summary: `Concrete walkthrough detailing exact numbers, formulas, measurements, and actions.`, estimatedWords: 550 },
    { level: 2, heading: `Comparison & Decision Matrix`, summary: `Data-rich comparison table evaluating options, pricing, and trim considerations.`, estimatedWords: 300 },
    { level: 2, heading: `Common Amazon Rejection Mistakes to Avoid`, summary: `Key KDP print previewer traps, margin errors, and policy violations.`, estimatedWords: 350 },
    { level: 2, heading: `Frequently Asked Questions`, summary: `Direct answers to top publisher queries.`, estimatedWords: 250 },
    { level: 2, heading: `Final Checklist & Publishing Next Steps`, summary: `Actionable wrap-up and tool recommendations to finish the book.`, estimatedWords: 200 },
  ];
}

/**
 * Generates complete full-length blog post draft with HTML content and structured SEO metadata
 */
export async function generateFullBlogPost(
  request: BlogGenerationRequest,
  existingPosts: { title: string; slug: string }[] = []
): Promise<BlogGenerationResult> {
  const {
    keyword,
    secondaryKeywords = [],
    postType,
    targetWordCount = 2000,
    tone = 'conversational',
    audience = 'Amazon KDP self-publishers',
    outline,
  } = request;

  // ── Step 1: Generate Full HTML Content with Strict Humanizer Rules ──
  const systemPrompt = `You are an elite Amazon KDP publishing authority and veteran book designer.
You write in-depth, humanized guides that rank #1 on Google and satisfy Google's Helpful Content System (E-E-A-T).

STRICT NEGATIVE CONSTRAINTS (ZERO TOLERANCE FOR AI CLICHES):
- NEVER use the following words or phrases: "delve", "delve into", "tapestry", "testament", "landscape", "crucial", "paramount", "beacon", "unlock", "unlocking", "revolutionary", "game-changer", "seamless", "bespoke", "embark", "vibrant", "foster", "plethora", "in conclusion", "in today's fast-paced world", "in today's digital era", "furthermore", "moreover", "shed light on", "it is important to remember".
- If you use any of these words, the post will be rejected by our quality gate.

HUMAN VOICE, PACING & BURSTINESS RULES:
- Write in direct, engaging second-person voice ("When you upload your 150-page book...", "Here is the exact margin formula Amazon uses...").
- Vary sentence length dramatically: pair punchy 3-to-5 word statements with technical 20-word explanations. Avoid monotonous rhythm.
- Talk like a seasoned publisher who understands real Amazon friction: mention KDP Print Previewer red lines, bleed cutoff errors, 72-hour review windows, and exact printing fees.

CONTENT STRUCTURE REQUIREMENTS:
1. GEO QUICK-ANSWER BOX: Directly under the first H2, include a bolded callout block (<blockquote class="quick-summary"><strong>Quick Answer:</strong> [Direct 40-word definitive answer]</blockquote>) so Google AI Overviews and Perplexity quote this page as the canonical source.
2. CONCRETE NUMBERS & FORMULAS: Include exact numbers (e.g. 0.375" margins, 0.002252" spine width multiplier, 300 DPI, $1.00 fixed printing fee, 60% royalty rates).
3. DATA TABLE: Must include at least ONE detailed comparison table using <table>, <thead>, <tbody>, <tr>, <th>, and <td>.
4. INTERNAL CONVERSION LINKS: Naturally recommend KDP Studio's tools (e.g., <a href='/studio'>KDP Studio Formatter</a>, <a href='/cover'>Cover Designer</a>, <a href='/puzzles'>Puzzle Generator</a>, or <a href='/pricing'>Pricing</a>).

OUTPUT FORMAT RULES:
- Return ONLY valid clean HTML tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <a href='...'>
- Do NOT output <html>, <head>, <body>, or <h1> tags.
- Do NOT output markdown code fences. Pure HTML only.`;

  const existingPostsContext = existingPosts.length > 0
    ? `Existing blog posts you can reference as internal links:\n${existingPosts.map((p) => `- "${p.title}": use link format <a href='INTERNAL:${p.slug}'>link text</a>`).join('\n')}`
    : '';

  const userPrompt = `Write a comprehensive ${postType} blog post targeting the focus keyword "${keyword}".

Specifications:
- Target word count: ~${targetWordCount} words (be thorough, detailed, and complete)
- Tone: ${tone}, authoritative yet conversational
- Target audience: ${audience}
- Focus Keyword: "${keyword}" (use naturally in the first 100 words, across 3-5 subheadings, and in body text)
- Secondary keywords to naturally integrate: ${secondaryKeywords.join(', ') || 'None'}
${outline ? `\nFollow this outline structure:\n${outline}` : ''}
${existingPostsContext ? `\n${existingPostsContext}` : ''}

Write the full, deep HTML article now:`;

  const rawHtml = await callGemini(userPrompt, systemPrompt);
  let cleanHtml = rawHtml.replace(/```html/gi, '').replace(/```/g, '').trim();

  // Run the Humanizer auto-sanitizer to catch and clean any accidental slip-ups
  const humanized = humanizeContent(cleanHtml);
  cleanHtml = humanized.cleanedHtml;

  // ── Step 2: Generate Structured SEO Metadata & Rich FAQs ──
  const metadataSystemPrompt = `You generate structured SEO metadata and rich FAQs for Google search. Return ONLY valid JSON with no code fences.`;

  const metadataPrompt = `Generate SEO metadata and FAQ schema items for this Amazon KDP blog post about "${keyword}":

Post Type: ${postType}
Focus Keyword: ${keyword}
First 400 words:
${cleanHtml.replace(/<[^>]*>?/gm, ' ').slice(0, 1000)}

Return this exact JSON structure:
{
  "title": "Engaging SEO Title (50-60 chars, focus keyword frontloaded)",
  "metaTitle": "SEO Title | KDP Studio (under 60 chars)",
  "metaDescription": "Compelling meta description (140-160 chars) with focus keyword and user benefit",
  "slug": "clean-url-slug",
  "excerpt": "1-2 sentence compelling summary (120-150 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedSources": [
    { "title": "Amazon KDP Quality Guidelines", "url": "https://kdp.amazon.com/en_US/help/topic/G200645680" }
  ],
  "faqItems": [
    { "question": "Clear High-Search-Volume Question 1?", "answer": "Concise, definitive 2-sentence answer." },
    { "question": "Clear High-Search-Volume Question 2?", "answer": "Concise, definitive 2-sentence answer." },
    { "question": "Clear High-Search-Volume Question 3?", "answer": "Concise, definitive 2-sentence answer." },
    { "question": "Clear High-Search-Volume Question 4?", "answer": "Concise, definitive 2-sentence answer." }
  ],
  "howToSteps": []
}`;

  let metadata: any = {};
  try {
    const rawMeta = await callGemini(metadataPrompt, metadataSystemPrompt);
    const cleanMeta = rawMeta.replace(/```json/gi, '').replace(/```/g, '').trim();
    metadata = JSON.parse(cleanMeta);
  } catch (err) {
    console.warn('[AiBlogGenerator] Metadata JSON parsing fallback:', err);
    metadata = {
      title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Amazon KDP Guide`,
      metaTitle: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} | KDP Studio`,
      metaDescription: `Master ${keyword} with step-by-step formatting rules, real Amazon KDP formulas, and practical self-publishing tips.`,
      slug: generateSlug(keyword),
      excerpt: `Complete publisher guide to ${keyword} with exact measurements, royalty calculations, and formatting rules.`,
      tags: ['Amazon KDP', 'Self-Publishing', 'Book Formatting', 'KDP Strategy'],
      suggestedSources: [{ title: 'Amazon KDP Guidelines', url: 'https://kdp.amazon.com' }],
      faqItems: [
        { question: `What is the standard rule for ${keyword}?`, answer: `Standard Amazon KDP guidelines require strict adherence to safe margin boundaries, 300 DPI resolution, and bleed specifications.` },
        { question: `How does ${keyword} affect printing costs?`, answer: `Printing costs on Amazon KDP are determined by page count, interior ink type (black and white vs color), and trim dimensions.` },
        { question: `Can you publish on KDP for free?`, answer: `Yes, creating and uploading paperback, hardcover, and Kindle ebook editions on Amazon KDP is completely free.` }
      ],
      howToSteps: [],
    };
  }

  // ── Step 3: Extract Internal Link Suggestions ──
  const internalLinkRegex = /href=['"]INTERNAL:([^'"]+)['"]/g;
  const internalLinkSuggestions: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = internalLinkRegex.exec(cleanHtml)) !== null) {
    if (match[1] && !internalLinkSuggestions.includes(match[1])) {
      internalLinkSuggestions.push(match[1]);
    }
  }

  const wordCount = countWords(cleanHtml);
  const estimatedReadingTime = calculateReadingTime(cleanHtml);

  // ── Step 4: Calculate Pre-computed SEO Score ──
  const dummyPost = {
    title: metadata.title || keyword,
    metaTitle: metadata.metaTitle || metadata.title,
    metaDescription: metadata.metaDescription,
    focusKeyword: keyword,
    secondaryKeywords,
    slug: metadata.slug || generateSlug(keyword),
    content: cleanHtml,
    wordCount,
    faqItems: metadata.faqItems || [],
    sources: metadata.suggestedSources || [],
  };

  const seoResult = calculateSeoScore(dummyPost);

  return {
    title: metadata.title || keyword,
    metaTitle: metadata.metaTitle || metadata.title,
    metaDescription: metadata.metaDescription || '',
    slug: metadata.slug || generateSlug(keyword),
    excerpt: metadata.excerpt || '',
    content: cleanHtml,
    outline: outline ? [] : await generateBlogOutline(keyword, postType, targetWordCount, audience),
    focusKeyword: keyword,
    secondaryKeywords,
    tags: Array.isArray(metadata.tags) ? metadata.tags : ['KDP Publishing', 'Book Strategy'],
    faqItems: Array.isArray(metadata.faqItems) ? metadata.faqItems : [],
    howToSteps: Array.isArray(metadata.howToSteps) ? metadata.howToSteps : [],
    suggestedSources: Array.isArray(metadata.suggestedSources) ? metadata.suggestedSources : [],
    internalLinkSuggestions,
    estimatedReadingTime,
    wordCount,
    seoScore: seoResult.score,
  };
}

/**
 * Inline AI Editor Action Helper
 */
export async function executeAiEditorAction(
  action: 'rewrite' | 'statistics' | 'shorten' | 'expand' | 'factcheck',
  selectedText: string
): Promise<string> {
  let prompt = '';
  if (action === 'rewrite') {
    prompt = `Rewrite this section for an Amazon KDP self-publishing article. Maintain all facts and meaning while enhancing clarity and flow:\n\n"${selectedText}"`;
  } else if (action === 'statistics') {
    prompt = `Add relevant, realistic Amazon KDP publishing statistics, royalty percentages, or industry benchmarks to this text:\n\n"${selectedText}"`;
  } else if (action === 'shorten') {
    prompt = `Make this section punchy, concise, and scannable without losing key insights:\n\n"${selectedText}"`;
  } else if (action === 'expand') {
    prompt = `Expand this section with actionable steps, practical examples, and formatting recommendations for KDP authors:\n\n"${selectedText}"`;
  } else if (action === 'factcheck') {
    prompt = `Review this Amazon KDP text for factual accuracy regarding royalties, page counts, margins, or publishing rules. If there are inaccuracies, provide a corrected explanation:\n\n"${selectedText}"`;
  }

  const response = await callGemini(prompt, 'You are an Amazon KDP publishing expert and professional editor.');
  return response.trim();
}
