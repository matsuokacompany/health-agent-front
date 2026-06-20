import type { Role } from '@/lib/types';
import { USE_MOCK } from '@/services/api';
import { MockAuth } from './mock-auth';
import { SupabaseAuth } from './supabase-auth';
import type { AuthProvider } from './types';

export type { AuthProvider } from './types';
export { SupabaseAuth } from './supabase-auth';

export function createAuthProvider(): AuthProvider {
  if (USE_MOCK) return new MockAuth();
  return new SupabaseAuth();
}

export async function getCurrentUser(defaultRole: Role = 'patient') {
  return createAuthProvider().getCurrentUser(defaultRole);
}

export function getAuthorizationUrl() {
  return createAuthProvider().getAuthorizationUrl();
}

export async function handleAuthCallback(searchParams: URLSearchParams) {
  const provider = createAuthProvider();
  if (provider.handleCallback) await provider.handleCallback(searchParams);
}
