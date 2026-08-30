import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '../../../../../lib/firebase-admin';
import {
  generateKeywordSuggestions,
  generateBlogOutline,
  generateFullBlogPost,
  executeAiEditorAction,
} from '../../../../../lib/aiBlogGenerator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'generate';

    // Action 1: Keyword suggestions
    if (action === 'keywords') {
      const seed = body.seed || 'kdp publishing';
      const suggestions = await generateKeywordSuggestions(seed);
      return NextResponse.json({ success: true, suggestions });
    }

    // Action 2: Outline generation
    if (action === 'outline') {
      const { keyword, postType, targetWordCount, audience } = body;
      if (!keyword) {
        return NextResponse.json({ error: 'Focus keyword is required' }, { status: 400 });
      }
      const outline = await generateBlogOutline(
        keyword,
        postType || 'how-to-guide',
        targetWordCount || 1800,
        audience || 'Amazon KDP self-publishers'
      );
      return NextResponse.json({ success: true, outline });
    }

    // Action 3: Inline Editor Action (rewrite, statistics, shorten, expand, factcheck)
    if (action === 'inline-action') {
      const { inlineType, selectedText } = body;
      if (!selectedText) {
        return NextResponse.json({ error: 'Selected text is required' }, { status: 400 });
      }
      const result = await executeAiEditorAction(inlineType || 'rewrite', selectedText);
      return NextResponse.json({ success: true, result });
    }

    // Action 4: Full Blog Generation
    const {
      keyword,
      secondaryKeywords = [],
      postType = 'how-to-guide',
      targetWordCount = 1800,
      tone = 'authoritative',
      audience = 'Amazon KDP self-publishers',
      outline,
    } = body;

    if (!keyword) {
      return NextResponse.json({ error: 'Focus keyword is required' }, { status: 400 });
    }

    // Fetch existing posts for internal link opportunities
    let existingPosts: { title: string; slug: string }[] = [];
    try {
      const adminDb = getAdminDb();
      if (adminDb) {
        const snap = await adminDb
          .collection('blogPosts')
          .where('status', '==', 'published')
          .select('title', 'slug')
          .limit(20)
          .get();
        existingPosts = snap.docs.map((d) => ({
          title: d.data().title || '',
          slug: d.data().slug || d.id,
        }));
      }
    } catch {}

    const result = await generateFullBlogPost(
      {
        keyword,
        secondaryKeywords,
        postType,
        targetWordCount,
        tone,
        audience,
        outline,
      },
      existingPosts
    );

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('[AI Blog Generate API] Error:', err);
    return NextResponse.json(
      { error: err.message || 'AI blog generation failed' },
      { status: 500 }
    );
  }
}
