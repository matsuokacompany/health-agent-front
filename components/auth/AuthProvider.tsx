'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { RoleName, UserRead } from '@/lib/types';
import {
  clearLegacySupabaseSession,
  getCurrentUser,
  refreshSession,
  signInWithPassword,
  signOut as backendSignOut,
  signUpWithPassword,
  type SignupPayload,
  type SignupResult,
} from '@/lib/supabase';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { setUnauthorizedHandler, UnauthorizedError } from '@/infrastructure/http/ApiClient';
import { useOptionalQueryClient } from '@/lib/tanstack-react-query';

export type AccessContext = 'admin' | 'professional' | 'patient';

const ACCESS_CONTEXT_KEY = 'julha.activeAccessContext';
const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export const accessContextLabels: Record<AccessContext, string> = {
  admin: 'Administração',
  professional: 'Profissional',
  patient: 'Paciente',
};

function readStoredAccessContext(): AccessContext | null {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(ACCESS_CONTEXT_KEY);
  return stored === 'admin' || stored === 'professional' || stored === 'patient' ? stored : null;
}

export type AuthContextValue = {
  user: UserRead | null;
  roles: RoleName[];
  activeAccessContext: AccessContext | null;
  setActiveAccessContext(context: AccessContext | null): void;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isProfessional: boolean;
  isPatient: boolean;
  signIn(email: string, password: string): Promise<UserRead>;
  signUp(payload: SignupPayload): Promise<SignupResult>;
  signOut(): Promise<void>;
  refreshMe(): Promise<UserRead | null>;
  clearAuthState(): void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useOptionalQueryClient();
  const [user, setUser] = useState<UserRead | null>(null);
  const [activeAccessContextState, setActiveAccessContextState] = useState<AccessContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Every async authentication operation captures this value. Clearing the
  // session invalidates its result, so a late /me, login, or refresh response
  // cannot sign the user back in after logout (or after a terminal 401).
  const authGeneration = useRef(0);

  useEffect(() => {
    setActiveAccessContextState(readStoredAccessContext());
  }, []);

  const setActiveAccessContext = useCallback((context: AccessContext | null) => {
    setActiveAccessContextState(context);
    if (typeof window === 'undefined') return;
    if (context) window.localStorage.setItem(ACCESS_CONTEXT_KEY, context);
    else window.localStorage.removeItem(ACCESS_CONTEXT_KEY);
  }, []);

  const clearAuthState = useCallback(() => {
    authGeneration.current += 1;
    // Clinical responses must not survive logout or become visible to the next
    // account using the same browser tab.
    queryClient?.clear();
    setUser(null);
    setError(null);
    setActiveAccessContext(null);
  }, [queryClient, setActiveAccessContext]);

  useEffect(() => {
    setUnauthorizedHandler(clearAuthState);
    return () => setUnauthorizedHandler(null);
  }, [clearAuthState]);

  const refreshMe = useCallback(async () => {
    const generation = authGeneration.current;
    try {
      const me = await getCurrentUser();
      if (generation !== authGeneration.current) return null;
      setUser(me);
      setError(null);
      return me;
    } catch (err) {
      if (generation !== authGeneration.current) return null;
      setUser(null);
      // A missing/expired cookie is the normal signed-out state. The API client
      // already redirects protected requests, so surfacing it on /login makes
      // every fresh visit look like an error. Keep actionable failures visible.
      setError(err instanceof UnauthorizedError ? null : toFriendlyErrorMessage(err));
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      setLoading(true);
      clearLegacySupabaseSession();
      try {
        await refreshMe();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, [refreshMe]);

  useEffect(() => {
    if (!user) return;

    let lastRefreshAt = Date.now();
    const keepSessionAlive = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        await refreshSession();
        lastRefreshAt = Date.now();
      } catch {
        // Protected requests still retry refresh and handle an expired session.
        // A transient keep-alive failure must not interrupt an active user.
      }
    };
    const interval = window.setInterval(() => { void keepSessionAlive(); }, SESSION_REFRESH_INTERVAL_MS);
    const refreshAfterBackground = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRefreshAt >= SESSION_REFRESH_INTERVAL_MS) {
        void keepSessionAlive();
      }
    };
    document.addEventListener('visibilitychange', refreshAfterBackground);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshAfterBackground);
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setActiveAccessContext(null);
    const generation = authGeneration.current;
    try {
      const me = await signInWithPassword(email, password);
      if (generation !== authGeneration.current) return me;
      setUser(me);
      setError(null);
      return me;
    } finally {
      setLoading(false);
    }
  }, [setActiveAccessContext]);

  const signUp = useCallback(async (payload: SignupPayload) => {
    setLoading(true);
    setActiveAccessContext(null);
    const generation = authGeneration.current;
    try {
      const result = await signUpWithPassword(payload);
      if (result.status === 'authenticated' && generation === authGeneration.current) {
        setUser(result.user);
        setError(null);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, [setActiveAccessContext]);

  const signOut = useCallback(async () => {
    // Clear immediately: a refresh that was already in flight must never make
    // protected UI visible again while the logout request is completing.
    clearAuthState();
    try {
      await backendSignOut();
    } catch {
      // Local logout succeeds even if the server session has already expired.
    }
  }, [clearAuthState]);

  const roles = user?.roles ?? [];
  const value = useMemo<AuthContextValue>(() => ({
    user,
    roles,
    activeAccessContext: activeAccessContextState,
    setActiveAccessContext,
    loading,
    error,
    isAuthenticated: Boolean(user),
    isSuperAdmin: roles.includes('super_admin'),
    isAdmin: roles.includes('admin') || roles.includes('super_admin'),
    isProfessional: roles.includes('professional'),
    isPatient: roles.includes('patient'),
    signIn,
    signUp,
    signOut,
    refreshMe,
    clearAuthState,
  }), [activeAccessContextState, clearAuthState, error, loading, refreshMe, roles, setActiveAccessContext, signIn, signUp, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
