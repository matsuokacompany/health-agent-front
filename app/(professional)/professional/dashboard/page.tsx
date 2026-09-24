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
    <article className="card">
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
 * gets the most room. */
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

  return (
    <article className="card professional-trend-chart">
      <span className="eyebrow">Últimos {SYMPTOMS_MONTHS_WINDOW} meses</span>
      <h2>Sintomas por mês</h2>
      <p className="muted compact">{total} {total === 1 ? 'registro' : 'registros'} de sintomas no período, somando todos os pacientes.</p>
      <figure className="trend-chart-figure" aria-label={`Sintomas por mês nos últimos ${SYMPTOMS_MONTHS_WINDOW} meses: ${total} no total`}>
        <div className="trend-chart-bars" aria-hidden="true">
          {months.map((month) => {
            const count = counts.get(month) ?? 0;
            const heightPct = Math.max((count / maxCount) * 100, count > 0 ? 10 : 3);
            return (
              <div className="trend-chart-column" key={month}>
                {count > 0 ? <span className="trend-chart-value">{count}</span> : null}
                <span className="trend-chart-track">
                  <span className="trend-chart-bar chart-tooltip-trigger" style={{ height: `${heightPct}%` }} tabIndex={0}>
                    <span className="chart-tooltip" role="tooltip">
                      <strong>{count} {count === 1 ? 'registro' : 'registros'}</strong>
                      <span>{monthRangeLabel(month)}</span>
                    </span>
                  </span>
                </span>
                <span className="trend-chart-day">{monthLabel(month)}</span>
              </div>
            );
          })}
        </div>
        <table className="sr-only">
          <caption>Sintomas por mês, últimos {SYMPTOMS_MONTHS_WINDOW} meses</caption>
          <thead><tr><th>Mês</th><th>Sintomas</th></tr></thead>
          <tbody>
            {months.map((month) => <tr key={month}><td>{monthRangeLabel(month)}</td><td>{counts.get(month) ?? 0}</td></tr>)}
          </tbody>
        </table>
      </figure>
    </article>
  );
}

const ADHERENCE_WINDOW_DAYS = 30;
const ADHERENCE_BUCKET_DAYS = 7;
const ADHERENCE_BUCKET_COUNT = Math.ceil(ADHERENCE_WINDOW_DAYS / ADHERENCE_BUCKET_DAYS);
// Every line beyond this many patients folds into a single "Outros
// pacientes" average line, colored gray instead of minting a new hue --
// past this count no fixed categorical order can keep every pair of lines
// distinguishable.
const ADHERENCE_MAX_SERIES = 8;
const ADHERENCE_CHART_WIDTH = 640;
const ADHERENCE_CHART_HEIGHT = 220;
const ADHERENCE_PADDING = { top: 16, right: 16, bottom: 28, left: 16 };

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

/** Per-patient check-in adherence as a line per patient over the last
 * {ADHERENCE_WINDOW_DAYS} days, so a professional can see who is trending
 * down, not just who is lowest right now. */
function PatientAdherenceLineChart({ data }: { data: ProfessionalDashboardAdherenceEntry[] }) {
  if (!data.length) {
    return (
      <article className="card">
        <span className="eyebrow">Últimos {ADHERENCE_WINDOW_DAYS} dias</span>
        <h2>Adesão dos pacientes</h2>
        <EmptyState description="Nenhum check-in registrado pelos seus pacientes no período." />
      </article>
    );
  }

  const weeks = buildAdherenceWeeks();
  const shown = data.slice(0, ADHERENCE_MAX_SERIES);
  const overflow = data.slice(ADHERENCE_MAX_SERIES);

  const plotWidth = ADHERENCE_CHART_WIDTH - ADHERENCE_PADDING.left - ADHERENCE_PADDING.right;
  const plotHeight = ADHERENCE_CHART_HEIGHT - ADHERENCE_PADDING.top - ADHERENCE_PADDING.bottom;
  const xFor = (index: number) => ADHERENCE_PADDING.left + (weeks.length === 1 ? plotWidth / 2 : (index / (weeks.length - 1)) * plotWidth);
  const yFor = (value: number) => ADHERENCE_PADDING.top + (1 - value / 100) * plotHeight;

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

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <article className="card">
      <span className="eyebrow">Últimos {ADHERENCE_WINDOW_DAYS} dias</span>
      <h2>Adesão dos pacientes</h2>
      <p className="muted compact">Percentual de check-ins concluídos por semana, por paciente.</p>
      <figure className="patient-adherence-figure" aria-label={`Adesão semanal dos pacientes nos últimos ${ADHERENCE_WINDOW_DAYS} dias`}>
        <div className="patient-adherence-plot" style={{ aspectRatio: `${ADHERENCE_CHART_WIDTH} / ${ADHERENCE_CHART_HEIGHT}` }}>
          <svg viewBox={`0 0 ${ADHERENCE_CHART_WIDTH} ${ADHERENCE_CHART_HEIGHT}`} className="patient-adherence-svg" aria-hidden="true">
            {gridLines.map((line) => (
              <line
                key={line}
                x1={ADHERENCE_PADDING.left}
                x2={ADHERENCE_CHART_WIDTH - ADHERENCE_PADDING.right}
                y1={yFor(line)}
                y2={yFor(line)}
                className="patient-adherence-gridline"
              />
            ))}
            {series.map((line) => (
              line.points.length > 1 ? (
                <polyline
                  key={line.key}
                  points={line.points.map((point) => `${xFor(point.index)},${yFor(point.value)}`).join(' ')}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null
            ))}
            {series.map((line) => line.points.map((point) => (
              <circle key={`${line.key}-${point.index}`} cx={xFor(point.index)} cy={yFor(point.value)} r={4} fill={line.color} stroke="var(--surface)" strokeWidth={2} />
            )))}
          </svg>
          {series.map((line) => line.points.map((point) => (
            <span
              key={`${line.key}-hit-${point.index}`}
              className="chart-point-hit chart-tooltip-trigger"
              tabIndex={0}
              style={{ left: `${(xFor(point.index) / ADHERENCE_CHART_WIDTH) * 100}%`, top: `${(yFor(point.value) / ADHERENCE_CHART_HEIGHT) * 100}%` }}
            >
              <span className="chart-tooltip" role="tooltip">
                <strong>{point.value}%</strong>
                <span>{line.name}</span>
                <span className="muted">semana de {weekLabel(weeks[point.index])}</span>
              </span>
            </span>
          )))}
        </div>
        <ul className="chart-legend">
          {series.map((line) => (
            <li key={line.key}>
              <span className="chart-legend-swatch" style={{ background: line.color }} aria-hidden="true" />
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
        <PatientAdherenceLineChart data={adherence} />
        <article className="card">
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
