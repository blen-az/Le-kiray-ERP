/**
 * Thin API client that automatically injects the Authorization header.
 * Import this instead of calling fetch directly in components.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type FetchOptions = RequestInit & { token?: string | null };

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const { token, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetch(url, { ...fetchOptions, headers, credentials: 'include' });
}

/** Convenience wrapper that throws on non-OK responses */
export async function apiRequest<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const error = new Error(err.message || `Request failed: ${res.status}`) as any;
    error.status = res.status;
    throw error;
  }
  return res.json() as Promise<T>;
}
