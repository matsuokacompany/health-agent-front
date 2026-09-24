'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plant, CalendarBlank } from '@phosphor-icons/react';
import { Button, Card } from '@/components/ui/design';
import { MetricCardSkeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatRelative } from '@/components/layout/switchers/NotificationBell';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { PatientHandoffButton } from '@/components/patient/PatientHandoffButton';
import { DEFAULT_PERIOD_DAYS, EvolutionCard, EvolutionPaywall, formatReportDate, PeriodSelector, SymptomsCard, validateCustomPeriod, type CustomRange, type PeriodSelection } from '@/components/patient/EvolutionReportSection';
import type { AppNotification, DailyReport, EvolutionReport, MonitoringPlan } from '@/lib/types';
import type { PatientDashboardAggregate } from '@/services/patientDashboard';
import { notificationsApi } from '@/services/notifications';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import { shortcutPeriod } from '@/services/aiReports';
import { toFriendlyErrorMessage } from '@/components/ui/errors';

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
    let status: PatientDashboardAggregate['timeline'][number]['status'] = 'no_response';
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
    <div className="patient-dashboard-controls-row">
      <div className="ai-shortcuts">{Array.from({ length: 5 }, (_, index) => <SkeletonBlock className="sk-action" key={index} />)}</div>
      <SkeletonBlock className="sk-action" />
    </div>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>
    <section className="patient-dashboard-summary-grid">
      {Array.from({ length: 8 }, (_, index) => <MetricCardSkeleton key={index} />)}
    </section>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-chart" /></Card>
  </section>;
}

const AGGREGATION_NOUN: Record<EvolutionReport['aggregation'], string> = { weekly: 'semana', monthly: 'mês', yearly: 'ano' };

function shortDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

/** Symptom-report rate per period bucket (the same weekly/monthly/yearly
 * groups already computed for the evolution report), so a patient can see
 * whether things are trending up or down over the selected period, not
 * just the single before/after number on the Tendência card. */
function SymptomRateTrendChart({ report }: { report: EvolutionReport }) {
  const groups = report.timeline;
  if (!report.sufficient_data || groups.length < 2) return null;
  const maxValue = Math.max(10, ...groups.map((group) => group.metrics.symptom_rate_percentage));
  const noun = AGGREGATION_NOUN[report.aggregation];

  return (
    <article className="card professional-trend-chart">
      <span className="eyebrow">Ao longo do período</span>
      <h2>Sintomas ao longo do tempo</h2>
      <p className="muted compact">Percentual de check-ins com sintomas, por {noun}.</p>
      <figure className="trend-chart-figure" aria-label="Percentual de check-ins com sintomas ao longo do período">
        <div className="trend-chart-bars" aria-hidden="true">
          {groups.map((group) => {
            const value = group.metrics.symptom_rate_percentage;
            const heightPct = Math.max((value / maxValue) * 100, value > 0 ? 10 : 3);
            return (
              <div className="trend-chart-column" key={group.start_date}>
                {value > 0 ? <span className="trend-chart-value">{value}%</span> : null}
                <span className="trend-chart-track">
                  <span className="trend-chart-bar chart-tooltip-trigger" style={{ height: `${heightPct}%` }} tabIndex={0}>
                    <span className="chart-tooltip" role="tooltip">
                      <strong>{value}% com sintomas</strong>
                      <span>{formatReportDate(group.start_date)} a {formatReportDate(group.end_date)}</span>
                    </span>
                  </span>
                </span>
                <span className="trend-chart-day">{shortDate(group.start_date)}</span>
              </div>
            );
          })}
        </div>
        <table className="sr-only">
          <caption>Percentual de check-ins com sintomas por {noun}</caption>
          <thead><tr><th>Período</th><th>Com sintomas</th></tr></thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.start_date}><td>{formatReportDate(group.start_date)} a {formatReportDate(group.end_date)}</td><td>{group.metrics.symptom_rate_percentage}%</td></tr>
            ))}
          </tbody>
        </table>
      </figure>
    </article>
  );
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
    <span className="patient-empty-icon"><Plant aria-hidden="true" weight="duotone" /></span>
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

export default function PatientDashboard() {
  const { reports, plans, loading: patientDataLoading, refresh } = usePatientData();
  const { user } = useAuth();
  const patientId = user ? Number(user.id) : undefined;
  const dashboard = buildFallbackDashboard(plans, reports);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD_DAYS);
  const [customRange, setCustomRange] = useState<CustomRange>({ start_date: '', end_date: '' });
  const customError = selectedPeriod === 'custom' && customRange.start_date && customRange.end_date
    ? validateCustomPeriod(customRange.start_date, customRange.end_date)
    : null;
  const period = useMemo(() => {
    if (selectedPeriod === 'custom') {
      if (!customRange.start_date || !customRange.end_date || validateCustomPeriod(customRange.start_date, customRange.end_date)) return null;
      return { start_date: customRange.start_date, end_date: customRange.end_date };
    }
    return shortcutPeriod(selectedPeriod);
  }, [selectedPeriod, customRange]);
  const [evolutionReport, setEvolutionReport] = useState<EvolutionReport | null>(null);
  const [evolutionBlocked, setEvolutionBlocked] = useState(false);
  const [loadingEvolution, setLoadingEvolution] = useState(true);

  useEffect(() => {
    if (!dashboard.hasActiveMonitoring) return;
    if (!period) { setEvolutionReport(null); setLoadingEvolution(false); return; }
    setLoadingEvolution(true);
    selfMonitoringApi.getEvolutionReport(period)
      .then((result) => { setEvolutionReport(result); setEvolutionBlocked(false); })
      .catch((err) => { if (err instanceof ApiError && err.status === 402) { setEvolutionReport(null); setEvolutionBlocked(true); } })
      .finally(() => setLoadingEvolution(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dashboard.hasActiveMonitoring]);

  if (patientDataLoading) return <LoadingDashboard />;
  if (!dashboard?.hasActiveMonitoring) {
    return <EmptyDashboard onStartSelfMonitoring={async () => {
      await selfMonitoringApi.createPlan();
      await refresh(true);
    }} />;
  }

  const upcomingFirstCheckin = dashboard.responses.expected === 0 ? firstCheckinDate(dashboard.startDate) : null;
  const symptoms = evolutionReport?.sufficient_data ? evolutionReport.symptoms : [];

  return <section className="patient-dashboard-v2" aria-label="Dashboard do paciente">
      <NoticesCard />
      {upcomingFirstCheckin ? <Card className="notice"><CalendarBlank aria-hidden="true" size={16} weight="duotone" /> Sua primeira mensagem de check-in por WhatsApp chega em {upcomingFirstCheckin}, por volta das 8h.</Card> : null}
      <div className="patient-dashboard-controls-row" data-tour="patient-period-controls">
        <PeriodSelector
          selected={selectedPeriod}
          onChange={setSelectedPeriod}
          disabled={loadingEvolution}
          onSelectCustom={() => setSelectedPeriod('custom')}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
          customError={customError}
        />
        {patientId ? (
          <PatientHandoffButton
            patientId={patientId}
            patientName={user?.name}
            startDate={period?.start_date}
            endDate={period?.end_date}
            disabled={selectedPeriod === 'custom' && !period}
          />
        ) : null}
      </div>
      {symptoms.length ? <SymptomsCard symptoms={symptoms} /> : null}
      <div className="stack" data-tour="patient-evolution">
        {evolutionBlocked ? <EvolutionPaywall /> : loadingEvolution ? (
          <section className="patient-dashboard-summary-grid">{Array.from({ length: 8 }, (_, index) => <MetricCardSkeleton key={index} />)}</section>
        ) : evolutionReport ? <EvolutionCard report={evolutionReport} hideSymptoms /> : null}
      </div>
      {evolutionReport ? <SymptomRateTrendChart report={evolutionReport} /> : null}
    </section>;
}
