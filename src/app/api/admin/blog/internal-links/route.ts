import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '../../../../../lib/firebase-admin';
import {
  findInternalLinkOpportunities,
  analyzePostLinks,
  buildInternalLinkGraph,
  PostLinkData,
} from '../../../../../lib/internalLinkService';

// Module-level in-memory cache for serverless invocation
let cachedPosts: { data: PostLinkData[]; ts: number } | null = null;

async function getCachedPostLinkData(): Promise<PostLinkData[]> {
  if (cachedPosts && Date.now() - cachedPosts.ts < 3600000) {
    return cachedPosts.data;
  }

  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const snap = await adminDb
    .collection('blogPosts')
    .where('status', '==', 'published')
    .get();

  const posts: PostLinkData[] = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      slug: d.slug || doc.id,
      title: d.title || 'Untitled',
      excerpt: d.excerpt || d.metaDescription || '',
      category: d.category || 'Publishing Strategy',
      tags: Array.isArray(d.tags) ? d.tags : [],
      focusKeyword: d.focusKeyword || '',
      secondaryKeywords: Array.isArray(d.secondaryKeywords) ? d.secondaryKeywords : [],
      wordCount: d.wordCount || 0,
      publishedAt: d.publishedAt?.toDate ? d.publishedAt.toDate() : new Date(d.publishedAt || Date.now()),
      content: d.content || '',
    };
  });

  cachedPosts = { data: posts, ts: Date.now() };
  return posts;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode');

    const posts = await getCachedPostLinkData();

    if (mode === 'graph') {
      const graph = buildInternalLinkGraph(posts);
      return NextResponse.json({ success: true, ...graph });
    }

    return NextResponse.json({ success: true, posts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal link query failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      currentPostId = '',
      slug = '',
      content = '',
      title = '',
      category = '',
      tags = [],
      focusKeyword = '',
    } = body;

    const allPosts = await getCachedPostLinkData();

    const opportunities = findInternalLinkOpportunities(
      {
        id: currentPostId,
        slug,
        title,
        category,
        tags,
        focusKeyword,
        content,
      },
      allPosts
    );

    const analysis = analyzePostLinks(content, allPosts);

    return NextResponse.json({
      success: true,
      suggestions: opportunities,
      analysis,
    });
  } catch (err: any) {
    console.error('[Internal Links API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to analyze internal links' }, { status: 500 });
  }
}
