'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { PatientLayout } from '@/components/layout/PatientLayout';
import { Button, Card, MetricCard, PageHeader } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import type { DailyReport } from '@/lib/types';
import { dailyReportsApi } from '@/services/dailyReports';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);

  useEffect(() => { dailyReportsApi.list().then(setReports).catch(() => setReports([])); }, []);

  const stats = useMemo(() => {
    const received = reports.length;
    const answered = reports.filter((report) => report.status === 'COMPLETED' || report.completed).length;
    const adherence = received ? Math.round((answered / received) * 100) : 0;
    return { received, answered, adherence };
  }, [reports]);

  return <PatientLayout><PageHeader eyebrow="Portal do paciente" title={`Olá, ${user?.name ?? 'paciente'}`} description="Acompanhe seus check-ins em um só lugar. O calendário é a principal área para revisar dias respondidos, pendentes e incompletos." action={<Button href="/patient/calendar">Abrir calendário</Button>} />
    <section className="grid priority-grid"><MetricCard label="Check-ins respondidos" value={stats.answered} description="Registros enviados para a equipe." /><MetricCard label="Check-ins recebidos" value={stats.received} description="Solicitações disponíveis no período." /><MetricCard label="Adesão" value={`${stats.adherence}%`} description="Quanto mais constante, melhor o acompanhamento." /></section>
    <section className="split"><Card><h2>Próxima ação</h2><p className="muted">Use o calendário para encontrar o dia desejado, consultar a resposta e editar quando o check-in ainda permitir alterações.</p><Button href="/patient/calendar" variant="secondary">Ver calendário</Button></Card><Card><h2>Últimos check-ins</h2>{reports.length ? reports.slice(0, 4).map((report) => <div className="list-row" key={report.id}><span>{report.report_date ?? `Registro #${report.id}`}</span><StatusBadge status={report.status} /></div>) : <EmptyState description="Nenhum check-in recebido até o momento." />}</Card></section>
  </PatientLayout>;
}
