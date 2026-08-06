import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearLegacySupabaseSession, exchangePasswordRecoveryCode, resetPasswordForEmail, signInWithPassword, signOut, updatePassword } from '@/lib/supabase';

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
    await exchangePasswordRecoveryCode('recovery-code');
    await signOut();

    expect(calls.map(({ url }) => url)).toEqual([
      'http://localhost/api/auth/login',
      'http://localhost/api/auth/csrf',
      'http://localhost/api/auth/forgot-password',
      'http://localhost/api/auth/change-password',
      'http://localhost/api/auth/recovery/exchange',
      'http://localhost/api/auth/logout',
    ]);
    expect(localStorage.getItem('health-agent.supabase.session')).toBeNull();
    expect(calls.every(({ init }) => init?.credentials === 'include')).toBe(true);
  });
});
