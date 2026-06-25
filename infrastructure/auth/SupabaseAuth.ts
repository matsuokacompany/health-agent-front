import type { Role, User } from '@/lib/types';
import type { AuthProvider, SignInInput } from './AuthProvider';

/**
 * Optional Supabase authentication adapter.
 *
 * Keep all Supabase SDK imports and session mapping inside this infrastructure
 * class. The application should depend only on AuthProvider so Cognito, Auth0
 * or another identity provider can replace this adapter without changing
 * React components or domain services.
 */
export class SupabaseAuth implements AuthProvider {
  async getCurrentUser(_defaultRole: Role = 'patient'): Promise<User | null> {
    throw new Error(
      'SupabaseAuth is not configured in this MVP. Install/configure the Supabase SDK only inside this adapter.',
    );
  }

  async signIn(_input: SignInInput): Promise<User> {
    throw new Error('SupabaseAuth.signIn is not configured.');
  }

  async signOut(): Promise<void> {
    throw new Error('SupabaseAuth.signOut is not configured.');
  }

  async getAccessToken(): Promise<string | null> {
    return null;
  }
}
