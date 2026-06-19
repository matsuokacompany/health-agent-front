export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export async function api<T>(path: string, init: RequestInit = {}) {
  const res = await fetch(`${baseURL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}
