'use client';

import { RequireAdmin } from '@/components/auth/guards';
import { useAuth } from '@/components/auth/AuthProvider';

function AdminDashboard() {
  const { user, roles, isSuperAdmin } = useAuth();

  return (
    <main>
      <div className="topbar"><span className="badge">Admin Console</span><a href="/logout">Sair</a></div>
      <header className="page-header"><span className="eyebrow">Governança clínica</span><h1>Painel administrativo</h1><p className="muted">Roles carregadas do FastAPI para o usuário local #{user?.id}: {roles.join(', ')}.</p></header>
      <section className="grid">
        <article className="card"><span className="badge">IAM</span><h2>Usuários</h2><p className="muted">Gerencie acessos sem sair do padrão visual do produto clínico.</p><a className="button" href="/admin/users">Gerenciar usuários</a></article>
        {isSuperAdmin ? <article className="card"><span className="badge risk-moderado">Super Admin</span><h2>Roles</h2><p className="muted">Promova ou remova permissões sensíveis com clareza.</p><a className="button secondary" href="/admin/users/1/roles">Promover/remover roles</a></article> : null}
        <article className="card"><span className="badge success">Auditoria</span><h2>Conformidade</h2><p className="muted">Interface preparada para rastreabilidade e revisão de eventos administrativos.</p></article>
      </section>
    </main>
  );
}

export default function AdminPage() {
  return <RequireAdmin><AdminDashboard /></RequireAdmin>;
}
