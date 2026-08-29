export default function robots() {
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
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
