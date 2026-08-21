import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError, beginLogout, clearCsrfToken, ConflictError, ForbiddenError, NotFoundError, resetAuthLifecycle, shouldRedirectToLogin, UnauthorizedError } from '@/infrastructure/http/ApiClient';

describe('ApiClient', () => {
  afterEach(() => {
    clearCsrfToken();
    resetAuthLifecycle();
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
    const inits: RequestInit[] = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      inits.push(init ?? {});
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
    expect(inits.every(init => init.credentials === 'include')).toBe(true);
    expect(new Headers(inits[2].headers).get('X-CSRF-Token')).toBe('csrf');
  });

  it('recovers the authentication bootstrap when /me initially returns 401', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (url.endsWith('/api/auth/me') && calls.filter(call => call.endsWith('/api/auth/me')).length === 1) return new Response('{}', { status: 401 });
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf' }), { status: 200 });
      if (url.endsWith('/api/auth/refresh')) return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ id: '1', email: 'ana@example.com', roles: ['patient'] }), { status: 200 });
    });

    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/api/auth/me')).resolves.toMatchObject({ id: '1' });
    expect(calls).toEqual([
      'GET http://api.test/api/auth/me',
      'GET http://api.test/api/auth/csrf',
      'POST http://api.test/api/auth/refresh',
      'GET http://api.test/api/auth/me',
    ]);
  });

  it('only retries after a 204 refresh response', async () => {
    const privateCalls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf' }), { status: 200 });
      if (url.endsWith('/api/auth/refresh')) return new Response('{}', { status: 200, headers: { 'X-CSRF-Token': 'not-accepted' } });
      privateCalls.push(url);
      return new Response('{}', { status: 401 });
    });

    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/private')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(privateCalls).toEqual(['http://api.test/private']);
  });

  it('accepts a successful 204 refresh without requiring a rotated CSRF response header', async () => {
    let privateCalls = 0;
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf' }), { status: 200 });
      if (url.endsWith('/api/auth/refresh')) return new Response(null, { status: 204 });
      privateCalls += 1;
      return privateCalls === 1 ? new Response('{}', { status: 401 }) : new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/private')).resolves.toEqual({ ok: true });
    expect(privateCalls).toBe(2);
  });

  it('uses one CSRF and refresh single-flight for simultaneous expired requests', async () => {
    let csrfCalls = 0;
    let refreshCalls = 0;
    const attempts = new Map<string, number>();
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.endsWith('/api/auth/csrf')) { csrfCalls += 1; return new Response(JSON.stringify({ csrf_token: 'csrf' }), { status: 200 }); }
      if (url.endsWith('/api/auth/refresh')) { refreshCalls += 1; await Promise.resolve(); return new Response(null, { status: 204 }); }
      const attempt = (attempts.get(url) ?? 0) + 1;
      attempts.set(url, attempt);
      return attempt === 1 ? new Response('{}', { status: 401 }) : new Response(JSON.stringify({ url }), { status: 200 });
    });
    const client = new ApiClient({ baseUrl: 'http://api.test' });

    await Promise.all(['/one', '/two', '/three'].map(path => client.request(path)));

    expect(csrfCalls).toBe(1);
    expect(refreshCalls).toBe(1);
    expect([...attempts.values()]).toEqual([2, 2, 2]);
  });

  it('does not loop when the retry is also unauthorized or refresh itself returns 401', async () => {
    let privateCalls = 0;
    let refreshCalls = 0;
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf' }), { status: 200 });
      if (url.endsWith('/api/auth/refresh')) { refreshCalls += 1; return new Response(null, { status: 204 }); }
      privateCalls += 1;
      return new Response('{}', { status: 401 });
    });
    const client = new ApiClient({ baseUrl: 'http://api.test' });
    await expect(client.request('/private')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(privateCalls).toBe(2);
    expect(refreshCalls).toBe(1);

    resetAuthLifecycle();
    refreshCalls = 0;
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf' }), { status: 200 });
      if (url.endsWith('/api/auth/refresh')) refreshCalls += 1;
      return new Response('{}', { status: 401 });
    });
    await expect(client.request('/api/auth/refresh', { method: 'POST' })).rejects.toBeInstanceOf(UnauthorizedError);
    expect(refreshCalls).toBe(1);
  });

  it('notifies an expired session once only after refresh fails', async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf' }), { status: 200 });
      if (url.endsWith('/api/auth/refresh')) return new Response('{}', { status: 401 });
      return new Response('{}', { status: 401 });
    });
    const client = new ApiClient({ baseUrl: 'http://api.test', onUnauthorized });

    await Promise.allSettled([client.request('/one'), client.request('/two')]);

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it.each([403, 422, 500])('does not refresh an HTTP %s response', async (status) => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => { calls.push(url); return new Response('{}', { status }); });
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/private')).rejects.toBeInstanceOf(ApiError);
    expect(calls).toEqual(['http://api.test/private']);
  });

  it('does not translate network failures into an expired session', async () => {
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch'); });
    await expect(new ApiClient({ baseUrl: 'http://api.test', onUnauthorized }).request('/private')).rejects.toThrow('Failed to fetch');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('ignores a refresh response that arrives after logout starts', async () => {
    let releaseRefresh!: () => void;
    const refreshResponse = new Promise<void>(resolve => { releaseRefresh = resolve; });
    let privateCalls = 0;
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf' }), { status: 200 });
      if (url.endsWith('/api/auth/refresh')) { await refreshResponse; return new Response(null, { status: 204 }); }
      privateCalls += 1;
      return new Response('{}', { status: 401 });
    });
    const request = new ApiClient({ baseUrl: 'http://api.test' }).request('/private');
    await vi.waitFor(() => expect(privateCalls).toBe(1));
    await Promise.resolve();
    beginLogout();
    releaseRefresh();

    await expect(request).rejects.toBeInstanceOf(UnauthorizedError);
    expect(privateCalls).toBe(1);
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

  it('maps 401, 403, 404 and 409 errors', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 401 }));
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/api/auth/me')).rejects.toBeInstanceOf(UnauthorizedError);

    vi.stubGlobal('fetch', async () => new Response('{}', { status: 403 }));
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/admin')).rejects.toBeInstanceOf(ForbiddenError);

    vi.stubGlobal('fetch', async () => new Response('{}', { status: 404 }));
    await expect(new ApiClient({ baseUrl: 'http://api.test' }).request('/patients/123')).rejects.toBeInstanceOf(NotFoundError);

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
