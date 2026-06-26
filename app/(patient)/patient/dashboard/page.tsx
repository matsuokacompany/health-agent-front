'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { Button, Card, MetricCard, PageHeader } from '@/components/ui/design';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/states';
import { StatusBadge } from '@/components/ui/badges';
import { createMockPatientDashboardData, filterReportsByDashboardPeriod, type DashboardRange } from '@/services/patientDashboard';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { reports, loading } = usePatientData();
  const [range, setRange] = useState<DashboardRange>('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filters = useMemo(() => ({ range, startDate, endDate }), [endDate, range, startDate]);
  const dashboard = useMemo(() => createMockPatientDashboardData(reports, filters), [filters, reports]);
  const filteredReports = useMemo(() => filterReportsByDashboardPeriod(reports, filters), [filters, reports]);
  const maxTimelineValue = Math.max(1, ...dashboard.timeline.map((point) => point.sent));
  const totalSymptomChart = Math.max(1, dashboard.symptoms.withSymptoms + dashboard.symptoms.withoutSymptoms + dashboard.symptoms.unanswered);

  return <><PageHeader eyebrow="Portal do paciente" title={`Olá, ${user?.name ?? 'paciente'}`} description="Dashboard temporário com dados derivados dos check-ins até o backend de métricas ficar disponível." action={<Button href="/patient/calendar">Abrir calendário</Button>} />
    <section className="filter-bar"><label>Período<select value={range} onChange={(event) => setRange(event.target.value as DashboardRange)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="custom">Período personalizado</option></select></label>{range === 'custom' ? <><label>Data inicial<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>Data final<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></> : null}</section>
    {loading ? <CalendarSkeleton /> : <><section className="dashboard-grid patient-metrics-grid"><MetricCard label="Total de mensagens enviadas" value={dashboard.metrics.totalMessagesSent} /><MetricCard label="Total de mensagens respondidas" value={dashboard.metrics.totalMessagesAnswered} /><MetricCard label="Taxa de resposta" value={`${dashboard.metrics.responseRate}%`} /><MetricCard label="Dias com sintomas" value={dashboard.metrics.symptomDays} /><MetricCard label="Dias sem resposta" value={dashboard.metrics.unansweredDays} /></section>
    <section className="split"><Card><span className="badge">📈 Gráfico temporal</span><h2>Mensagens enviadas e respondidas</h2><div className="timeline-chart">{dashboard.timeline.length ? dashboard.timeline.map((point) => <div className="timeline-row" key={point.date}><span>{point.date}</span><div className="timeline-bars"><i style={{ width: `${(point.sent / maxTimelineValue) * 100}%` }} title={`${point.sent} enviadas`} /><b style={{ width: `${(point.answered / maxTimelineValue) * 100}%` }} title={`${point.answered} respondidas`} /></div></div>) : <EmptyState description="Sem mensagens no período selecionado." />}</div><div className="chart-legend"><span><i className="legend-sent" /> Enviadas</span><span><i className="legend-answered" /> Respondidas</span></div></Card><Card><span className="badge">🩺 Gráfico de sintomas</span><h2>Sintomas no período</h2><div className="symptom-chart" aria-label="Distribuição de sintomas"><span className="symptom-yes" style={{ flexGrow: dashboard.symptoms.withSymptoms / totalSymptomChart }} /><span className="symptom-no" style={{ flexGrow: dashboard.symptoms.withoutSymptoms / totalSymptomChart }} /><span className="symptom-missing" style={{ flexGrow: dashboard.symptoms.unanswered / totalSymptomChart }} /></div><div className="donut-list"><div><strong>{dashboard.symptoms.withSymptoms}</strong><span>Dias com sintomas</span></div><div><strong>{dashboard.symptoms.withoutSymptoms}</strong><span>Dias sem sintomas</span></div><div><strong>{dashboard.symptoms.unanswered}</strong><span>Dias sem resposta</span></div></div></Card></section>
    <Card><h2>Últimas mensagens do período</h2>{filteredReports.length ? filteredReports.slice(0, 8).map((report) => <div className="list-row" key={report.id}><span>{report.report_date ?? `Registro #${report.id}`}</span><StatusBadge status={report.status} /></div>) : <EmptyState description="Nenhuma mensagem encontrada para o período selecionado." />}</Card></>}
  </>;
}
