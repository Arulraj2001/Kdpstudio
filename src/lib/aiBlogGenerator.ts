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
} from '../types/blog';
import { callGemini } from './gemini';
import { calculateSeoScore } from './seoScorer';
import { countWords, calculateReadingTime, generateSlug } from './blogUtils';

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
  targetWordCount: number = 1800,
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
Include 5-8 major H2 sections and optional H3 subheadings where appropriate. Output pure JSON only.`;

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
    { level: 2, heading: `Introduction to ${keyword}`, summary: `Hook the reader and explain why ${keyword} matters for KDP publishers.`, estimatedWords: 200 },
    { level: 2, heading: `Understanding the Market Opportunity`, summary: `Analyze customer demand, BSR trends, and profit margins.`, estimatedWords: 350 },
    { level: 2, heading: `Step-by-Step Implementation Framework`, summary: `Actionable tutorial detailing interior creation, cover design, and formatting.`, estimatedWords: 500 },
    { level: 2, heading: `Common Mistakes to Avoid on Amazon`, summary: `Key KDP policy traps, trademark checks, and formatting errors.`, estimatedWords: 300 },
    { level: 2, heading: `Frequently Asked Questions`, summary: `Answers to the top publishing questions.`, estimatedWords: 250 },
    { level: 2, heading: `Conclusion & Next Steps`, summary: `Summary of key takeaways with a call-to-action to scale publishing.`, estimatedWords: 200 },
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
    targetWordCount = 1800,
    tone = 'authoritative',
    audience = 'Amazon KDP self-publishers',
    outline,
  } = request;

  // ── Step 1: Generate Full HTML Content ──
  const systemPrompt = `You are a world-class SEO content writer specializing in Amazon KDP self-publishing.
You write blog posts that rank #1 on Google, follow strict EEAT guidelines, and convert readers into loyal users.

Writing standards:
- Naturally use the focus keyword "${keyword}" 3-5 times across the post.
- Incorporate secondary keywords (${secondaryKeywords.join(', ')}) naturally.
- Write with an ${tone} tone for ${audience}.
- Use clear H2 and H3 headings.
- Include specific data points, estimated royalties, BSR numbers, and real KDP publishing tips.
- Mark suggested internal links as <a href='INTERNAL:{slug}'>anchor text</a> where relevant to existing posts.

Output rules:
- Return ONLY clean HTML tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <a href='...'>
- Do NOT output <html>, <head>, <body>, or <h1> tags.
- Do NOT output markdown code fences. Pure HTML only.`;

  const existingPostsContext = existingPosts.length > 0
    ? `Existing posts you can reference as internal links:\n${existingPosts.map((p) => `- "${p.title}": use link format <a href='INTERNAL:${p.slug}'>link text</a>`).join('\n')}`
    : '';

  const userPrompt = `Write a comprehensive ${postType} blog post targeting the focus keyword "${keyword}".

Specs:
- Target word count: ~${targetWordCount} words
- Tone: ${tone}
- Target audience: ${audience}
- Secondary keywords: ${secondaryKeywords.join(', ') || 'None specified'}
${outline ? `\nFollow this custom outline:\n${outline}` : ''}
${existingPostsContext ? `\n${existingPostsContext}` : ''}

Write the full HTML article now:`;

  const rawHtml = await callGemini(userPrompt, systemPrompt);
  const cleanHtml = rawHtml.replace(/```html/gi, '').replace(/```/g, '').trim();

  // ── Step 2: Generate SEO Metadata & FAQs ──
  const metadataSystemPrompt = `You generate structured SEO metadata for blog posts. Return ONLY valid JSON with no code fences and no explanations.`;

  const metadataPrompt = `Generate SEO metadata for this blog post about "${keyword}":

Post Type: ${postType}
Focus Keyword: ${keyword}
First 300 words of content:
${cleanHtml.replace(/<[^>]*>?/gm, ' ').slice(0, 800)}

Return this exact JSON structure:
{
  "title": "Engaging SEO Title (50-60 chars, focus keyword early)",
  "metaTitle": "SEO Meta Title (under 60 chars)",
  "metaDescription": "Compelling meta description (140-160 chars) with focus keyword and benefit",
  "slug": "clean-url-slug",
  "excerpt": "1-2 sentence compelling summary (120-150 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedSources": [
    { "title": "Amazon KDP Quality Guidelines", "url": "https://kdp.amazon.com/en_US/help/topic/G200645680" }
  ],
  "faqItems": [
    { "question": "Relevant Question 1?", "answer": "Clear 2-sentence answer." },
    { "question": "Relevant Question 2?", "answer": "Clear 2-sentence answer." },
    { "question": "Relevant Question 3?", "answer": "Clear 2-sentence answer." }
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
      title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide for KDP Publishers`,
      metaTitle: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Guide | KDP Studio`,
      metaDescription: `Discover the ultimate guide to ${keyword} on Amazon KDP. Step-by-step formatting tips, niche research, and royalty strategies.`,
      slug: generateSlug(keyword),
      excerpt: `Learn proven strategies for ${keyword} to increase book royalties on Amazon KDP.`,
      tags: ['Amazon KDP', 'Self-Publishing', 'Book Publishing', 'KDP Strategy'],
      suggestedSources: [{ title: 'Amazon KDP Guidelines', url: 'https://kdp.amazon.com' }],
      faqItems: [
        { question: `How much can you make with ${keyword}?`, answer: `Earnings depend on niche demand and volume, with successful publishers generating $500 to $5,000+ monthly.` },
        { question: `Is publishing on KDP free?`, answer: `Yes, self-publishing paperback, hardcover, and ebook interiors on Amazon KDP is completely free.` },
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
