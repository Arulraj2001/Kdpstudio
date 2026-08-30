import { MetadataRoute } from 'next';
import { getAdminDb } from '../lib/firebase-admin';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';

  // ── Static public pages ──
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // ── Dynamic Firestore Blog Pages ──
  let blogPages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];
  let authorPages: MetadataRoute.Sitemap = [];

  try {
    const adminDb = getAdminDb();
    if (adminDb) {
      // 1. Published posts
      const snapshot = await adminDb
        .collection('blogPosts')
        .where('status', '==', 'published')
        .get();

      const publishedDocs = snapshot.docs.filter((d) => d.data().noIndex !== true);

      blogPages = publishedDocs.map((doc) => {
        const data = doc.data();
        let lastModDate = new Date();
        if (data.updatedAt) {
          lastModDate = typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : new Date(data.updatedAt);
        } else if (data.publishedAt) {
          lastModDate = typeof data.publishedAt.toDate === 'function' ? data.publishedAt.toDate() : new Date(data.publishedAt);
        }

        return {
          url: `${baseUrl}/blog/${data.slug || doc.id}`,
          lastModified: lastModDate,
          changeFrequency: 'monthly' as const,
          priority: data.priority || 0.7,
        };
      });

      // 2. Category pages
      const categories = [
        ...new Set(
          publishedDocs
            .map((d) => d.data().category)
            .filter(Boolean)
        ),
      ];

      categoryPages = categories.map((cat) => ({
        url: `${baseUrl}/blog/category/${encodeURIComponent(String(cat).toLowerCase().replace(/\s+/g, '-'))}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));

      // 3. Author pages
      const authorsSnap = await adminDb.collection('blogAuthors').get();
      authorPages = authorsSnap.docs.map((doc) => {
        const author = doc.data();
        return {
          url: `${baseUrl}/blog/author/${encodeURIComponent(author.slug || doc.id)}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        };
      });
    }
  } catch (err) {
    console.error('[Sitemap] Generation error querying Firestore:', err);
  }

  return [...staticPages, ...blogPages, ...categoryPages, ...authorPages];
}
