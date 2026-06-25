'use client';

import { RequireRole } from '@/components/auth/guards';
import { useAuth } from '@/components/auth/AuthProvider';

function PatientDashboardContent() {
  const { user } = useAuth();

  return <main><div className="topbar"><span className="badge">Portal do paciente</span><span><a href="/patient/calendar">Calendário</a> · <a href="/logout">Sair</a></span></div><header className="page-header"><span className="eyebrow">Acompanhamento diário</span><h1>Dashboard do paciente</h1><p className="muted">Dados de domínio usam o ID local do FastAPI: #{user?.id}. Daily reports são carregados pela API com Bearer Supabase.</p></header><section className="grid"><article className="card"><span className="badge success">Em dia</span><h2>Check-in de hoje</h2><p className="muted">Registre sintomas, dor e observações importantes para sua equipe de cuidado.</p><a className="button" href="/patient/calendar">Abrir calendário</a></article><article className="card"><span className="badge">Plano de cuidado</span><h2>Próximas etapas</h2><p className="muted">Acompanhe sua evolução com orientações claras e linguagem simples.</p></article><article className="card"><span className="badge risk-moderado">Monitoramento</span><h2>Sinais de alerta</h2><p className="muted">Sintomas relevantes são destacados para revisão profissional.</p></article></section></main>;
}

export default function PatientDashboard() {
  return <RequireRole role="patient"><PatientDashboardContent /></RequireRole>;
}
