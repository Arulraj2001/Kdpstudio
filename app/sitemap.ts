import { SEED_BLOG_POSTS } from '../src/lib/blog';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';

  const staticPages = [
    { 
      url: `${baseUrl}/`, 
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0 
    },
    { 
      url: `${baseUrl}/pricing`, 
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9 
    },
    { 
      url: `${baseUrl}/about`, 
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7 
    },
    { 
      url: `${baseUrl}/contact`, 
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5 
    },
    { 
      url: `${baseUrl}/blog`, 
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8 
    },
    ...SEED_BLOG_POSTS.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    { 
      url: `${baseUrl}/changelog`, 
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6 
    },
  ];

  return staticPages;
}
