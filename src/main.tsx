import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ── Silent Render warm-up ping ────────────────────────────────────────────────
// Render free tier spins down after 15min idle. This fire-and-forget fetch
// wakes the backend as soon as the page loads, before the user hits any feature.
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';
if (API_BASE) {
  fetch(`${API_BASE}/api/health`, { method: 'GET', cache: 'no-store' }).catch(() => {/* silent */});
}
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
