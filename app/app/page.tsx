'use client';

import { RequireAuth } from '@/components/auth/guards';
import { useAuth } from '@/components/auth/AuthProvider';

function Home() {
  const { user, isAdmin, isSuperAdmin, isPatient, isProfessional } = useAuth();

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span className="brand-icon">+</span><span>Julha Saúde</span></div>
        <nav className="menu">
          {isPatient ? <a href="/patient/dashboard">Daily Reports</a> : null}
          {isPatient ? <a href="/patient/calendar">Anamnese</a> : null}
          {(isPatient || isAdmin) ? <a href="/reports">Reports</a> : null}
          {isProfessional ? <a href="/professional/patients">Monitoring</a> : null}
          {isAdmin ? <a href="/admin">Admin</a> : null}
          {isSuperAdmin ? <a href="/admin/users/1/roles">Gerenciar roles</a> : null}
        </nav>
      </aside>
      <section>
        <div className="topbar"><span className="badge">Workspace autenticado</span><span><a href="/change-password">Alterar senha</a> · <a href="/logout">Sair</a></span></div>
        <header className="page-header">
          <span className="eyebrow">Centro clínico</span>
          <h1>Dashboard operacional</h1>
          <p className="muted">Usuário local #{user?.id}: {user?.name}. Acesse as rotas disponíveis para seu perfil com uma navegação clara e responsiva.</p>
        </header>
        <section className="grid">
          <article className="card"><span className="badge">Hoje</span><div className="metric">24</div><p className="muted">check-ins aguardando revisão clínica.</p></article>
          <article className="card"><span className="badge risk-moderado">Atenção</span><div className="metric">3</div><p className="muted">pacientes com alertas moderados ou altos.</p></article>
          <article className="card"><span className="badge">Segurança</span><div className="metric">RBAC</div><p className="muted">permissões locais carregadas via FastAPI.</p></article>
        </section>
      </section>
    </main>
  );
}

export default function AppPage() {
  return <RequireAuth><Home /></RequireAuth>;
}
