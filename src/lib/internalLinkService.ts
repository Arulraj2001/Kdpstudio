/**
 * Internal Linking Optimization Engine & Graph Analyzer
 * KDP Studio — Amazon KDP Self-Publishing Suite
 */

import { BlogPost } from '../types/blog';

export interface PostLinkData {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  focusKeyword: string;
  secondaryKeywords: string[];
  wordCount: number;
  publishedAt: Date | string;
  content?: string;
}

export interface InternalLinkSuggestion {
  slug: string;
  title: string;
  relevanceScore: number; // 0 - 100
  suggestedAnchorText: string;
  reason: string;
  alreadyLinked: boolean;
  category?: string;
}

export interface LinkAnalysisResult {
  internalLinks: {
    slug: string;
    anchorText: string;
    isValid: boolean;
    title?: string;
  }[];
  externalLinksCount: number;
  totalInternalLinks: number;
  status: 'too-few' | 'ideal' | 'good' | 'too-many';
  statusColor: string;
  statusLabel: string;
}

export interface PostLinkGraphNode {
  id: string;
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  linksTo: string[]; // outbound internal links (slugs)
  linkedFrom: string[]; // inbound internal links (slugs)
  outboundCount: number;
  inboundCount: number;
  isOrphan: boolean;
  suggestedParentPosts?: {
    slug: string;
    title: string;
    relevance: number;
  }[];
}

// In-Memory Cache (1-hour TTL)
let linkCache: { data: PostLinkData[]; ts: number } | null = null;
const CACHE_TTL_MS = 3600 * 1000;

/**
 * Checks if content already links to a given blog slug
 */
export function checkAlreadyLinked(content: string, slug: string): boolean {
  if (!content || !slug) return false;
  const regex = new RegExp(`href=['"][^'"]*\\/blog\\/${slug}['"]|href=['"]INTERNAL:${slug}['"]`, 'i');
  return regex.test(content);
}

/**
 * Generates natural 2-4 word anchor text from a post title
 */
export function generateSuggestedAnchorText(title: string, focusKeyword?: string): string {
  if (focusKeyword && focusKeyword.trim().length > 0) {
    return focusKeyword.toLowerCase();
  }

  // Clean title: remove numbers, year, brackets, punctuation
  const cleaned = title
    .replace(/^(\d+[\s\.\-]+|how to\s+|the complete guide to\s+)/i, '')
    .replace(/(\(\d{4}\)|\d{4}|guide|tutorial|review|step by step)/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.slice(0, 3).join(' ').toLowerCase();
  }
  return title.slice(0, 30).toLowerCase();
}

/**
 * Evaluates relevance between the active post and a candidate post
 */
export function calculateRelevance(
  currentPost: Partial<BlogPost> & { content?: string },
  candidate: PostLinkData
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  const curCategory = currentPost.category || '';
  const curTags = currentPost.tags || [];
  const curFocus = (currentPost.focusKeyword || '').toLowerCase();
  const curContent = (currentPost.content || '').toLowerCase();
  const curTitle = (currentPost.title || '').toLowerCase();

  const candFocus = (candidate.focusKeyword || '').toLowerCase();
  const candContent = (candidate.content || candidate.excerpt || '').toLowerCase();
  const candTitle = candidate.title.toLowerCase();

  // 1. Category Match (+30)
  if (curCategory && candidate.category && curCategory.toLowerCase() === candidate.category.toLowerCase()) {
    score += 30;
    reasons.push('Same category');
  }

  // 2. Tag Overlap (+5 per shared tag, max 20)
  const candTags = candidate.tags || [];
  const sharedTags = curTags.filter((t) => candTags.some((ct) => ct.toLowerCase() === t.toLowerCase()));
  if (sharedTags.length > 0) {
    const tagPoints = Math.min(20, sharedTags.length * 5);
    score += tagPoints;
    reasons.push(`${sharedTags.length} shared tags`);
  }

  // 3. Keyword Match (+25 if candidate focusKeyword appears in current post)
  if (candFocus && (curContent.includes(candFocus) || curTitle.includes(candFocus))) {
    score += 25;
    reasons.push(`Mentions "${candFocus}"`);
  }

  // 4. Reverse Keyword Match (+20 if current focusKeyword appears in candidate)
  if (curFocus && (candContent.includes(curFocus) || candTitle.includes(curFocus))) {
    score += 20;
    reasons.push(`Targeted in candidate article`);
  }

  // 5. Recent Content (+10 if published in last 90 days)
  const pubTime = new Date(candidate.publishedAt).getTime();
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  if (pubTime > ninetyDaysAgo) {
    score += 10;
    reasons.push('Recent content (<90d)');
  }

  // 6. Long-form Authority Content (+5 if > 1500 words)
  if (candidate.wordCount >= 1500) {
    score += 5;
    reasons.push('In-depth pillar post');
  }

  const finalScore = Math.min(100, Math.max(0, score));
  const reasonText = reasons.length > 0 ? reasons.join(' • ') : 'Related publishing topic';

  return { score: finalScore, reason: reasonText };
}

/**
 * Finds top 10 internal link opportunities for a blog post
 */
export function findInternalLinkOpportunities(
  currentPost: Partial<BlogPost> & { content?: string },
  allPosts: PostLinkData[]
): InternalLinkSuggestion[] {
  const currentSlug = currentPost.slug || '';
  const currentId = currentPost.id || '';
  const content = currentPost.content || '';

  const candidates = allPosts.filter(
    (p) => p.slug !== currentSlug && p.id !== currentId && p.slug
  );

  const scored = candidates.map((cand) => {
    const { score, reason } = calculateRelevance(currentPost, cand);
    const alreadyLinked = checkAlreadyLinked(content, cand.slug);
    const suggestedAnchorText = generateSuggestedAnchorText(cand.title, cand.focusKeyword);

    return {
      slug: cand.slug,
      title: cand.title,
      relevanceScore: score,
      suggestedAnchorText,
      reason,
      alreadyLinked,
      category: cand.category,
    };
  });

  // Sort by relevance score descending (prioritize unlinked first if equal)
  scored.sort((a, b) => {
    if (a.alreadyLinked !== b.alreadyLinked) {
      return a.alreadyLinked ? 1 : -1;
    }
    return b.relevanceScore - a.relevanceScore;
  });

  return scored.slice(0, 10);
}

/**
 * Analyzes internal & external links present in an HTML content string
 */
export function analyzePostLinks(content: string, allPosts: PostLinkData[]): LinkAnalysisResult {
  if (!content) {
    return {
      internalLinks: [],
      externalLinksCount: 0,
      totalInternalLinks: 0,
      status: 'too-few',
      statusColor: 'text-rose-600 bg-rose-50 border-rose-200',
      statusLabel: '0 internal links — Add 2-5 to boost SEO',
    };
  }

  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi;
  const internalLinks: { slug: string; anchorText: string; isValid: boolean; title?: string }[] = [];
  let externalLinksCount = 0;
  let match: RegExpExecArray | null;

  const validSlugsMap = new Map<string, string>();
  allPosts.forEach((p) => {
    if (p.slug) validSlugsMap.set(p.slug.toLowerCase(), p.title);
  });

  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[2] || '';
    const anchorText = match[3].replace(/<[^>]*>?/gm, '').trim();

    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (href.includes('/blog/')) {
        const slugMatch = href.match(/\/blog\/([^#/?]+)/);
        const slug = slugMatch ? slugMatch[1].toLowerCase() : '';
        const title = validSlugsMap.get(slug);
        internalLinks.push({
          slug,
          anchorText,
          isValid: Boolean(title),
          title,
        });
      } else {
        externalLinksCount++;
      }
    } else if (href.startsWith('/blog/') || href.startsWith('INTERNAL:')) {
      const slug = href.replace(/^\/blog\//, '').replace(/^INTERNAL:/, '').split(/[#?]/)[0].toLowerCase();
      const title = validSlugsMap.get(slug);
      internalLinks.push({
        slug,
        anchorText,
        isValid: Boolean(title),
        title,
      });
    }
  }

  const count = internalLinks.length;
  let status: 'too-few' | 'ideal' | 'good' | 'too-many' = 'too-few';
  let statusColor = 'text-rose-600 bg-rose-50 border-rose-200';
  let statusLabel = 'Too few internal links (0-1) — Hurts SEO discovery';

  if (count >= 2 && count <= 5) {
    status = 'ideal';
    statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    statusLabel = `${count} internal links — Ideal SEO range (2-5)`;
  } else if (count > 5 && count <= 10) {
    status = 'good';
    statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
    statusLabel = `${count} internal links — Good link coverage (6-10)`;
  } else if (count > 10) {
    status = 'too-many';
    statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
    statusLabel = `${count} internal links — High volume (monitor for over-optimization)`;
  }

  return {
    internalLinks,
    externalLinksCount,
    totalInternalLinks: count,
    status,
    statusColor,
    statusLabel,
  };
}

/**
 * Builds full link graph and identifies orphan articles
 */
export function buildInternalLinkGraph(allPosts: PostLinkData[]): {
  nodes: PostLinkGraphNode[];
  orphanCount: number;
  wellLinkedCount: number;
  totalPosts: number;
} {
  const nodeMap = new Map<string, PostLinkGraphNode>();

  // 1. Initialize Nodes
  allPosts.forEach((post) => {
    const slug = (post.slug || post.id).toLowerCase();
    nodeMap.set(slug, {
      id: post.id,
      slug,
      title: post.title,
      category: post.category || 'Uncategorized',
      publishedAt: post.publishedAt instanceof Date ? post.publishedAt.toISOString() : String(post.publishedAt || ''),
      linksTo: [],
      linkedFrom: [],
      outboundCount: 0,
      inboundCount: 0,
      isOrphan: true,
    });
  });

  // 2. Map Outbound & Inbound Links
  allPosts.forEach((post) => {
    const fromSlug = (post.slug || post.id).toLowerCase();
    const fromNode = nodeMap.get(fromSlug);
    if (!fromNode || !post.content) return;

    const linkRegex = /href=['"](?:\/blog\/|https?:\/\/[^'"]*\/blog\/|INTERNAL:)([^#'"?]+)['"]/gi;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(post.content)) !== null) {
      const targetSlug = match[1].toLowerCase();
      if (nodeMap.has(targetSlug) && targetSlug !== fromSlug) {
        if (!fromNode.linksTo.includes(targetSlug)) {
          fromNode.linksTo.push(targetSlug);
        }
        const targetNode = nodeMap.get(targetSlug);
        if (targetNode && !targetNode.linkedFrom.includes(fromSlug)) {
          targetNode.linkedFrom.push(fromSlug);
        }
      }
    }
  });

  // 3. Compute Metrics and Suggest Linking Opportunities for Orphans
  const nodes = Array.from(nodeMap.values());
  let orphanCount = 0;
  let wellLinkedCount = 0;

  nodes.forEach((node) => {
    node.outboundCount = node.linksTo.length;
    node.inboundCount = node.linkedFrom.length;
    node.isOrphan = node.inboundCount === 0;

    if (node.isOrphan) {
      orphanCount++;

      // Find top 3 published candidate posts that SHOULD link to this orphan
      const orphanPostData = allPosts.find((p) => (p.slug || p.id).toLowerCase() === node.slug);
      if (orphanPostData) {
        const potentialParents = allPosts
          .filter((p) => (p.slug || p.id).toLowerCase() !== node.slug)
          .map((candidate) => {
            const { score } = calculateRelevance(orphanPostData, candidate);
            return {
              slug: candidate.slug,
              title: candidate.title,
              relevance: score,
            };
          })
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 3);

        node.suggestedParentPosts = potentialParents;
      }
    }

    if (node.inboundCount >= 3) {
      wellLinkedCount++;
    }
  });

  return {
    nodes,
    orphanCount,
    wellLinkedCount,
    totalPosts: nodes.length,
  };
}
