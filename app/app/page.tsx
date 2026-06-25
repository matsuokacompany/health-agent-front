'use client';

import { RequireAuth } from '@/components/auth/guards';
import { useAuth } from '@/components/auth/AuthProvider';

function Home() {
  const { user, isAdmin, isSuperAdmin, isPatient, isProfessional } = useAuth();

  return (
    <main>
      <div className="topbar"><span className="badge">Autenticado</span><a href="/logout">Sair</a></div>
      <h1>Dashboard</h1>
      <p className="muted">Usuário local #{user?.id}: {user?.name}</p>
      <nav className="menu">
        {isPatient ? <a href="/patient/dashboard">Daily Reports</a> : null}
        {isPatient ? <a href="/patient/calendar">Anamnese</a> : null}
        {(isPatient || isAdmin) ? <a href="/reports">Reports</a> : null}
        {isProfessional ? <a href="/professional/patients">Monitoring</a> : null}
        {isAdmin ? <a href="/admin">Admin</a> : null}
        {isSuperAdmin ? <a href="/admin/users/1/roles">Gerenciar roles</a> : null}
      </nav>
    </main>
  );
}

export default function AppPage() {
  return <RequireAuth><Home /></RequireAuth>;
}
