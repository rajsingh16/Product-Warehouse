import type { AuthUser } from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

function currentUser(): AuthUser | null {
  const raw = localStorage.getItem('pw_auth');
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = localStorage.getItem('pw_access_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else if (import.meta.env.DEV) {
    const user = currentUser();
    if (user?.employeeId) headers.set('x-user-id', user.employeeId);
  }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await response.json().catch(() => null) as { data?: T; message?: string } | null;
  if (!response.ok) throw new Error(body?.message ?? `Request failed (${response.status})`);
  return (body?.data ?? body) as T;
}

export function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  const result = search.toString();
  return result ? `?${result}` : '';
}
