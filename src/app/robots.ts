import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kdpstudio-aio.web.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/studio',
          '/formatter',
          '/cover',
          '/kdp',
          '/books',
          '/series',
          '/puzzles',
          '/bulk',
          '/research',
          '/analytics',
          '/settings',
          '/admin',
          '/onboarding',
          '/api/',
        ],
      },
      {
        userAgent: 'Googlebot-News',
        allow: '/blog/',
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap-index.xml`,
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/news-sitemap.xml`,
      `${baseUrl}/image-sitemap.xml`,
      `${baseUrl}/feed.xml`,
    ],
  };
}
