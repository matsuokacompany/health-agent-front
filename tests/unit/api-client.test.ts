import { describe, expect, it, vi } from 'vitest';
import { ApiClient, ConflictError, ForbiddenError, UnauthorizedError } from '@/infrastructure/http/ApiClient';

describe('ApiClient', () => {
  it('sends Supabase access token in Authorization header', async () => {
    let capturedInit: RequestInit | undefined;
    vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
      capturedInit = init;
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const client = new ApiClient({ baseUrl: 'http://api.test', getAccessToken: async () => 'supabase-token' });

    await client.request('/api/auth/me');

    expect((capturedInit?.headers as Headers).get('authorization')).toBe('Bearer supabase-token');
  });

  it('maps 401, 403 and 409 errors', async () => {
    vi.stubGlobal('fetch', async () => new Response('{}', { status: 401 }));
    await expect(new ApiClient({ getAccessToken: async () => null }).request('/private')).rejects.toBeInstanceOf(UnauthorizedError);

    vi.stubGlobal('fetch', async () => new Response('{}', { status: 403 }));
    await expect(new ApiClient({ getAccessToken: async () => null }).request('/admin')).rejects.toBeInstanceOf(ForbiddenError);

    vi.stubGlobal('fetch', async () => new Response('{}', { status: 409 }));
    await expect(new ApiClient({ getAccessToken: async () => null }).request('/api/auth/me')).rejects.toBeInstanceOf(ConflictError);
  });
});
