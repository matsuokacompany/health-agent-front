'use client';

import { useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { formatRelative } from '@/components/layout/switchers/NotificationBell';
import type { AppNotification, DailyReport, MonitoringPlan } from '@/lib/types';
import type { PatientDashboardAggregate, PatientDashboardTimelineDay } from '@/services/patientDashboard';
import { notificationsApi } from '@/services/notifications';
import { redFlagCategoryLabel } from '@/lib/redFlagCategories';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import { toFriendlyErrorMessage } from '@/components/ui/errors';

const MONITORING_STATUS_WINDOW_DAYS = 30;
// Matches the longest window among ORANGE_COMBINATION_RULES on the backend
// (app/services/red_flag_symptoms.py) -- a laranja notification older than
// this is outside the pattern's own detection window and shouldn't still
// read as "current" on this standing indicator.
const ORANGE_STATUS_WINDOW_DAYS = 21;

function formatDate(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR').format(date);
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

function firstCheckinDate(startDate?: string | null) {
  if (!startDate) return null;
  // The scheduler creates each day's check-in for the *previous* calendar
  // day, run every morning — so the first one a brand-new plan is eligible
  // for lands the day after start_date, not on start_date itself. Format in
  // UTC since start_date arrives as a date-only string (parsed as UTC
  // midnight); formatting in the viewer's local timezone could shift it back
  // a day for negative UTC offsets like America/Sao_Paulo.
  const date = new Date(startDate.length <= 10 ? `${startDate}T00:00:00Z` : startDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + 1);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }).format(date);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
  const planStart = activePlan?.starts_at ?? activePlan?.start_date ?? null;
  const planEnd = activePlan?.ends_at ?? activePlan?.end_date ?? null;
  const daysTotal = diffDays(planStart, planEnd);
  const daysElapsed = planStart ? Math.min(daysTotal || diffDays(planStart, today), diffDays(planStart, today)) : 0;
  const expected = Math.max(planReports.length, daysElapsed, answeredReports.length);
  const progress = daysTotal ? Math.round((daysElapsed / daysTotal) * 100) : 0;
  const rate = expected ? Math.round((answeredReports.length / expected) * 100) : 0;
  const sortedAnswers = [...answeredReports].sort((a, b) => String(b.updated_at ?? b.report_date ?? '').localeCompare(String(a.updated_at ?? a.report_date ?? '')));
  const last = sortedAnswers[0];
  const reportsByDate = new Map(planReports.map((report) => [String(report.report_date ?? report.created_at ?? '').slice(0, 10), report]));
  const timeline = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (7 - index));
    const key = dateKey(day);
    const report = reportsByDate.get(key);
    let status: PatientDashboardTimelineDay['status'] = 'no_response';
    if (report && completedReport(report)) status = report.had_symptoms ? 'with_symptoms' : 'without_symptoms';
    if (report && !completedReport(report) && report.had_symptoms === true) status = 'mild_symptoms';
    return { date: key, status };
  });

  return {
    hasActiveMonitoring: Boolean(activePlan),
    goal: activePlan?.title ?? activePlan?.name ?? null,
    status: activePlan?.status ?? (activePlan?.active ? 'active' : null),
    startDate: planStart,
    endDate: planEnd,
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

function MonitoringStatusCard({ reports }: { reports: DailyReport[] }) {
  // The laranja (orange combination) tier isn't stored on any DailyReport --
  // it's patient-history-based, not tied to a single check-in -- so it only
  // ever surfaces as a Notification (see notify_symptom_combination_alert on
  // the backend). Fetched independently from `reports`, same pattern as
  // NoticesCard below.
  const [orangeNotice, setOrangeNotice] = useState<AppNotification | null>(null);

  useEffect(() => {
    let mounted = true;
    const windowStartMs = Date.now() - ORANGE_STATUS_WINDOW_DAYS * 86_400_000;
    notificationsApi.list()
      .then((result) => {
        if (!mounted) return;
        const match = result.items.find(
          (item) => item.kind === 'SYMPTOM_CLUSTER_ALERT' && new Date(item.created_at).getTime() >= windowStartMs,
        );
        setOrangeNotice(match ?? null);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const windowStart = dateKey(new Date(Date.now() - (MONITORING_STATUS_WINDOW_DAYS - 1) * 86_400_000));
  const latestRed = reports
    .filter((report) => report.red_flag_category && String(report.report_date ?? '').slice(0, 10) >= windowStart)
    .sort((a, b) => String(b.report_date ?? '').localeCompare(String(a.report_date ?? '')))[0];

  // Priority vermelho > laranja > verde -- a possible emergency always
  // takes the card over a "worth a short-term evaluation" pattern.
  const cardClassName = latestRed
    ? 'patient-monitoring-status-card has-alert'
    : orangeNotice
      ? 'patient-monitoring-status-card has-orange-alert'
      : 'patient-monitoring-status-card';

  return <Card className={cardClassName} data-tour="patient-monitoring-status">
    <span className="eyebrow">Status de monitoramento</span>
    {latestRed ? (
      <>
        <h2>🔴 Sinal de alerta identificado</h2>
        <p className="muted">{redFlagCategoryLabel(latestRed.red_flag_category!)} — {formatDate(latestRed.report_date)}</p>
      </>
    ) : orangeNotice ? (
      <>
        <h2>🟠 Padrão de sinais em observação</h2>
        <p className="muted">{orangeNotice.message}</p>
      </>
    ) : (
      <>
        <h2>🟢 Sem sinais de alerta</h2>
        <p className="muted">Nenhum sinal de alerta identificado nos últimos {MONITORING_STATUS_WINDOW_DAYS} dias.</p>
      </>
    )}
  </Card>;
}

function NoticesCard() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    let mounted = true;
    notificationsApi.list()
      .then((result) => { if (mounted) setItems(result.items.filter((item) => !item.read_at)); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function dismissAll() {
    setDismissing(true);
    try {
      await notificationsApi.markAllRead();
      setItems([]);
    } catch {
      // best-effort: the avisos just stay listed until the next successful attempt
    } finally {
      setDismissing(false);
    }
  }

  if (loading || !items.length) return null;

  return (
    <Card className="patient-dashboard-notices-card" data-tour="patient-notices">
      <div className="professional-section-heading">
        <div><span className="eyebrow">Avisos</span><h2>Para você</h2></div>
        <Button variant="secondary" onClick={dismissAll} loading={dismissing} loadingLabel="Marcando...">Marcar tudo como lido</Button>
      </div>
      <div className="patient-notices-list">
        {items.map((item) => <div className="patient-notice" key={item.id}><p>{item.message}</p><span className="muted">{formatRelative(item.created_at)}</span></div>)}
      </div>
    </Card>
  );
}

function LoadingDashboard() {
  return <section className="patient-dashboard-v2" aria-busy="true" aria-label="Carregando dashboard">
    <Card className="patient-dashboard-main-card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>
    <Card className="patient-dashboard-last-card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></Card>
    <section className="patient-dashboard-summary-grid">
      {Array.from({ length: 4 }, (_, index) => <Card key={index}><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-metric" /></Card>)}
    </section>
    <Card className="patient-dashboard-chart-card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-tile" /></Card>
    <Card className="patient-dashboard-timeline-card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></Card>
  </section>;
}

function EmptyDashboard({ onStartSelfMonitoring }: { onStartSelfMonitoring(): Promise<void> }) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      await onStartSelfMonitoring();
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  return <Card className="patient-dashboard-empty">
    <span className="patient-empty-icon">🌱</span>
    <h2>Nenhum acompanhamento ativo por enquanto</h2>
    <p className="muted">Assim que um profissional iniciar seu acompanhamento, você verá aqui o plano, a evolução, os registros recentes e a próxima mensagem automática.</p>
    <p className="muted">Prefere acompanhar seus próprios sintomas por conta própria, sem um profissional vinculado?</p>
    {error ? <p className="notice danger">{error}</p> : null}
    <div className="patient-empty-actions">
      <Button href="/patient/monitoring" variant="secondary">Ver área de acompanhamento</Button>
      <Button disabled={starting} loading={starting} loadingLabel="Iniciando..." onClick={handleStart}>Começar automonitoramento</Button>
    </div>
  </Card>;
}

function SummaryCards({ data }: { data: PatientDashboardAggregate }) {
  const lastDate = data.lastResponse?.date ? formatDate(data.lastResponse.date) : 'Ainda não enviada';
  return <section className="patient-dashboard-summary-grid" aria-label="Resumo do acompanhamento" data-tour="patient-summary">
    <Card><span className="metric-label">Dias acompanhados</span><div className="metric">{data.daysElapsed}</div><p className="muted compact">{data.daysTotal ? `de ${data.daysTotal} dias do plano` : 'Plano sem término informado'}</p></Card>
    <Card><span className="metric-label">Mensagens respondidas</span><div className="metric">{data.responses.answered}</div><p className="muted compact">de {data.responses.expected} esperadas</p></Card>
    <Card><span className="metric-label">Taxa de resposta</span><div className="metric">{data.responses.rate}%</div></Card>
    <Card><span className="metric-label">Última resposta enviada</span><div className="metric small-metric">{lastDate}</div></Card>
  </section>;
}

function SymptomsChart({ data }: { data: PatientDashboardAggregate }) {
  const total = data.symptoms.total || data.responses.answered || 0;
  const withoutPct = total ? Math.round((data.symptoms.withoutSymptoms / total) * 100) : 0;
  const withPct = total ? 100 - withoutPct : 0;
  return <Card className="patient-dashboard-chart-card" data-tour="patient-symptoms"><span className="eyebrow">Evolução</span><h2>Dias com e sem sintomas</h2><div className="patient-donut-wrap"><div className="patient-donut" style={{ background: `conic-gradient(var(--ok) 0 ${withoutPct}%, var(--warn) ${withoutPct}% 100%)` }}><span>{total}<small>respostas</small></span></div><div className="patient-donut-list"><p><i className="ok" />Sem sintomas: <strong>{data.symptoms.withoutSymptoms} dias</strong></p><p><i className="warn" />Com sintomas: <strong>{data.symptoms.withSymptoms + data.symptoms.mildSymptoms} dias</strong></p><p className="muted compact">Percentuais calculados apenas sobre mensagens respondidas ({withPct}% com sintomas).</p></div></div></Card>;
}

const timelineMeta: Record<PatientDashboardTimelineDay['status'], { icon: string; label: string; className: string }> = { without_symptoms: { icon: '🟢', label: 'respondeu sem sintomas', className: 'ok' }, mild_symptoms: { icon: '🟡', label: 'respondeu com sintomas leves', className: 'mild' }, with_symptoms: { icon: '🔴', label: 'respondeu com sintomas', className: 'alert' }, no_response: { icon: '⚪', label: 'não respondeu', className: 'empty' } };
function formatTimelineLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', '');
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');
  return `${weekday} ${date.getDate()} ${month}`;
}

function Timeline({ days }: { days: PatientDashboardTimelineDay[] }) {
  const today = dateKey(new Date());
  const visibleDays = days.filter((day) => day.date.slice(0, 10) < today).slice(-7);
  return <Card className="patient-dashboard-timeline-card"><span className="eyebrow">Últimos 7 dias</span><h2>Linha do tempo</h2><div className="patient-timeline-grid">{visibleDays.map((day) => { const meta = timelineMeta[day.status] ?? timelineMeta.no_response; return <span key={day.date} className={meta.className} title={`${formatDate(day.date)}: ${day.label ?? meta.label}`} aria-label={`${formatDate(day.date)}: ${meta.label}`}>{meta.icon}<small>{formatTimelineLabel(day.date)}</small></span>; })}</div><div className="patient-timeline-legend"><span>🟢 sem sintomas</span><span>🟡 leves</span><span>🔴 com sintomas</span><span>⚪ não respondeu</span></div></Card>;
}

function LastResponseCard({ data }: { data: PatientDashboardAggregate }) {
  return <Card className="patient-dashboard-last-card"><span className="eyebrow">Último registro</span><h2>{data.lastResponse?.date ? formatDate(data.lastResponse.date) : 'Sem resposta registrada'}</h2>{data.lastResponse?.time ? <strong>{data.lastResponse.time}</strong> : null}<p>{truncate(data.lastResponse?.summary)}</p></Card>;
}

export default function PatientDashboard() {
  const { reports, plans, loading: patientDataLoading, refresh } = usePatientData();
  const dashboard = buildFallbackDashboard(plans, reports);

  if (patientDataLoading) return <LoadingDashboard />;
  if (!dashboard?.hasActiveMonitoring) {
    return <EmptyDashboard onStartSelfMonitoring={async () => {
      await selfMonitoringApi.createPlan();
      await refresh(true);
    }} />;
  }

  const upcomingFirstCheckin = dashboard.responses.expected === 0 ? firstCheckinDate(dashboard.startDate) : null;

  return <section className="patient-dashboard-v2" aria-label="Dashboard do paciente">
      <MonitoringStatusCard reports={reports} />
      <NoticesCard />
      <Card className="patient-dashboard-main-card" data-tour="patient-plan"><span className="eyebrow">Acompanhamento</span><dl className="patient-objective-list"><div><dt>Plano</dt><dd>{dashboard.goal ?? 'Não informado'}</dd></div><div><dt>Início</dt><dd>{formatDate(dashboard.startDate)}</dd></div><div><dt>Término</dt><dd>{formatDate(dashboard.endDate)}</dd></div><div><dt>Status</dt><dd>{statusLabel(dashboard.status)}</dd></div></dl>
        {upcomingFirstCheckin ? <p className="notice">📅 Sua primeira mensagem de check-in por WhatsApp chega em {upcomingFirstCheckin}, por volta das 8h.</p> : null}
      </Card>
      <LastResponseCard data={dashboard} />
      <SummaryCards data={dashboard} />
      <SymptomsChart data={dashboard} />
      <Timeline days={dashboard.timeline} />
    </section>;
}
