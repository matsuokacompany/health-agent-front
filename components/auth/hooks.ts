'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RoleName } from '@/lib/types';
import { useAuth } from './AuthProvider';

export function useHasRole(role: RoleName) {
  return useAuth().roles.includes(role);
}

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) router.replace('/login');
  }, [auth.isAuthenticated, auth.loading, router]);

  return auth;
}
