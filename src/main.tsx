import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ── Global Backend API URL Router & Interceptor ──────────────────────────────
// When the frontend is hosted statically (Firebase Hosting), relative /api/*
// calls return index.html (<!doctype html>) because there is no server.
// This interceptor automatically redirects all /api/* requests and EventSource
// streams to the Render backend (VITE_API_BASE_URL).
const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');

if (typeof window !== 'undefined' && API_BASE) {
  // 1. Intercept window.fetch to route to Render and auto-attach auth headers
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let finalInput = input;
    const isApiRequest =
      (typeof input === 'string' && (input.startsWith('/api/') || input === '/api' || input.includes('/api/'))) ||
      (input instanceof URL && input.pathname.startsWith('/api')) ||
      (input instanceof Request && new URL(input.url, window.location.origin).pathname.startsWith('/api'));

    if (isApiRequest) {
      if (typeof input === 'string') {
        if (input.startsWith('/api/') || input === '/api') {
          finalInput = `${API_BASE}${input}`;
        }
      } else if (input instanceof URL) {
        if (input.pathname.startsWith('/api')) {
          finalInput = new URL(`${API_BASE}${input.pathname}${input.search}`);
        }
      } else if (input instanceof Request) {
        const parsedUrl = new URL(input.url, window.location.origin);
        if (parsedUrl.pathname.startsWith('/api') && parsedUrl.origin === window.location.origin) {
          finalInput = new Request(`${API_BASE}${parsedUrl.pathname}${parsedUrl.search}`, input);
        }
      }

      // Auto-attach Authorization header if missing
      init = init ? { ...init } : {};
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));

      if (!headers.has('Authorization')) {
        try {
          const { auth } = await import('./lib/firebase');
          const user = auth.currentUser;
          if (user) {
            const token = await user.getIdToken();
            if (token) {
              headers.set('Authorization', `Bearer ${token}`);
              headers.set('x-user-id', user.uid);
            }
          } else {
            // Check for cached active session in localStorage (preview / guest mode)
            const cached = localStorage.getItem('kdp_active_session_user');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed?.uid) {
                headers.set('Authorization', `Bearer demo-token-${parsed.uid}`);
                headers.set('x-user-id', parsed.uid);
              }
            } else {
              headers.set('Authorization', `Bearer guest-trial`);
            }
          }
        } catch {
          headers.set('Authorization', `Bearer guest-trial`);
        }
      }

      init.headers = headers;
    }

    return originalFetch.call(this, finalInput, init);
  };

  // 2. Intercept window.EventSource (for real-time puzzle & SSE progress tracking)
  if (typeof window.EventSource !== 'undefined') {
    const OriginalEventSource = window.EventSource;
    window.EventSource = function (url: string | URL, eventSourceInitDict?: EventSourceInit) {
      let finalUrl = url;
      if (typeof url === 'string') {
        if (url.startsWith('/api/') || url === '/api') {
          finalUrl = `${API_BASE}${url}`;
        }
      } else if (url instanceof URL && url.pathname.startsWith('/api')) {
        finalUrl = new URL(`${API_BASE}${url.pathname}${url.search}`);
      }
      return new OriginalEventSource(finalUrl, eventSourceInitDict);
    } as any;
  }

  // 3. Fire silent non-blocking warm-up ping to wake sleeping Render instance
  fetch(`${API_BASE}/api/health`, { method: 'GET', cache: 'no-store' }).catch(() => {/* silent */});
}
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

