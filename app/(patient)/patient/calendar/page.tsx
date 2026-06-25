<<<<<<< HEAD
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
=======
import { getCurrentUser } from '@/services/auth';
import { getReports } from '@/services/reports';
export default async function Calendar() { const user = await getCurrentUser('patient'); const reports = user ? await getReports(user, user.id) : []; return <main><div className="nav"><a href="/patient/dashboard">← Dashboard</a><span className="badge">Calendário</span></div><h1>Calendário</h1><div className="calendar">{reports.map((report) => <div className="day" key={report.id}><strong>{report.report_date.slice(5)}</strong><p>{report.completed ? 'Check-in concluído' : 'Pendente'}</p><small className={report.riskFlags.length ? 'danger' : 'muted'}>{report.riskFlags.join(', ') || 'sem alerta'}</small></div>)}</div></main>; }
>>>>>>> dda01fb (Decouple auth and API infrastructure)
