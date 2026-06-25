'use client';

import { RequireRole } from '@/components/auth/guards';
import { useAuth } from '@/components/auth/AuthProvider';

function PatientDashboardContent() {
  const { user } = useAuth();

  return <main><div className="nav"><span className="badge">Paciente</span><a href="/patient/calendar">Calendário</a><a href="/logout">Sair</a></div><h1>Dashboard do paciente</h1><p className="muted">Dados de domínio usam o ID local do FastAPI: #{user?.id}. Daily reports são carregados pela API com Bearer Supabase.</p></main>;
}

export default function PatientDashboard() {
  return <RequireRole role="patient"><PatientDashboardContent /></RequireRole>;
}
