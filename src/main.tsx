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
  // 1. Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string') {
      if (input.startsWith('/api/') || input === '/api') {
        input = `${API_BASE}${input}`;
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith('/api')) {
        input = new URL(`${API_BASE}${input.pathname}${input.search}`);
      }
    } else if (input instanceof Request) {
      const parsedUrl = new URL(input.url, window.location.origin);
      if (parsedUrl.pathname.startsWith('/api') && parsedUrl.origin === window.location.origin) {
        input = new Request(`${API_BASE}${parsedUrl.pathname}${parsedUrl.search}`, input);
      }
    }
    return originalFetch.call(this, input, init);
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

