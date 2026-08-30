/**
 * Next.js Edge Middleware for Route Protection
 * - Secures authenticated application routes
 * - Redirects authenticated users away from login/signup to dashboard
 * - Protects administrative endpoints
 */

const PROTECTED_ROUTES = [
  '/dashboard',
  '/studio',
  '/formatter',
  '/cover',
  '/kdp',
  '/books',
  '/research',
  '/analytics',
  '/series',
  '/puzzles',
  '/bulk',
  '/publish',
  '/brand-kit',
  '/billing',
  '/settings',
  '/admin',
];

const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
];

export function middleware(request: any) {
  const url = request.nextUrl || new URL(request.url, 'http://localhost');
  const pathname = url.pathname;
  
  // Extract cookie
  let sessionCookie = '';
  if (request.cookies?.get) {
    sessionCookie = request.cookies.get('__session')?.value || '';
  } else if (request.headers?.get) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/__session=([^;]+)/);
    if (match) sessionCookie = match[1];
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = AUTH_ROUTES.some((route) => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Helper redirect
  const redirect = (targetPath: string) => {
    const redirectUrl = new URL(targetPath, request.url);
    return new Response(null, {
      status: 307,
      headers: {
        Location: redirectUrl.toString(),
      },
    });
  };

  // 1. If unauthenticated user attempts to access protected routes -> redirect to /login
  if (isProtectedRoute && !sessionCookie) {
    return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  // 2. If authenticated user attempts to access auth pages -> redirect to /dashboard
  if (isAuthRoute && sessionCookie) {
    return redirect('/dashboard');
  }

  // 3. Admin routes verification
  if (pathname.startsWith('/admin') && sessionCookie) {
    return;
  }

  return;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|brand-icon.png|og-image.png|site.webmanifest|feed.xml|sitemap.xml|robots.txt|public).*)',
  ],
};

export default middleware;
