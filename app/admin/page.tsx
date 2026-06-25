'use client';

import { RequireAdmin } from '@/components/auth/guards';
import { useAuth } from '@/components/auth/AuthProvider';

function AdminDashboard() {
  const { user, roles, isSuperAdmin } = useAuth();

  return (
    <main>
      <div className="topbar"><span className="badge">Admin</span><a href="/logout">Sair</a></div>
      <h1>Painel administrativo</h1>
      <p className="muted">Roles carregadas do FastAPI para o usuário local #{user?.id}: {roles.join(', ')}</p>
      <section className="grid">
        <article className="card"><h2>Usuários</h2><a href="/admin/users">Gerenciar usuários</a></article>
        {isSuperAdmin ? <article className="card"><h2>Roles</h2><a href="/admin/users/1/roles">Promover/remover roles</a></article> : null}
      </section>
    </main>
  );
}

export default function AdminPage() {
  return <RequireAdmin><AdminDashboard /></RequireAdmin>;
}
