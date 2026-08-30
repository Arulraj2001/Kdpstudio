import { NextRequest, NextResponse } from 'next/server';
import { confirmSubscription } from '../../../../lib/newsletterService';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/blog?error=invalid_token`);
  }

  const result = await confirmSubscription(token);

  if (result === 'confirmed' || result === 'already_confirmed') {
    return NextResponse.redirect(`${baseUrl}/blog?subscribed=true`);
  } else if (result === 'expired') {
    return NextResponse.redirect(`${baseUrl}/blog?error=token_expired`);
  } else {
    return NextResponse.redirect(`${baseUrl}/blog?error=subscription_not_found`);
  }
}
