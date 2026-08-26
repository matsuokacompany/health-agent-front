import type { UserRead } from '@/lib/types';
import { beginLogout, clearCsrfToken, refreshCsrfToken, resetAuthLifecycle } from '@/infrastructure/http/ApiClient';
import { api } from '@/services/api';

export const LEGACY_SUPABASE_SESSION_KEY = 'health-agent.supabase.session';

export function clearLegacySupabaseSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_SUPABASE_SESSION_KEY);
}

export function signInWithPassword(email: string, password: string) {
  resetAuthLifecycle();
  return api<UserRead>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  state: string;
  gender: string;
  birth_date: string;
  cpf: string;
  terms_accepted: boolean;
  terms_version: string;
};

export type SignupResult =
  | { status: 'authenticated'; user: UserRead }
  | { status: 'confirmation_pending' };

export async function signUpWithPassword(payload: SignupPayload): Promise<SignupResult> {
  resetAuthLifecycle();
  // The backend returns 200 + UserRead when the Supabase project auto-confirms
  // new accounts, or 202 + {message} when it requires e-mail confirmation
  // first (no session cookie is set in that case).
  const result = await api<UserRead | { message: string }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (result && typeof result === 'object' && 'message' in result) return { status: 'confirmation_pending' };
  return { status: 'authenticated', user: result as UserRead };
}

export type ProfessionalSignupPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  specialty: string;
  terms_accepted: boolean;
  terms_version: string;
};

export async function signUpProfessionalWithPassword(payload: ProfessionalSignupPayload): Promise<SignupResult> {
  resetAuthLifecycle();
  const result = await api<UserRead | { message: string }>('/api/auth/signup-professional', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (result && typeof result === 'object' && 'message' in result) return { status: 'confirmation_pending' };
  return { status: 'authenticated', user: result as UserRead };
}

export async function signOut() {
  beginLogout();
  try {
    await api<void>('/api/auth/logout', { method: 'POST' });
  } finally {
    clearCsrfToken();
    clearLegacySupabaseSession();
  }
}

export async function getCurrentUser() {
  const user = await api<UserRead>('/api/auth/me');
  await refreshCsrfToken();
  return user;
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
