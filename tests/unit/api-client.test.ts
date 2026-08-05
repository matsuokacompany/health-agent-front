import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ConflictError, ForbiddenError, UnauthorizedError } from '@/infrastructure/http/ApiClient';

describe('ApiClient', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('can be constructed without API URL and fails lazily on requests outside tests', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
    vi.stubEnv('VITE_API_BASE_URL', '');

    const client = new ApiClient();

    await expect(client.request('/api/auth/me')).rejects.toThrow('API URL não configurada');
  });

  it('uses HttpOnly cookie credentials instead of sending a Bearer token', async () => {
    let capturedInit: RequestInit | undefined;
    vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
      capturedInit = init;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const client = new ApiClient({ baseUrl: 'http://api.test' });

    await client.request('/api/auth/me');

    expect(capturedInit?.credentials).toBe('include');
    expect((capturedInit?.headers as Headers).has('authorization')).toBe(false);
  });

  it('adds a CSRF header for mutating requests when the backend exposes a CSRF cookie', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: 'ha-csrf-token=csrf-value' });
    let capturedInit: RequestInit | undefined;
    vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
      capturedInit = init;
      return new Response(null, { status: 204 });
    });

    await new ApiClient({ baseUrl: 'http://api.test' }).request('/api/patients', { method: 'POST', body: JSON.stringify({ name: 'Ana' }) });

    expect((capturedInit?.headers as Headers).get('x-csrf-token')).toBe('csrf-value');
  });

  it('refreshes once on 401 and retries the original request with shared credentials', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.endsWith('/private') && calls.length === 1) return new Response('{}', { status: 401 });
      if (url.endsWith('/api/auth/refresh')) return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/private')).resolves.toEqual({ ok: true });

    expect(calls).toEqual([
      'GET http://api.test/private',
      'POST http://api.test/api/auth/refresh',
      'GET http://api.test/private',
    ]);
  });

  it('maps 401, 403 and 409 errors', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 401 }));
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/api/auth/me')).rejects.toBeInstanceOf(UnauthorizedError);

    vi.stubGlobal('fetch', async () => new Response('{}', { status: 403 }));
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/admin')).rejects.toBeInstanceOf(ForbiddenError);

    vi.stubGlobal('fetch', async () => new Response('{}', { status: 409 }));
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/api/auth/me')).rejects.toBeInstanceOf(ConflictError);
  });
});
