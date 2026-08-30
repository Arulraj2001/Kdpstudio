import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe } from '../../../../lib/newsletterService';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email') || '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';

  if (!email) {
    return NextResponse.redirect(`${baseUrl}/blog?unsubscribed=false`);
  }

  await unsubscribe(email);
  return NextResponse.redirect(`${baseUrl}/blog?unsubscribed=true`);
}
