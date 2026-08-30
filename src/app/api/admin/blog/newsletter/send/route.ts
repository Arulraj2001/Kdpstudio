import { NextRequest, NextResponse } from 'next/server';
import { sendNewsletterForPost, getConfirmedSubscribers } from '../../../../../../lib/newsletterService';
import { getAdminDb } from '../../../../../../lib/firebase-admin';
import { resend, EMAIL_FROM, APP_URL } from '../../../../../../lib/resend';

export async function POST(req: NextRequest) {
  try {
    const { postId, target = 'all', testEmail } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    if (target === 'admin-test') {
      const recipient = testEmail || process.env.ADMIN_EMAIL || 'admin@kdpstudio.com';
      const adminDb = getAdminDb();
      if (!adminDb) return NextResponse.json({ error: 'No database' }, { status: 500 });

      const postDoc = await adminDb.collection('blogPosts').doc(postId).get();
      if (!postDoc.exists) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

      const post = postDoc.data() as any;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || APP_URL || 'https://kdpstudio-aio.web.app';

      await resend.emails.send({
        from: EMAIL_FROM,
        to: recipient,
        subject: `[TEST NEWSLETTER] ${post.title}`,
        html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="background: #fdf4ff; color: #7c3aed; padding: 4px 10px; font-weight: bold; display: inline-block; border-radius: 6px; font-size: 12px; margin-bottom: 12px;">
            ${post.category || 'Publishing'} (TEST CAMPAIGN)
          </div>
          <h1 style="color: #0f172a; font-size: 22px;">${post.title}</h1>
          <p style="color: #475569; line-height: 24px;">${post.excerpt || post.metaDescription || ''}</p>
          <a href="${baseUrl}/blog/${post.slug || postId}" style="background: #7c3aed; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 16px;">
            Read Full Post →
          </a>
        </div>
        `,
      });

      return NextResponse.json({ success: true, sentCount: 1, message: `Test email sent to ${recipient}` });
    }

    const sentCount = await sendNewsletterForPost(postId);
    return NextResponse.json({ success: true, sentCount });
  } catch (err: any) {
    console.error('[Newsletter Send API] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed sending campaign' }, { status: 500 });
  }
}
