'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RoleName } from '@/lib/types';
import { useAuth } from './AuthProvider';
import { ShellSkeleton } from '@/components/ui/Skeleton';

function Loading() {
  return <ShellSkeleton />;
}

function Forbidden() {
  return <main><section className="panel"><span className="badge risk-alto">Acesso negado</span><h1 className="danger">Acesso negado</h1><p className="muted">Permissão insuficiente para acessar este recurso.</p></section></main>;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) router.replace('/login');
  }, [auth.isAuthenticated, auth.loading, router]);

  if (auth.loading && !auth.isAuthenticated) return <Loading />;
  if (!auth.isAuthenticated) return null;
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: RoleName; children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.loading && !auth.isAuthenticated) return <Loading />;
  if (!auth.isAuthenticated) return null;
  if (!auth.roles.includes(role)) return <Forbidden />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.loading && !auth.isAuthenticated) return <Loading />;
  if (!auth.isAuthenticated) return null;
  if (!auth.isAdmin) return <Forbidden />;
  return <>{children}</>;
}

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.loading && !auth.isAuthenticated) return <Loading />;
  if (!auth.isAuthenticated) return null;
  if (!auth.isSuperAdmin) return <Forbidden />;
  return <>{children}</>;
}

export const ProtectedRoute = RequireAuth;
export const AdminRoute = RequireAdmin;
