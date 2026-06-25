'use client';

import { RequireRole } from '@/components/auth/guards';
import { useAuth } from '@/components/auth/AuthProvider';

function CalendarContent() {
  const { user } = useAuth();
  const days = Array.from({ length: 14 }, (_, index) => index + 1);

  return <main><div className="topbar"><span className="badge">Calendário clínico</span><a href="/patient/dashboard">← Dashboard</a></div><header className="page-header"><span className="eyebrow">Anamnese e check-ins</span><h1>Calendário</h1><p className="muted">Check-ins do paciente local #{user?.id} devem ser buscados em /api/daily-reports/ com JWT Supabase.</p></header><section className="calendar">{days.map((day) => <article className={`day ${day === 12 ? 'is-active' : ''}`} key={day}><strong>{day}</strong><p className="muted">{day === 12 ? 'Check-in enviado' : 'Disponível'}</p></article>)}</section></main>;
}

export default function Calendar() {
  return <RequireRole role="patient"><CalendarContent /></RequireRole>;
}
