'use client';

import { RequireRole } from '@/components/auth/guards';
import { useAuth } from '@/components/auth/AuthProvider';

function CalendarContent() {
  const { user } = useAuth();

  return <main><div className="nav"><a href="/patient/dashboard">← Dashboard</a><span className="badge">Calendário</span></div><h1>Calendário</h1><p className="muted">Check-ins do paciente local #{user?.id} devem ser buscados em /api/daily-reports/ com JWT Supabase.</p></main>;
}

export default function Calendar() {
  return <RequireRole role="patient"><CalendarContent /></RequireRole>;
}
