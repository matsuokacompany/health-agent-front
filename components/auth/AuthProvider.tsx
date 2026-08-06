'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { RoleName, UserRead } from '@/lib/types';
import { clearLegacySupabaseSession, getCurrentUser, signInWithPassword, signOut as backendSignOut } from '@/lib/supabase';
import { toFriendlyErrorMessage } from '@/components/ui/errors';

export type AccessContext = 'admin' | 'professional' | 'patient';

const ACCESS_CONTEXT_KEY = 'julha.activeAccessContext';

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
  signOut(): Promise<void>;
  refreshMe(): Promise<UserRead | null>;
  clearAuthState(): void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserRead | null>(null);
  const [activeAccessContextState, setActiveAccessContextState] = useState<AccessContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setUser(null);
    setError(null);
    setActiveAccessContext(null);
  }, [setActiveAccessContext]);

  const refreshMe = useCallback(async () => {
    try {
      const me = await getCurrentUser();
      setUser(me);
      setError(null);
      return me;
    } catch (err) {
      setUser(null);
      setError(toFriendlyErrorMessage(err));
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

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setActiveAccessContext(null);
    try {
      const me = await signInWithPassword(email, password);
      setUser(me);
      setError(null);
      return me;
    } finally {
      setLoading(false);
    }
  }, [setActiveAccessContext]);

  const signOut = useCallback(async () => {
    try {
      await backendSignOut();
    } finally {
      clearAuthState();
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
    signOut,
    refreshMe,
    clearAuthState,
  }), [activeAccessContextState, clearAuthState, error, loading, refreshMe, roles, setActiveAccessContext, signIn, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
