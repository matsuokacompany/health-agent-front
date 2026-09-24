'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthLogo } from '@/components/ui/AuthLogo';

export default function Logout() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    void signOut().finally(() => router.replace('/login'));
  }, [router, signOut]);

  return (
    <main className="login-hero">
      <div className="panel login-panel session-ending-panel" role="status" aria-live="polite">
        <AuthLogo />
        <span className="spinner" aria-hidden="true" />
        <p className="muted">Encerrando sua sessão...</p>
      </div>
    </main>
  );
}
