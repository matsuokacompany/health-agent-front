import type { AuthProvider } from './AuthProvider';
import { SupabaseAuth } from './SupabaseAuth';

export type { AuthProvider, SignInInput } from './AuthProvider';

export function createAuthProvider(): AuthProvider {
  if (process.env.AUTH_PROVIDER === 'supabase') return new SupabaseAuth();

  return new SupabaseAuth();
}

export const authProvider = createAuthProvider();
