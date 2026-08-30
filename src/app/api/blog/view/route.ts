import { NextRequest, NextResponse } from 'next/server';
import { incrementViewCount } from '../../../../lib/blogService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { postId } = body;

    if (!postId || typeof postId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid postId' },
        { status: 400 }
      );
    }

    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : realIp) || 'unknown';

    const counted = await incrementViewCount(postId, clientIp);

    return NextResponse.json({
      success: true,
      counted,
      postId,
    });
  } catch (err: any) {
    console.error('[API /api/blog/view] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to record view' },
      { status: 500 }
    );
  }
}
