import type { Role, User } from '@/lib/types';
import { ApiClient, apiClient } from '@/services/api-client';
import type { AuthProvider } from './types';

/**
 * Optional infrastructure adapter for Supabase Auth.
 *
 * Application code depends on AuthProvider only. This adapter keeps Supabase
 * configuration and callback exchange details at the edge of the frontend while
 * FastAPI remains the source of business rules and user profile data.
 */
export class SupabaseAuth implements AuthProvider {
  constructor(private readonly client: ApiClient = apiClient) {}

  getCurrentUser(_defaultRole: Role = 'patient'): Promise<User | null> {
    return this.client.get<User>('/auth/me');
  }

  getAuthorizationUrl() {
    const backendLoginUrl = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL;
    if (backendLoginUrl) return backendLoginUrl;

    const supabaseAuthUrl = process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL ?? '';
    const redirectUri = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URI ?? 'https://app.julha.com.br/callback';

    if (!supabaseAuthUrl) return '/callback';

    const url = new URL(`${supabaseAuthUrl.replace(/\/$/, '')}/authorize`);
    url.searchParams.set('redirect_to', redirectUri);
    return url.toString();
  }

  async handleCallback(searchParams: URLSearchParams) {
    await this.client.post('/auth/callback', Object.fromEntries(searchParams.entries()));
  }
}
