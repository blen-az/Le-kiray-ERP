/**
 * Thin API client that automatically injects the Authorization header.
 * Import this instead of calling fetch directly in components.
 *
 * - Reads the access token from sessionStorage (written by AuthProvider) unless one is passed.
 * - Only attaches the token to requests aimed at our own API, never third-party URLs.
 * - On a 401, performs one silent refresh via the HttpOnly refresh cookie and retries.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const ACCESS_TOKEN_KEY = 'lk_access_token';
/** Fired on window when a silent refresh issues a new access token (detail: token) */
export const TOKEN_REFRESHED_EVENT = 'lk:token-refreshed';
/** Fired on window when the session can no longer be refreshed */
export const SESSION_EXPIRED_EVENT = 'lk:session-expired';

type FetchOptions = RequestInit & { token?: string | null };

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/** Exchanges the refresh cookie for a new access token. Concurrent callers share one request. */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.accessToken) return null;
        sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: data.accessToken }));
        return data.accessToken as string;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const { token, ...fetchOptions } = options;
  // Pages pass `${apiUrl}/...` (already prefixed); newer code passes bare paths like '/tenders'.
  // API_BASE may be relative ('/api') when the frontend proxies to the backend (see next.config.ts).
  const url = path.startsWith('http') || path.startsWith(`${API_BASE}/`) ? path : `${API_BASE}${path}`;
  const isOwnApi = url.startsWith(API_BASE);
  const isAuthEndpoint = url.startsWith(`${API_BASE}/auth/`);

  const send = (authToken: string | null) => {
    const headers = new Headers(fetchOptions.headers);
    if (authToken && isOwnApi) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(url, { ...fetchOptions, headers, credentials: 'include' });
  };

  const authToken = token === undefined ? readStoredToken() : token;
  const res = await send(authToken);

  if (res.status === 401 && isOwnApi && !isAuthEndpoint && authToken) {
    const fresh = await refreshAccessToken();
    if (fresh) return send(fresh);
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  return res;
}

/** Convenience wrapper that throws on non-OK responses */
export async function apiRequest<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(err.message) ? err.message.join('. ') : err.message;
    const error = new Error(message || `Request failed: ${res.status}`) as any;
    error.status = res.status;
    throw error;
  }
  return res.json() as Promise<T>;
}
