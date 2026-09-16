import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearLegacySupabaseSession, exchangePasswordRecovery, resetPasswordForEmail, signInWithPassword, signOut, updatePassword } from '@/lib/supabase';
import { clearCsrfToken } from '@/infrastructure/http/ApiClient';

describe('backend auth client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('removes the legacy Supabase session from localStorage', () => {
    localStorage.setItem('health-agent.supabase.session', JSON.stringify({ access_token: 'legacy' }));

    clearLegacySupabaseSession();

    expect(localStorage.getItem('health-agent.supabase.session')).toBeNull();
  });

  it('routes auth actions to backend endpoints without persisting tokens', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith('/api/auth/login')) return new Response(JSON.stringify({ id: '1', email: 'ana@example.com', roles: ['patient'] }), { status: 200 });
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'csrf-value' }), { status: 200 });
      return new Response(null, { status: 204 });
    });

    await signInWithPassword('ana@example.com', 'safe-password');
    await resetPasswordForEmail('ana@example.com');
    await updatePassword('new-safe-password');
    await exchangePasswordRecovery({ code: 'recovery-code' });
    await signOut();

    expect(calls.map(({ url }) => url)).toEqual([
      'http://localhost/api/auth/login',
      'http://localhost/api/auth/csrf',
      'http://localhost/api/auth/forgot-password',
      'http://localhost/api/auth/change-password',
      'http://localhost/api/auth/recovery/exchange',
      'http://localhost/api/auth/csrf',
      'http://localhost/api/auth/logout',
    ]);
    expect(localStorage.getItem('health-agent.supabase.session')).toBeNull();
    expect(calls.every(({ init }) => init?.credentials === 'include')).toBe(true);
  });

  it('exchanges a recovery link for a session without a prior CSRF token (fresh, unauthenticated browser tab)', async () => {
    // Regression test: landing on /reset-password from an emailed link is
    // the FIRST request this browser tab ever makes -- there is no session
    // and therefore no CSRF cookie yet. GET /api/auth/csrf 401s in that case
    // ("CSRF token not available"). recovery/exchange is already exempted
    // from the CSRF check on the backend (app/main.py's csrf_exempt set) for
    // exactly this reason, but the frontend's own CSRF_EXEMPT_PATHS list was
    // missing it, so the client still tried to pre-fetch a token before the
    // call and threw on the 401 -- surfacing as a generic "Não foi possível
    // concluir a operação" error with the password form stuck disabled, even
    // for a genuinely fresh, valid recovery link.
    clearCsrfToken();
    const calls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push(url);
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ detail: 'CSRF token not available' }), { status: 401 });
      return new Response(null, { status: 204 });
    });

    await expect(exchangePasswordRecovery({ access_token: 'fresh-access-token', refresh_token: 'fresh-refresh-token', expires_in: 3600 })).resolves.toBeUndefined();

    expect(calls).toEqual(['http://localhost/api/auth/recovery/exchange']);
  });
});
