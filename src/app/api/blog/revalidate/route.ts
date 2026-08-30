import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const secret = authHeader.replace(/^Bearer\s+/i, '').trim();
    const expectedSecret = process.env.REVALIDATE_SECRET || 'kdp-studio-revalidate-2026';

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid revalidation token' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { slug, revalidateAll } = body;

    if (slug) {
      revalidatePath(`/blog/${slug}`);
      revalidatePath('/blog');
      revalidatePath('/sitemap.xml');
    }

    if (revalidateAll) {
      revalidatePath('/blog', 'layout');
      revalidatePath('/sitemap.xml');
    }

    return NextResponse.json({
      revalidated: true,
      slug: slug || null,
      revalidateAll: Boolean(revalidateAll),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API /api/blog/revalidate] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to revalidate blog route' },
      { status: 500 }
    );
  }
}
