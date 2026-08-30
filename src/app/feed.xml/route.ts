import { NextResponse } from 'next/server';
import { getAdminDb } from '../../../lib/firebase-admin';
import { escapeXml, cdata } from '../../../lib/xmlUtils';

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
        .filter((p) => p.noIndex !== true)
        .sort((a, b) => {
          const timeA = new Date(a.publishedAt || 0).getTime();
          const timeB = new Date(b.publishedAt || 0).getTime();
          return timeB - timeA;
        })
        .slice(0, 20);
    }
  } catch (err) {
    console.error('[RSS Feed] Error querying Firestore:', err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://www.rssboard.org/media-rss">
  <channel>
    <title>KDP Studio Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Publishing strategies, guides and tips for Amazon KDP self-publishers</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/icons/icon-512x512.png</url>
      <title>KDP Studio Blog</title>
      <link>${baseUrl}/blog</link>
    </image>
    ${posts
      .map((post) => {
        const pubDate = post.publishedAt
          ? typeof post.publishedAt.toDate === 'function'
            ? post.publishedAt.toDate()
            : new Date(post.publishedAt)
          : new Date();

        const imgUrl = post.featuredImage?.url || post.coverImage;
        const imgAlt = post.featuredImage?.alt || post.title;
        const tags = Array.isArray(post.tags) ? post.tags : [];

        return `
    <item>
      <title>${cdata(post.title)}</title>
      <link>${baseUrl}/blog/${post.slug || post.id}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug || post.id}</guid>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <dc:creator>${cdata(post.authorName || 'KDP Studio Team')}</dc:creator>
      <category>${cdata(post.category || 'Publishing Strategy')}</category>
      ${tags.map((tag: string) => `<category>${cdata(tag)}</category>`).join('')}
      <description>${cdata(post.excerpt || post.metaDescription || '')}</description>
      <content:encoded>${cdata(post.content || '')}</content:encoded>
      ${
        imgUrl
          ? `
      <media:content 
        url="${escapeXml(imgUrl)}" 
        medium="image"
        width="1200"
        height="630">
        <media:alt>${escapeXml(imgAlt)}</media:alt>
      </media:content>`
          : ''
      }
    </item>`;
      })
      .join('')}
  </channel>
</rss>`.trim();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
