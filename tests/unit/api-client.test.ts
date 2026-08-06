import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, clearCsrfToken, ConflictError, ForbiddenError, shouldRedirectToLogin, UnauthorizedError } from '@/infrastructure/http/ApiClient';

describe('ApiClient', () => {
  afterEach(() => {
    clearCsrfToken();
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

  it('obtains CSRF in memory and adds it to mutating requests', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf-value' }), { status: 200 });
      return new Response(null, { status: 204 });
    });

    await new ApiClient({ baseUrl: 'http://api.test' }).request('/api/patients', { method: 'POST', body: JSON.stringify({ name: 'Ana' }) });

    expect(calls[0].url).toBe('http://api.test/api/auth/csrf');
    expect(calls[0].init?.cache).toBe('no-store');
    expect((calls[1].init?.headers as Headers).get('x-csrf-token')).toBe('csrf-value');
  });

  it('refreshes once on 401 and retries the original request with shared credentials', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.endsWith('/private') && calls.length === 1) return new Response('{}', { status: 401 });
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf' }), { status: 200 });
      if (url.endsWith('/api/auth/refresh')) return new Response(null, { status: 204, headers: { 'X-CSRF-Token': 'rotated' } });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/private')).resolves.toEqual({ ok: true });

    expect(calls).toEqual([
      'GET http://api.test/private',
      'GET http://api.test/api/auth/csrf',
      'POST http://api.test/api/auth/refresh',
      'GET http://api.test/private',
    ]);
  });

  it('recovers from an invalid CSRF token once and retries replayable JSON', async () => {
    let csrfCalls = 0;
    const mutationTokens: Array<string | null> = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      if (url.endsWith('/api/auth/csrf')) {
        csrfCalls += 1;
        return new Response(JSON.stringify({ csrf_token: `csrf-${csrfCalls}` }), { status: 200 });
      }
      mutationTokens.push((init?.headers as Headers).get('x-csrf-token'));
      if (mutationTokens.length === 1) return new Response(JSON.stringify({ detail: 'Invalid CSRF token' }), { status: 403 });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/mutation', { method: 'POST', body: '{}' })).resolves.toEqual({ ok: true });
    expect(mutationTokens).toEqual(['csrf-1', 'csrf-2']);
  });

  it('maps 401, 403 and 409 errors', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 401 }));
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/api/auth/me')).rejects.toBeInstanceOf(UnauthorizedError);

    vi.stubGlobal('fetch', async () => new Response('{}', { status: 403 }));
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/admin')).rejects.toBeInstanceOf(ForbiddenError);

    vi.stubGlobal('fetch', async () => new Response('{}', { status: 409 }));
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/api/auth/me')).rejects.toBeInstanceOf(ConflictError);
  });

  it('does not redirect authentication failures back to login', () => {
    expect(shouldRedirectToLogin('/api/auth/me')).toBe(false);
    expect(shouldRedirectToLogin('/api/auth/login')).toBe(false);
    expect(shouldRedirectToLogin('/api/auth/refresh')).toBe(false);
    expect(shouldRedirectToLogin('/api/auth/csrf')).toBe(false);
    expect(shouldRedirectToLogin('/api/patients')).toBe(true);
  });
});
