import { auth } from './firebase';

/**
 * API Base URL — points to the Express/Render backend.
 * Set VITE_API_BASE_URL in .env.local when the frontend (Firebase)
 * is served from a different origin than the API (Render).
 * Leave empty when both are served from the same server (Render direct).
 */
const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';

export function getApiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Universal Client API Helper
 * Automatically attaches Firebase ID Token in Authorization: Bearer <token> header.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[apiClient] Failed to retrieve Firebase ID token:', e);
    }
  } else if (typeof window !== 'undefined') {
    // Check if demo user is stored in preview mode
    const cached = localStorage.getItem('kdp_active_session_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.uid) {
          headers['Authorization'] = `Bearer demo-token-${parsed.uid}`;
          headers['x-user-id'] = parsed.uid;
        }
      } catch {}
    }
  }

  return headers;
}

export async function apiPost(
  url: string,
  body: any,
  customHeaders?: Record<string, string>
): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(getApiUrl(url), {
    method: 'POST',
    headers: { ...headers, ...customHeaders },
    body: JSON.stringify(body),
  });
}

export async function apiGet(
  url: string,
  customHeaders?: Record<string, string>
): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(getApiUrl(url), {
    method: 'GET',
    headers: { ...headers, ...customHeaders },
  });
}

export async function apiDelete(
  url: string,
  customHeaders?: Record<string, string>
): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(getApiUrl(url), {
    method: 'DELETE',
    headers: { ...headers, ...customHeaders },
  });
}

export async function apiPut(
  url: string,
  body: any,
  customHeaders?: Record<string, string>
): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(getApiUrl(url), {
    method: 'PUT',
    headers: { ...headers, ...customHeaders },
    body: JSON.stringify(body),
  });
}
