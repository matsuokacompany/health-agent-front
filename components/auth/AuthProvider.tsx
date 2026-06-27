'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@/lib/supabase';
import type { RoleName, UserRead } from '@/lib/types';
import { getSession, onAuthStateChange, signInWithPassword, signOut as supabaseSignOut } from '@/lib/supabase';
import { api } from '@/services/api';

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
  session: Session | null;
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
  refreshMe(): Promise<UserRead>;
  clearAuthState(): void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
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
    setSession(null);
    setUser(null);
    setError(null);
    setActiveAccessContext(null);
  }, [setActiveAccessContext]);

  const refreshMe = useCallback(async () => {
    try {
      const me = await api<UserRead>('/api/auth/me');
      setUser(me);
      setError(null);
      return me;
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o usuário local.');
      throw err;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      setLoading(true);
      try {
        const currentSession = await getSession();
        if (!mounted) return;
        setSession(currentSession);
        if (currentSession) await refreshMe();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void restoreSession();

    const { data } = onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (nextSession) void refreshMe();
      }

      if (event === 'SIGNED_OUT') clearAuthState();
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [clearAuthState, refreshMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setActiveAccessContext(null);
    try {
      const { data, error: signInError } = await signInWithPassword(email, password);
      if (signInError) throw new Error(signInError.message);
      setSession(data.session);
      return await refreshMe();
    } finally {
      setLoading(false);
    }
  }, [refreshMe, setActiveAccessContext]);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    clearAuthState();
  }, [clearAuthState]);

  const roles = user?.roles ?? [];
  const value = useMemo<AuthContextValue>(() => ({
    session,
    user,
    roles,
    activeAccessContext: activeAccessContextState,
    setActiveAccessContext,
    loading,
    error,
    isAuthenticated: Boolean(session && user),
    isSuperAdmin: roles.includes('super_admin'),
    isAdmin: roles.includes('admin') || roles.includes('super_admin'),
    isProfessional: roles.includes('professional'),
    isPatient: roles.includes('patient'),
    signIn,
    signOut,
    refreshMe,
    clearAuthState,
  }), [activeAccessContextState, clearAuthState, error, loading, refreshMe, roles, session, setActiveAccessContext, signIn, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
