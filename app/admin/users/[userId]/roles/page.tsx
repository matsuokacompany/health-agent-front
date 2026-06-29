'use client';
import Link from 'next/link';

import { use } from 'react';
import { RequireSuperAdmin } from '@/components/auth/guards';

export default function RolesPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);

  return (
    <RequireSuperAdmin>
      <main>
        <div className="topbar"><span className="badge">Super Admin</span><Link href="/admin">Admin</Link></div>
        <h1>Gerenciar roles</h1>
        <p className="muted">Somente usuários autorizados podem alterar permissões.</p>
      </main>
    </RequireSuperAdmin>
  );
}
