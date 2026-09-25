export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : '')
).replace(/\/$/, '');

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('pw_access_token');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => null) as {
    data?: T;
    message?: string;
  } | null;

  if (!response.ok) {
    if (
      response.status === 401 &&
      body?.message === 'Your account was logged in from another session.'
    ) {
      localStorage.removeItem('pw_access_token');
      localStorage.removeItem('pw_auth');
      window.location.href = '/login';
      throw new Error('Your account was logged in from another session.');
    }

    throw new Error(body?.message ?? `Request failed (${response.status})`);
  }

  return (body?.data ?? body) as T;
}

export function queryString(
  params: Record<string, string | number | undefined>
): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });

  const result = search.toString();
  return result ? `?${result}` : '';
}