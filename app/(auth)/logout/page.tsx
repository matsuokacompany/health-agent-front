'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Logout() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    void signOut().finally(() => router.replace('/login'));
  }, [router, signOut]);

  return <main><p className="muted">Encerrando sua sessão...</p></main>;
}
