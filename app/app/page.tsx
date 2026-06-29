'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button, Card, MetricCard, PageHeader } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import type { Anamnese, DailyReport, MonitoringPlan } from '@/lib/types';
import { anamnesesApi } from '@/services/anamnese';
import { dailyReportsApi } from '@/services/dailyReports';
import { monitoringApi } from '@/services/monitoring';

function Page() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MonitoringPlan[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [hasAnamnese, setHasAnamnese] = useState(true);

  useEffect(() => {
    if (!user) return;
    monitoringApi.listPatientPlans(Number(user.id)).then(setPlans).catch(() => setPlans([]));
    dailyReportsApi.list().then(setReports).catch(() => setReports([]));
    anamnesesApi.me().then((a: Anamnese) => setHasAnamnese(Boolean(a))).catch(() => setHasAnamnese(false));
  }, [user]);

  const active = plans.find((plan) => plan.active || plan.status === 'active');
  const stats = useMemo(() => {
    const received = reports.length;
    const answered = reports.filter((report) => report.status === 'COMPLETED' || report.completed).length;
    return { received, answered, adherence: received ? Math.round((answered / received) * 100) : 0 };
  }, [reports]);

  return <><div className="topbar"><span className="badge">Área do paciente</span><Link href="/change-password">Alterar senha</Link></div><PageHeader title={`Olá, ${user?.name ?? 'paciente'}`} description="Veja somente o essencial para manter seu acompanhamento em dia." action={<Button href="/app/perfil" variant="secondary">Editar perfil</Button>} />{!user?.phone ? <p className="notice danger">Complete seu telefone em Perfil para habilitar contatos operacionais.</p> : null}{!hasAnamnese ? <p className="notice"><Link href="/app/anamnese">Preencha sua anamnese</Link> para iniciar acompanhamento clínico.</p> : null}<section className="grid priority-grid"><MetricCard label="Respondidos" value={stats.answered} /><MetricCard label="Recebidos" value={stats.received} /><MetricCard label="Adesão" value={`${stats.adherence}%`} /></section><section className="split"><Card><h2>Plano ativo</h2>{active ? <p>{active.name ?? `Plano #${active.id}`}</p> : <EmptyState title="Monitoramento ainda não iniciado" />}</Card><Card><h2>Últimos check-ins</h2>{reports.length ? reports.slice(0, 5).map((report) => <div className="list-row" key={report.id}><span>{report.report_date ?? `#${report.id}`}</span><StatusBadge status={report.status} /></div>) : <EmptyState description="Nenhum daily report recebido." />}</Card></section></>;
}
export default Page;
