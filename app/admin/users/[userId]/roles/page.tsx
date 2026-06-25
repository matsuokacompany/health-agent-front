'use client';

import { use } from 'react';
import { RequireSuperAdmin } from '@/components/auth/guards';

export default function RolesPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);

  return (
    <RequireSuperAdmin>
      <main>
        <div className="topbar"><span className="badge">Super Admin</span><a href="/admin">Admin</a></div>
        <h1>Gerenciar roles</h1>
        <p className="muted">Somente super_admin pode alterar roles do usuário local #{userId}.</p>
      </main>
    </RequireSuperAdmin>
  );
}
