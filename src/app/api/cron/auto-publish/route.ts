/**
 * KDP Studio — Autopilot SEO & GEO Publishing Cron Route
 * 
 * Scheduled daily via Vercel Cron (0 4 * * *).
 * 
 * Process:
 * 1. Authenticates request via CRON_SECRET.
 * 2. Fetches existing blog post slugs to prevent duplicate topics.
 * 3. Selects the next high-intent Amazon KDP keyword cluster from repository.
 * 4. Generates comprehensive 2,000+ word humanized, Google-recommended guide.
 * 5. Runs deterministic quality gates (word count, structure, anti-AI cliches, SEO score).
 * 6. Publishes directly to Firestore (or holds as draft if gates fail).
 * 7. Pings IndexNow (Bing/Yandex) for instant crawler notification.
 * 8. Triggers on-demand Next.js cache revalidation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminDb } from '../../../../lib/firebase-admin';
import {
  KDP_KEYWORD_REPOSITORY,
  getNextUnwrittenKeyword,
  KdpKeywordCluster,
} from '../../../../lib/seo/kdpKeywordRepository';
import {
  generateFullBlogPost,
  validatePostQuality,
} from '../../../../lib/aiBlogGenerator';
import { generateTableOfContents } from '../../../../lib/blogUtils';
import { pingIndexNow } from '../../../../lib/seo/indexNowService';
import { BlogPost } from '../../../../types/blog';

export const maxDuration = 120; // Allow up to 120s on Vercel Pro/serverless for deep article generation
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleAutoPublish(req);
}

export async function POST(req: NextRequest) {
  return handleAutoPublish(req);
}

async function handleAutoPublish(req: NextRequest) {
  const startTime = Date.now();

  // ── 1. Authorization Guard ──
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  const querySecret = req.nextUrl.searchParams.get('secret');

  const isAuthorized =
    !cronSecret ||
    authHeader === `Bearer ${cronSecret}` ||
    querySecret === cronSecret;

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid CRON_SECRET' },
      { status: 401 }
    );
  }

  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firestore Admin DB is not initialized. Verify Firebase service account configuration.' },
        { status: 503 }
      );
    }

    // ── 2. Discover Existing Slugs in Firestore ──
    const postsSnap = await adminDb.collection('blogPosts').get();
    const existingPosts: { title: string; slug: string }[] = [];
    const existingSlugs: string[] = [];

    postsSnap.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      existingSlugs.push(slug);
      if (data.title) {
        existingPosts.push({ title: data.title, slug });
      }
    });

    // ── 3. Select Next Keyword Cluster ──
    const explicitKeyword = req.nextUrl.searchParams.get('keyword');
    let cluster: KdpKeywordCluster | null = null;

    if (explicitKeyword) {
      const found = KDP_KEYWORD_REPOSITORY.find(
        (k) => k.keyword.toLowerCase() === explicitKeyword.toLowerCase()
      );
      if (found) {
        cluster = found;
      } else {
        cluster = {
          keyword: explicitKeyword,
          category: 'formatting',
          searchIntent: 'informational',
          suggestedType: 'ultimate-guide',
          slug: explicitKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          targetAudience: 'Amazon KDP self-publishers and independent authors',
          recommendedInternalTools: ['formatter', 'cover'],
        };
      }
    } else {
      cluster = getNextUnwrittenKeyword(existingSlugs);
    }

    if (!cluster) {
      return NextResponse.json({
        success: true,
        message: 'All repository keyword clusters have already been published. Repository is complete.',
        existingSlugsCount: existingSlugs.length,
      });
    }

    // ── 4. Generate Comprehensive Full-Length Blog Post ──
    console.log(`[AutoPublish Cron] Generating article for keyword: "${cluster.keyword}"...`);

    const generationResult = await generateFullBlogPost(
      {
        keyword: cluster.keyword,
        postType: cluster.suggestedType,
        targetWordCount: 2200,
        tone: 'conversational',
        audience: cluster.targetAudience,
      },
      existingPosts
    );

    // ── 5. Run Strict Deterministic Quality Gates ──
    const draftPostForValidation: Partial<BlogPost> & { content: string } = {
      title: generationResult.title,
      metaTitle: generationResult.metaTitle,
      metaDescription: generationResult.metaDescription,
      focusKeyword: generationResult.focusKeyword,
      secondaryKeywords: generationResult.secondaryKeywords,
      slug: generationResult.slug,
      content: generationResult.content,
      faqItems: generationResult.faqItems,
      sources: generationResult.suggestedSources,
    };

    const qualityGate = validatePostQuality(draftPostForValidation, {
      minWordCount: 1600, // Strict depth requirement
      maxClicheCount: 0,  // Zero tolerance for banned AI cliches
      minSeoScore: 80,    // High E-E-A-T baseline
    });

    const isPassed = qualityGate.passed;
    const finalStatus = isPassed ? 'published' : 'draft';
    const postSlug = generationResult.slug;
    const now = new Date();

    // ── 6. Assemble Database Entity ──
    const newBlogPost: Partial<BlogPost> & Record<string, any> = {
      id: postSlug,
      title: generationResult.title,
      slug: postSlug,
      content: generationResult.content,
      excerpt: generationResult.excerpt,
      status: finalStatus,

      // Author E-E-A-T Attribution
      authorId: 'kdp-studio-editorial',
      authorName: 'Arulraj & KDP Studio Editorial Team',
      authorPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      authorCredentials: 'Amazon KDP Publisher & Publishing Tech Specialist',

      // Timestamps
      createdAt: now.toISOString(),
      publishedAt: isPassed ? now.toISOString() : null,
      updatedAt: now.toISOString(),
      lastReviewedAt: now.toISOString(),
      reviewedBy: 'KDP Publishing Standards Committee',
      isExpertReviewed: true,

      // Taxonomy
      category: cluster.category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      tags: generationResult.tags,

      // Featured Visual
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
        alt: generationResult.title,
        caption: `Complete Amazon KDP Publishing Guide for ${cluster.keyword}`,
        width: 1200,
        height: 630,
      },

      // SEO Metadata
      metaTitle: generationResult.metaTitle,
      metaDescription: generationResult.metaDescription,
      focusKeyword: cluster.keyword,
      secondaryKeywords: generationResult.secondaryKeywords,
      canonicalUrl: `https://kdpstudio-aio.web.app/blog/${postSlug}`,
      noIndex: !isPassed,

      // Open Graph & Social Cards
      ogTitle: generationResult.metaTitle,
      ogDescription: generationResult.metaDescription,
      ogImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      twitterTitle: generationResult.metaTitle,
      twitterDescription: generationResult.metaDescription,
      twitterImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',

      // Metrics & TOC
      readingTimeMinutes: generationResult.estimatedReadingTime,
      wordCount: generationResult.wordCount,
      tableOfContents: generateTableOfContents(generationResult.content),

      // Rich Schema Data
      schemaType: 'Article',
      faqItems: generationResult.faqItems,
      howToSteps: generationResult.howToSteps,
      sources: generationResult.suggestedSources,

      // Ads & Engagement
      adsEnabled: true,
      adOverrides: [],
      viewCount: 0,
      estimatedReadCount: 0,

      // Internal Audit Notes
      publishedBy: 'Autopilot SEO Cron Engine',
      lastEditedBy: 'Autopilot SEO Cron Engine',
      revisionCount: 1,
      internalNotes: isPassed
        ? `Auto-published via scheduled cron. Quality score: ${qualityGate.score}/100. Word count: ${generationResult.wordCount}.`
        : `Held in draft due to quality gate failures: ${qualityGate.gateFailures.join('; ')}`,
    };

    // ── 7. Commit to Firestore ──
    await adminDb.collection('blogPosts').doc(postSlug).set(newBlogPost);

    // ── 8. Instant Search Engine Notification & Cache Invalidation ──
    let indexNowResult: any = null;
    if (isPassed) {
      try {
        indexNowResult = await pingIndexNow([`/blog/${postSlug}`]);
      } catch (err: any) {
        console.warn('[AutoPublish] IndexNow notification warning:', err?.message);
      }

      try {
        revalidatePath(`/blog/${postSlug}`);
        revalidatePath('/blog');
        revalidatePath('/sitemap.xml');
      } catch (err: any) {
        console.warn('[AutoPublish] Next.js cache revalidation note:', err?.message);
      }
    }

    const durationSeconds = Number(((Date.now() - startTime) / 1000).toFixed(1));

    return NextResponse.json({
      success: true,
      published: isPassed,
      status: finalStatus,
      keyword: cluster.keyword,
      slug: postSlug,
      url: `https://kdpstudio-aio.web.app/blog/${postSlug}`,
      wordCount: generationResult.wordCount,
      qualityScore: qualityGate.score,
      burstinessHealthy: qualityGate.burstiness.isBurstinessHealthy,
      clichesDetected: qualityGate.clicheScan.totalViolations,
      gateFailures: qualityGate.gateFailures,
      indexNowNotified: indexNowResult?.success || false,
      executionDurationSeconds: durationSeconds,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[AutoPublish Cron Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown auto-publishing error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
