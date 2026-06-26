'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { Button, Card, MetricCard, PageHeader } from '@/components/ui/design';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import type { DailyReport } from '@/lib/types';

type Range = '7' | '30' | '90' | 'custom';
const isAnswered = (report: DailyReport) => report.status === 'COMPLETED' || report.completed;
const hasSymptoms = (report: DailyReport) => Boolean(report.had_symptoms);

function inRange(report: DailyReport, range: Range, start: string, end: string) {
  if (!report.report_date) return true;
  const date = new Date(`${report.report_date}T00:00:00`);
  if (range === 'custom') return (!start || report.report_date >= start) && (!end || report.report_date <= end);
  const limit = new Date();
  limit.setDate(limit.getDate() - Number(range));
  return date >= limit;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { reports, loading } = usePatientData();
  const [range, setRange] = useState<Range>('30');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState('all');
  const [symptom, setSymptom] = useState('all');

  const filtered = useMemo(() => reports.filter((report) => {
    const statusMatch = status === 'all' || report.status === status;
    const symptomMatch = symptom === 'all' || (symptom === 'yes' ? hasSymptoms(report) : !hasSymptoms(report));
    return statusMatch && symptomMatch && inRange(report, range, start, end);
  }), [end, range, reports, start, status, symptom]);

  const stats = useMemo(() => {
    const received = filtered.length;
    const answered = filtered.filter(isAnswered).length;
    const symptomDays = filtered.filter(hasSymptoms).length;
    const unanswered = filtered.filter((report) => !isAnswered(report)).length;
    const sentDays = new Set(filtered.map((report) => report.report_date).filter(Boolean)).size;
    const adherence = received ? Math.round((answered / received) * 100) : 0;
    return { received, answered, adherence, sentDays, symptomDays, unanswered };
  }, [filtered]);

  const timeline = useMemo(() => filtered.slice(-10).map((report) => ({ date: report.report_date ?? `#${report.id}`, sent: 1, answered: isAnswered(report) ? 1 : 0, symptoms: hasSymptoms(report) ? 1 : 0 })), [filtered]);

  return <><PageHeader eyebrow="Portal do paciente" title={`Olá, ${user?.name ?? 'paciente'}`} description="Resumo do seu acompanhamento pelo WhatsApp com filtros, indicadores e evolução dos sintomas." action={<Button href="/patient/calendar">Abrir calendário</Button>} />
    <section className="filter-bar"><label>Período<select value={range} onChange={(event) => setRange(event.target.value as Range)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="custom">Personalizado</option></select></label>{range === 'custom' ? <><label>Início<input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label><label>Fim<input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label></> : null}<label>Profissional responsável<select disabled><option>{user?.name ? 'Equipe vinculada' : 'Carregando equipe'}</option></select></label><label>Tipo de sintoma<select value={symptom} onChange={(event) => setSymptom(event.target.value)}><option value="all">Todos</option><option value="yes">Com sintomas</option><option value="no">Sem sintomas</option></select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option><option value="COMPLETED">Respondido</option><option value="PENDING">Pendente</option><option value="EXPIRED">Expirado</option><option value="AWAITING_SYMPTOM_DESCRIPTION">Incompleto</option></select></label></section>
    {loading ? <CalendarSkeleton /> : <><section className="dashboard-grid"><MetricCard label="Mensagens enviadas" value={stats.received} /><MetricCard label="Mensagens respondidas" value={stats.answered} /><MetricCard label="Taxa de resposta" value={`${stats.adherence}%`} /><MetricCard label="Dias com mensagens" value={stats.sentDays} /><MetricCard label="Dias com sintomas" value={stats.symptomDays} /><MetricCard label="Dias sem resposta" value={stats.unanswered} /></section>
    <section className="split"><Card><span className="badge">📈 Linha temporal</span><h2>Enviadas x respondidas</h2><div className="chart-lines">{timeline.length ? timeline.map((item) => <div className="chart-row" key={item.date}><span>{item.date}</span><i style={{ width: `${Math.max(8, item.sent * 85)}%` }} /><b style={{ width: `${Math.max(8, item.answered * 85)}%` }} /></div>) : <EmptyState description="Sem dados para o filtro selecionado." />}</div></Card><Card><span className="badge">🧭 Sintomas</span><h2>Evolução dos sintomas</h2><div className="donut-list"><div><strong>{stats.symptomDays}</strong><span>Dias com sintomas</span></div><div><strong>{Math.max(0, stats.answered - stats.symptomDays)}</strong><span>Dias sem sintomas</span></div><div><strong>{stats.unanswered}</strong><span>Sem resposta</span></div></div></Card></section>
    <Card><h2>Últimos check-ins filtrados</h2>{filtered.length ? filtered.slice(0, 8).map((report) => <div className="list-row" key={report.id}><span>{report.report_date ?? `Registro #${report.id}`}</span><StatusBadge status={report.status} /></div>) : <EmptyState description="Nenhum check-in encontrado para os filtros." />}</Card></>}
  </>;
}
