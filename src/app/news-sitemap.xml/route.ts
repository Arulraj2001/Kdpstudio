import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../lib/firebase-admin';
import { escapeXml } from '../../../lib/xmlUtils';

export const revalidate = 1800;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

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
          const pubDate = p.publishedAt
            ? typeof p.publishedAt.toDate === 'function'
              ? p.publishedAt.toDate()
              : new Date(p.publishedAt)
            : null;
          return pubDate && pubDate >= twoDaysAgo;
        })
        .slice(0, 1000);
    }
  } catch (err) {
    console.error('[News Sitemap] Error querying Firestore:', err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${posts
    .map((post) => {
      const pubDate = post.publishedAt
        ? typeof post.publishedAt.toDate === 'function'
          ? post.publishedAt.toDate()
          : new Date(post.publishedAt)
        : new Date();
      const keywords = [post.focusKeyword, ...(post.secondaryKeywords || [])]
        .filter(Boolean)
        .join(', ');

      const imgUrl = post.featuredImage?.url || post.coverImage;
      const imgAlt = post.featuredImage?.alt || post.title;

      return `
  <url>
    <loc>${baseUrl}/blog/${post.slug || post.id}</loc>
    <news:news>
      <news:publication>
        <news:name>KDP Studio Blog</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate.toISOString()}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
      <news:keywords>${escapeXml(keywords)}</news:keywords>
    </news:news>
    ${
      imgUrl
        ? `
    <image:image>
      <image:loc>${escapeXml(imgUrl)}</image:loc>
      <image:caption>${escapeXml(imgAlt)}</image:caption>
    </image:image>`
        : ''
    }
  </url>`;
    })
    .join('')}
</urlset>`.trim();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
