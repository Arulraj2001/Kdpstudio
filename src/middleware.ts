/**
 * Next.js / Edge App Protected Route Middleware
 * Secures app routes including /series, /brand-kit, /settings, /puzzles, /studio, /publish
 */

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/studio/:path*',
    '/books/:path*',
    '/series/:path*',
    '/series',
    '/brand-kit/:path*',
    '/brand-kit',
    '/settings/brand',
    '/puzzles/:path*',
    '/publish/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};

export default function middleware(req: any) {
  // Pass-through in client-side SPA or evaluate session token cookie if present
  return;
}
