import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../lib/firebase-admin';
import { escapeXml } from '../../../lib/xmlUtils';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';
  let posts: any[] = [];

  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      const snap = await adminDb
        .collection('blogPosts')
        .where('status', '==', 'published')
        .get();

      posts = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((p) => {
          if (p.noIndex === true) return false;
          return Boolean(p.featuredImage?.url || p.coverImage);
        });
    }
  } catch (err) {
    console.error('[Image Sitemap] Error querying Firestore:', err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${posts
    .map((post) => {
      const imgUrl = post.featuredImage?.url || post.coverImage;
      const imgAlt = post.featuredImage?.alt || post.title;

      return `
  <url>
    <loc>${baseUrl}/blog/${post.slug || post.id}</loc>
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:caption>${escapeXml(imgAlt)}</image:caption>
      <image:title>${escapeXml(post.title)}</image:title>
    </image:image>
  </url>`;
    })
    .join('')}
</urlset>`.trim();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
