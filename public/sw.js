const CACHE_NAME = 'kdp-studio-v2';
const STATIC_CACHE_NAME = 'kdp-static-v2';
const FONT_CACHE_NAME = 'kdp-fonts-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/brand-icon.png',
  '/brand-logo.svg',
  '/logo.png',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Non-blocking cache prefetch error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean old caches and claim all open client tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![CACHE_NAME, STATIC_CACHE_NAME, FONT_CACHE_NAME].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. CRITICAL: NetworkOnly for all API routes, Auth, and non-GET requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/login') ||
    url.pathname.includes('/signup') ||
    url.pathname.includes('/auth') ||
    request.method !== 'GET'
  ) {
    return; // Standard network fetch
  }

  // 2. Google Fonts: StaleWhileRevalidate for CSS, CacheFirst for Woff2 webfonts
  if (url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            cache.put(request, clone).catch(() => {});
          }
          return networkResponse;
        }).catch(() => cachedResponse);
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  if (url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            cache.put(request, clone).catch(() => {});
          }
          return networkResponse;
        } catch {
          return new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // 3. Static Images & Icons: CacheFirst
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/splash/') ||
    url.pathname.startsWith('/screenshots/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const clone = response.clone();
            cache.put(request, clone).catch(() => {});
          }
          return response;
        } catch {
          return cached || new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // 4. App Pages / Navigation: StaleWhileRevalidate with Offline fallback to /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone).catch(() => {});
            }).catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = (await caches.match(request)) || (await caches.match('/index.html')) || (await caches.match('/'));
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>KDP Studio</title><meta http-equiv="refresh" content="3"></head><body><div style="font-family:sans-serif;padding:40px;text-align:center"><h2>Reconnecting to KDP Studio...</h2><p>Please check your connection or refresh the page.</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html' }, status: 200 }
          );
        })
    );
    return;
  }

  // Default: Network with Cache Fallback for Vite bundles
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok && url.origin === self.location.origin) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, clone).catch(() => {});
              }).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => response || new Response('', { status: 404 }))
      );
    })
  );
});
