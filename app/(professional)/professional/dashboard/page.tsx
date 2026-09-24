'use client';
import Link from 'next/link';
import { useProfessionalDashboardOverview } from '@/hooks/useProfessional';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { MetricCardSkeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { UsersThree, Warning } from '@phosphor-icons/react';
import type { ProfessionalDashboardAdherenceEntry, ProfessionalDashboardMonthlySymptomCount, ProfessionalDashboardRedFlag } from '@/services/professional';

function LoadingDashboard() {
  return <div aria-busy="true" aria-label="Carregando dashboard">
    <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></article>
    <section className="split professional-detail-section">
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-chart" /></article>
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></article>
    </section>
    <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-chart" /></article>
  </div>;
}

function fmt(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

const RED_FLAG_LOOKBACK_DAYS = 14;

/** Pacientes ativos + sinais de risco relatados together -- the KPI and the
 * list it explains live in one card now, in the slot the KPI used to occupy
 * alone. */
function ActivePatientsCard({ activePatients, redFlags }: { activePatients: number; redFlags: ProfessionalDashboardRedFlag[] }) {
  return (
    <article className="card" data-tour="professional-dashboard-patients">
      <div className="professional-section-heading">
        <div>
          <span className="eyebrow">Últimos {RED_FLAG_LOOKBACK_DAYS} dias</span>
          <h2>Sintomas de risco relatados</h2>
        </div>
        <div className="professional-active-patients-stat">
          <span className="metric-icon" aria-hidden="true"><UsersThree size={22} weight="duotone" /></span>
          <div>
            <strong>{activePatients}</strong>
            <span className="muted compact">{activePatients === 1 ? 'paciente ativo' : 'pacientes ativos'}</span>
          </div>
        </div>
      </div>
      {redFlags.length ? (
        <ul className="professional-red-flags-list">
          {redFlags.map((flag) => (
            <li key={`${flag.patient_id}-${flag.report_date}-${flag.category_key}`}>
              <Link href={`/professional/patients/${flag.patient_id}/checkins` as never}>
                <span className="badge risk-alto"><Warning aria-hidden="true" size={14} weight="fill" />{flag.category_label}</span>
                <strong>{flag.patient_name}</strong>
                <span className="muted compact">{fmt(flag.report_date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState description={`Nenhum sintoma de risco relatado pelos seus pacientes nos últimos ${RED_FLAG_LOOKBACK_DAYS} dias.`} />
      )}
    </article>
  );
}

const SYMPTOMS_MONTHS_WINDOW = 6;
const SYMPTOMS_CHART_WIDTH = 640;
const SYMPTOMS_CHART_HEIGHT = 180;
const SYMPTOMS_PADDING = { top: 28, right: 16, bottom: 8, left: 16 };

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(year, month - 1, 1)).replace('.', '');
}

function monthRangeLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

/** Monthly count of symptom reports over the trend window, oldest first,
 * last on the dashboard and full-width -- the longest-range view, so it
 * gets the most room. A single series, so it's a line: the value moving
 * over time is the point, not comparing categories. */
function SymptomsByMonthChart({ data }: { data: ProfessionalDashboardMonthlySymptomCount[] }) {
  const months = Array.from({ length: SYMPTOMS_MONTHS_WINDOW }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (SYMPTOMS_MONTHS_WINDOW - 1 - index));
    return monthKey(date);
  });
  const counts = new Map(data.map((entry) => [entry.month, entry.count]));
  const maxCount = Math.max(1, ...months.map((month) => counts.get(month) ?? 0));
  const total = months.reduce((sum, month) => sum + (counts.get(month) ?? 0), 0);

  const plotWidth = SYMPTOMS_CHART_WIDTH - SYMPTOMS_PADDING.left - SYMPTOMS_PADDING.right;
  const plotHeight = SYMPTOMS_CHART_HEIGHT - SYMPTOMS_PADDING.top - SYMPTOMS_PADDING.bottom;
  const xFor = (index: number) => SYMPTOMS_PADDING.left + (months.length === 1 ? plotWidth / 2 : (index / (months.length - 1)) * plotWidth);
  const yFor = (count: number) => SYMPTOMS_PADDING.top + (1 - count / maxCount) * plotHeight;
  const points = months.map((month, index) => ({ month, index, count: counts.get(month) ?? 0 }));

  return (
    <article className="card professional-trend-chart" data-tour="professional-dashboard-monthly">
      <span className="eyebrow">Últimos {SYMPTOMS_MONTHS_WINDOW} meses</span>
      <h2>Sintomas por mês</h2>
      <p className="muted compact">{total} {total === 1 ? 'registro' : 'registros'} de sintomas no período, somando todos os pacientes.</p>
      <figure className="line-chart-figure" aria-label={`Sintomas por mês nos últimos ${SYMPTOMS_MONTHS_WINDOW} meses: ${total} no total`}>
        <div className="line-chart-plot" style={{ aspectRatio: `${SYMPTOMS_CHART_WIDTH} / ${SYMPTOMS_CHART_HEIGHT}` }}>
          <svg viewBox={`0 0 ${SYMPTOMS_CHART_WIDTH} ${SYMPTOMS_CHART_HEIGHT}`} className="line-chart-svg" aria-hidden="true">
            <polyline
              points={points.map((point) => `${xFor(point.index)},${yFor(point.count)}`).join(' ')}
              fill="none"
              stroke="var(--danger)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((point) => (
              <circle key={point.month} cx={xFor(point.index)} cy={yFor(point.count)} r={4} fill="var(--danger)" stroke="var(--surface)" strokeWidth={2} />
            ))}
            {points.length ? (
              <text
                x={xFor(points[points.length - 1].index)}
                y={yFor(points[points.length - 1].count) - 10}
                textAnchor="end"
                className="line-chart-endpoint-label"
              >
                {points[points.length - 1].count}
              </text>
            ) : null}
          </svg>
          {points.map((point) => (
            <span
              key={`${point.month}-hit`}
              className="chart-point-hit chart-tooltip-trigger"
              tabIndex={0}
              style={{ left: `${(xFor(point.index) / SYMPTOMS_CHART_WIDTH) * 100}%`, top: `${(yFor(point.count) / SYMPTOMS_CHART_HEIGHT) * 100}%` }}
            >
              <span className="chart-tooltip" role="tooltip">
                <strong>{point.count} {point.count === 1 ? 'registro' : 'registros'}</strong>
                <span>{monthRangeLabel(point.month)}</span>
              </span>
            </span>
          ))}
        </div>
        <div className="line-chart-axis" aria-hidden="true">
          {points.map((point) => <span key={point.month}>{monthLabel(point.month)}</span>)}
        </div>
        <table className="sr-only">
          <caption>Sintomas por mês, últimos {SYMPTOMS_MONTHS_WINDOW} meses</caption>
          <thead><tr><th>Mês</th><th>Sintomas</th></tr></thead>
          <tbody>
            {points.map((point) => <tr key={point.month}><td>{monthRangeLabel(point.month)}</td><td>{point.count}</td></tr>)}
          </tbody>
        </table>
      </figure>
    </article>
  );
}

const ADHERENCE_WINDOW_DAYS = 30;
const ADHERENCE_BUCKET_DAYS = 7;
const ADHERENCE_BUCKET_COUNT = Math.ceil(ADHERENCE_WINDOW_DAYS / ADHERENCE_BUCKET_DAYS);
// Every bar beyond this many patients folds into a single "Outros
// pacientes" average bar, colored gray instead of minting a new hue --
// past this count no fixed categorical order can keep every pair of bars
// distinguishable.
const ADHERENCE_MAX_SERIES = 8;

function dateKeyOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Mirrors the backend's 7-day bucketing (professional_service.py) so the
 * X axis is stable even for a patient with gaps -- oldest bucket first. */
function buildAdherenceWeeks(): string[] {
  const today = new Date();
  return Array.from({ length: ADHERENCE_BUCKET_COUNT }, (_, i) => {
    const bucketIndex = ADHERENCE_BUCKET_COUNT - 1 - i;
    const date = new Date(today);
    date.setDate(date.getDate() - ((bucketIndex + 1) * ADHERENCE_BUCKET_DAYS - 1));
    return dateKeyOf(date);
  });
}

function weekLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`));
}

/** Per-patient check-in adherence as one bar per patient within each
 * weekly group over the last {ADHERENCE_WINDOW_DAYS} days -- comparing
 * patients against each other is the job here, so grouped bars (not a
 * shared line each) keep each patient's value easy to read off at a
 * glance for any given week. */
function PatientAdherenceChart({ data }: { data: ProfessionalDashboardAdherenceEntry[] }) {
  if (!data.length) {
    return (
      <article className="card" data-tour="professional-dashboard-adherence">
        <span className="eyebrow">Últimos {ADHERENCE_WINDOW_DAYS} dias</span>
        <h2>Adesão dos pacientes</h2>
        <EmptyState description="Nenhum check-in registrado pelos seus pacientes no período." />
      </article>
    );
  }

  const weeks = buildAdherenceWeeks();
  const shown = data.slice(0, ADHERENCE_MAX_SERIES);
  const overflow = data.slice(ADHERENCE_MAX_SERIES);

  type Series = { key: string; name: string; color: string; points: { index: number; value: number }[] };
  const series: Series[] = shown.map((entry, seriesIndex) => ({
    key: `patient-${entry.patient_id}`,
    name: entry.patient_name,
    color: `var(--chart-series-${seriesIndex + 1})`,
    points: entry.weekly
      .map((point) => ({ index: weeks.indexOf(point.week_start.slice(0, 10)), value: point.adherence_percentage }))
      .filter((point) => point.index >= 0),
  }));

  if (overflow.length) {
    const overflowByWeek = new Map<number, number[]>();
    for (const entry of overflow) {
      for (const point of entry.weekly) {
        const index = weeks.indexOf(point.week_start.slice(0, 10));
        if (index < 0) continue;
        overflowByWeek.set(index, [...(overflowByWeek.get(index) ?? []), point.adherence_percentage]);
      }
    }
    series.push({
      key: 'others',
      name: `Outros pacientes (${overflow.length})`,
      color: 'var(--muted)',
      points: Array.from(overflowByWeek.entries())
        .map(([index, values]) => ({ index, value: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 }))
        .sort((a, b) => a.index - b.index),
    });
  }

  return (
    <article className="card" data-tour="professional-dashboard-adherence">
      <span className="eyebrow">Últimos {ADHERENCE_WINDOW_DAYS} dias</span>
      <h2>Adesão dos pacientes</h2>
      <p className="muted compact">Percentual de check-ins concluídos por semana, por paciente.</p>
      <figure className="trend-chart-figure" aria-label={`Adesão semanal dos pacientes nos últimos ${ADHERENCE_WINDOW_DAYS} dias`}>
        <div className="trend-chart-bars" aria-hidden="true">
          {weeks.map((week, weekIndex) => (
            <div className="trend-chart-column" key={week}>
              <div className="trend-chart-group">
                {series.map((line) => {
                  const point = line.points.find((candidate) => candidate.index === weekIndex);
                  if (!point) return null;
                  const heightPct = Math.max(point.value, point.value > 0 ? 6 : 2);
                  return (
                    <span
                      key={line.key}
                      className="trend-chart-group-bar chart-tooltip-trigger"
                      style={{ height: `${heightPct}%`, background: line.color }}
                      tabIndex={0}
                    >
                      <span className="chart-tooltip" role="tooltip">
                        <strong>{point.value}%</strong>
                        <span>{line.name}</span>
                        <span className="muted">semana de {weekLabel(week)}</span>
                      </span>
                    </span>
                  );
                })}
              </div>
              <span className="trend-chart-day">{weekLabel(week)}</span>
            </div>
          ))}
        </div>
        <ul className="chart-legend">
          {series.map((line) => (
            <li key={line.key}>
              <span className="chart-legend-swatch chart-legend-swatch-bar" style={{ background: line.color }} aria-hidden="true" />
              {line.name}
            </li>
          ))}
        </ul>
        <table className="sr-only">
          <caption>Adesão semanal por paciente, últimos {ADHERENCE_WINDOW_DAYS} dias</caption>
          <thead><tr><th>Paciente</th><th>Semana</th><th>Adesão</th></tr></thead>
          <tbody>
            {series.flatMap((line) => line.points.map((point) => (
              <tr key={`${line.key}-row-${point.index}`}><td>{line.name}</td><td>{weekLabel(weeks[point.index])}</td><td>{point.value}%</td></tr>
            )))}
          </tbody>
        </table>
      </figure>
    </article>
  );
}

export default function ProfessionalDashboard() {
  const { data, isLoading, error } = useProfessionalDashboardOverview();

  if (isLoading) return <LoadingDashboard />;
  if (error) return <ErrorState message={error.message} />;

  const redFlags = data?.red_flags ?? [];
  const topSymptoms = data?.top_symptoms ?? [];
  const adherence = data?.adherence ?? [];
  const symptomsByMonth = data?.symptoms_by_month ?? [];
  const maxCount = topSymptoms.reduce((max, term) => Math.max(max, term.count), 0);

  return (
    <div className="stack">
      <ActivePatientsCard activePatients={data?.active_patients ?? 0} redFlags={redFlags} />
      <section className="split professional-detail-section">
        <PatientAdherenceChart data={adherence} />
        <article className="card" data-tour="professional-dashboard-top-symptoms">
          <span className="eyebrow">Todos os pacientes</span>
          <h2>Sintomas mais relatados</h2>
          {topSymptoms.length ? (
            <ul className="patient-symptom-terms-list">
              {topSymptoms.map((term) => (
                <li key={term.label} title={`${term.label}: ${term.count} registro(s)`}>
                  <span className="patient-symptom-term-row">
                    <span className="patient-symptom-term-label">{term.label}</span>
                    <span className="patient-symptom-term-track">
                      <span className="patient-symptom-term-bar" style={{ width: maxCount ? `${Math.max((term.count / maxCount) * 100, 6)}%` : '0%' }} />
                    </span>
                    <span className="patient-symptom-term-count">{term.count}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState description="Nenhum sintoma registrado ainda pelos seus pacientes." />
          )}
        </article>
      </section>
      <SymptomsByMonthChart data={symptomsByMonth} />
    </div>
  );
}
