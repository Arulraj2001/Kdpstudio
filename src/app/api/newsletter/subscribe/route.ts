import { NextRequest, NextResponse } from 'next/server';
import { subscribeToNewsletter } from '../../../../lib/newsletterService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, source = 'blog-footer', tags = [] } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const res = await subscribeToNewsletter(email, name || null, source, tags);
    return NextResponse.json({ success: true, ...res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Subscription failed' }, { status: 400 });
  }
}
