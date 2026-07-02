'use client';

import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { usePatientDashboard } from '@/hooks/usePatientDashboard';
import type { DailyReport, MonitoringPlan } from '@/lib/types';
import type { PatientDashboardAggregate, PatientDashboardTimelineDay } from '@/services/patientDashboard';

function formatDate(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function statusLabel(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();
  if (['active', 'em_andamento', 'ongoing'].includes(normalized)) return '🟢 Em andamento';
  if (['paused', 'pausado'].includes(normalized)) return '🟡 Pausado';
  if (['finished', 'completed', 'encerrado'].includes(normalized)) return '⚪ Encerrado';
  return status ? `🟢 ${status}` : 'Não informado';
}

function truncate(text?: string | null) {
  if (!text) return 'Nenhum resumo disponível.';
  return text.length > 150 ? `${text.slice(0, 147).trim()}...` : text;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function diffDays(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const startDate = new Date(`${start.slice(0, 10)}T00:00:00`);
  const endDate = new Date(`${end.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  return Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1);
}

function completedReport(report: DailyReport) {
  return report.completed || String(report.status).toUpperCase() === 'COMPLETED';
}

function buildFallbackDashboard(plans: MonitoringPlan[], reports: DailyReport[]): PatientDashboardAggregate {
  const activePlan = plans.find((plan) => plan.active || String(plan.status ?? '').toLowerCase() === 'active') ?? plans[0];
  const today = dateKey(new Date());
  const planReports = activePlan ? reports.filter((report) => !report.monitoring_plan_id || String(report.monitoring_plan_id) === String(activePlan.id)) : reports;
  const answeredReports = planReports.filter(completedReport);
  const withSymptoms = answeredReports.filter((report) => report.had_symptoms === true).length;
  const withoutSymptoms = answeredReports.filter((report) => report.had_symptoms === false).length;
  const daysTotal = diffDays(activePlan?.starts_at, activePlan?.ends_at);
  const daysElapsed = activePlan?.starts_at ? Math.min(daysTotal || diffDays(activePlan.starts_at, today), diffDays(activePlan.starts_at, today)) : 0;
  const expected = Math.max(planReports.length, daysElapsed, answeredReports.length);
  const progress = daysTotal ? Math.round((daysElapsed / daysTotal) * 100) : 0;
  const rate = expected ? Math.round((answeredReports.length / expected) * 100) : 0;
  const sortedAnswers = [...answeredReports].sort((a, b) => String(b.updated_at ?? b.report_date ?? '').localeCompare(String(a.updated_at ?? a.report_date ?? '')));
  const last = sortedAnswers[0];
  const reportsByDate = new Map(planReports.map((report) => [String(report.report_date ?? report.created_at ?? '').slice(0, 10), report]));
  const timeline = Array.from({ length: 30 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (29 - index));
    const key = dateKey(day);
    const report = reportsByDate.get(key);
    let status: PatientDashboardTimelineDay['status'] = 'no_response';
    if (report && completedReport(report)) status = report.had_symptoms ? 'with_symptoms' : 'without_symptoms';
    if (report && !completedReport(report) && report.had_symptoms === true) status = 'mild_symptoms';
    return { date: key, status };
  });

  return {
    hasActiveMonitoring: Boolean(activePlan),
    goal: activePlan?.name ?? null,
    status: activePlan?.status ?? (activePlan?.active ? 'active' : null),
    startDate: activePlan?.starts_at ?? null,
    endDate: activePlan?.ends_at ?? null,
    progress: Math.min(100, Math.max(0, progress)),
    daysElapsed,
    daysTotal,
    responses: { answered: answeredReports.length, expected, rate: Math.min(100, Math.max(0, rate)) },
    symptoms: { withSymptoms, withoutSymptoms, mildSymptoms: 0, total: answeredReports.length },
    timeline,
    lastResponse: last ? { date: last.report_date ?? last.updated_at ?? null, time: last.updated_at ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(last.updated_at)) : null, summary: last.symptom_description ?? last.cause ?? (last.had_symptoms ? 'Paciente registrou sintomas.' : 'Paciente respondeu sem sintomas.') } : null,
    nextPrompt: null,
  };
}

function LoadingDashboard() {
  return <section className="patient-dashboard-v2"><Card className="patient-dashboard-main-card"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card></section>;
}

function EmptyDashboard() {
  return <Card className="patient-dashboard-empty"><span className="patient-empty-icon">🌱</span><h2>Nenhum acompanhamento ativo por enquanto</h2><p className="muted">Assim que um profissional iniciar seu acompanhamento, você verá aqui o objetivo, a evolução, os registros recentes e a próxima mensagem automática.</p><Button href="/patient/monitoring" variant="secondary">Ver área de acompanhamento</Button></Card>;
}

function ProgressCard({ data }: { data: PatientDashboardAggregate }) {
  return <Card className="patient-dashboard-progress-card"><div className="patient-card-heading"><span className="eyebrow">Progresso</span><strong>{data.progress}%</strong></div><div className="patient-progress-track" aria-label={`Progresso de ${data.progress}%`}><span style={{ width: `${data.progress}%` }} /></div><p className="muted compact">{data.daysElapsed} de {data.daysTotal} dias de acompanhamento.</p></Card>;
}

function SummaryCards({ data }: { data: PatientDashboardAggregate }) {
  const lastDate = data.lastResponse?.date ? formatDate(data.lastResponse.date) : 'Ainda não enviada';
  return <section className="patient-dashboard-summary-grid" aria-label="Resumo do acompanhamento">
    <Card><span className="metric-label">Dias acompanhados</span><div className="metric">{data.daysElapsed}</div></Card>
    <Card><span className="metric-label">Mensagens respondidas</span><div className="metric">{data.responses.answered}</div><p className="muted compact">de {data.responses.expected} esperadas</p></Card>
    <Card><span className="metric-label">Taxa de resposta</span><div className="metric">{data.responses.rate}%</div></Card>
    <Card><span className="metric-label">Última resposta enviada</span><div className="metric small-metric">{lastDate}</div></Card>
  </section>;
}

function SymptomsChart({ data }: { data: PatientDashboardAggregate }) {
  const total = data.symptoms.total || data.responses.answered || 0;
  const withoutPct = total ? Math.round((data.symptoms.withoutSymptoms / total) * 100) : 0;
  const withPct = total ? 100 - withoutPct : 0;
  return <Card className="patient-dashboard-chart-card"><span className="eyebrow">Evolução</span><h2>Dias com e sem sintomas</h2><div className="patient-donut-wrap"><div className="patient-donut" style={{ background: `conic-gradient(var(--ok) 0 ${withoutPct}%, var(--warn) ${withoutPct}% 100%)` }}><span>{total}<small>respostas</small></span></div><div className="patient-donut-list"><p><i className="ok" />Sem sintomas: <strong>{data.symptoms.withoutSymptoms} dias</strong></p><p><i className="warn" />Com sintomas: <strong>{data.symptoms.withSymptoms + data.symptoms.mildSymptoms} dias</strong></p><p className="muted compact">Percentuais calculados apenas sobre mensagens respondidas ({withPct}% com sintomas).</p></div></div></Card>;
}

const timelineMeta: Record<PatientDashboardTimelineDay['status'], { icon: string; label: string; className: string }> = { without_symptoms: { icon: '🟢', label: 'respondeu sem sintomas', className: 'ok' }, mild_symptoms: { icon: '🟡', label: 'respondeu com sintomas leves', className: 'mild' }, with_symptoms: { icon: '🔴', label: 'respondeu com sintomas', className: 'alert' }, no_response: { icon: '⚪', label: 'não respondeu', className: 'empty' } };
function Timeline({ days }: { days: PatientDashboardTimelineDay[] }) {
  return <Card className="patient-dashboard-timeline-card"><span className="eyebrow">Últimos 30 dias</span><h2>Linha do tempo</h2><div className="patient-timeline-grid">{days.map((day) => { const meta = timelineMeta[day.status] ?? timelineMeta.no_response; return <span key={day.date} className={meta.className} title={`${formatDate(day.date)}: ${day.label ?? meta.label}`} aria-label={`${formatDate(day.date)}: ${meta.label}`}>{meta.icon}<small>{new Date(`${day.date}T00:00:00`).getDate()}</small></span>; })}</div><div className="patient-timeline-legend"><span>🟢 sem sintomas</span><span>🟡 leves</span><span>🔴 com sintomas</span><span>⚪ não respondeu</span></div></Card>;
}

function NextPrompt({ data }: { data: PatientDashboardAggregate }) {
  const scheduled = formatDateTime(data.nextPrompt?.scheduled_at) ?? (data.nextPrompt?.date ? `${formatDate(data.nextPrompt.date)}${data.nextPrompt.time ? ` às ${data.nextPrompt.time}` : ''}` : null);
  return <Card className="patient-dashboard-next-card"><span className="eyebrow">Próxima mensagem</span><h2>{scheduled ?? 'Nenhuma próxima mensagem agendada'}</h2><p className="muted compact">{scheduled ? 'Envio automático previsto para o próximo contato.' : 'Quando houver um novo envio automático, ele aparecerá aqui.'}</p></Card>;
}

export default function PatientDashboard() {
  const { reports, plans, loading: patientDataLoading } = usePatientData();
  const { data, isLoading, error } = usePatientDashboard();
  const fallbackData = buildFallbackDashboard(plans, reports);
  const dashboard = data ?? (error || fallbackData.hasActiveMonitoring ? fallbackData : undefined);

  if (!dashboard && (isLoading || patientDataLoading)) return <LoadingDashboard />;
  if (!dashboard?.hasActiveMonitoring) return <EmptyDashboard />;

  return <section className="patient-dashboard-v2" aria-label="Dashboard do paciente">
      <Card className="patient-dashboard-main-card"><span className="eyebrow">Acompanhamento</span><h2>{dashboard.goal ?? 'Objetivo não informado'}</h2><dl className="patient-objective-list"><div><dt>Objetivo</dt><dd>{dashboard.goal ?? 'Não informado'}</dd></div><div><dt>Início</dt><dd>{formatDate(dashboard.startDate)}</dd></div><div><dt>Término</dt><dd>{formatDate(dashboard.endDate)}</dd></div><div><dt>Status</dt><dd>{statusLabel(dashboard.status)}</dd></div></dl></Card>
      <ProgressCard data={dashboard} />
      <SummaryCards data={dashboard} />
      <SymptomsChart data={dashboard} />
      <Timeline days={dashboard.timeline} />
      <Card className="patient-dashboard-last-card"><span className="eyebrow">Último registro</span><h2>{dashboard.lastResponse?.date ? formatDate(dashboard.lastResponse.date) : 'Sem resposta registrada'}</h2>{dashboard.lastResponse?.time ? <strong>{dashboard.lastResponse.time}</strong> : null}<p>{truncate(dashboard.lastResponse?.summary)}</p></Card>
      <NextPrompt data={dashboard} />
    </section>;
}
