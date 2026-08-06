import type { UserRead } from '@/lib/types';
import { api } from '@/services/api';

export const LEGACY_SUPABASE_SESSION_KEY = 'health-agent.supabase.session';

export function clearLegacySupabaseSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_SUPABASE_SESSION_KEY);
}

export function signInWithPassword(email: string, password: string) {
  return api<UserRead>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signOut() {
  try {
    await api<void>('/api/auth/logout', { method: 'POST' });
  } finally {
    clearLegacySupabaseSession();
  }
}

export function getCurrentUser() {
  return api<UserRead>('/api/auth/me');
}

export function refreshSession() {
  return api<void>('/api/auth/refresh', { method: 'POST' });
}

export function resetPasswordForEmail(email: string) {
  return api<void>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function updatePassword(password: string) {
  return api<void>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function exchangePasswordRecoveryCode(code: string) {
  await api<void>('/api/auth/recovery/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  clearLegacySupabaseSession();
}
