import { NextRequest, NextResponse } from 'next/server';
import { getNewsletterConfig, saveNewsletterConfig } from '../../../../../../lib/newsletterService';

export async function GET() {
  try {
    const config = await getNewsletterConfig();
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await saveNewsletterConfig(body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
