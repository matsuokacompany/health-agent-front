'use client';
import Link from 'next/link';
import { useProfessionalDashboardOverview } from '@/hooks/useProfessional';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { MetricCard } from '@/components/ui/design';
import { MetricCardSkeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { UsersThree, Warning } from '@phosphor-icons/react';
import type { ProfessionalDashboardRedFlag } from '@/services/professional';

function LoadingDashboard() {
  return <div aria-busy="true" aria-label="Carregando dashboard">
    <section className="grid">
      <MetricCardSkeleton />
    </section>
    <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-chart" /></article>
    <section className="split professional-detail-section">
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></article>
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></article>
    </section>
  </div>;
}

function fmt(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

const TREND_WINDOW_DAYS = 14;

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Daily count of red-flag events over the trend window, oldest first --
 * lets a professional spot whether risk signals are trending up or down
 * across their whole patient panel, not just see the raw recent list. */
function RedFlagsTrendChart({ redFlags }: { redFlags: ProfessionalDashboardRedFlag[] }) {
  const days = Array.from({ length: TREND_WINDOW_DAYS }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (TREND_WINDOW_DAYS - 1 - index));
    return { key: dateKey(date), date };
  });
  const counts = new Map<string, number>();
  for (const flag of redFlags) {
    const key = String(flag.report_date ?? '').slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const maxCount = Math.max(1, ...days.map((day) => counts.get(day.key) ?? 0));
  const total = days.reduce((sum, day) => sum + (counts.get(day.key) ?? 0), 0);

  return (
    <article className="card professional-trend-chart">
      <span className="eyebrow">Últimos {TREND_WINDOW_DAYS} dias</span>
      <h2>Sinais de risco por dia</h2>
      <p className="muted compact">{total} {total === 1 ? 'sinal relatado' : 'sinais relatados'} no período, somando todos os pacientes.</p>
      <figure className="trend-chart-figure" aria-label={`Sinais de risco por dia nos últimos ${TREND_WINDOW_DAYS} dias: ${total} no total`}>
        <div className="trend-chart-bars" aria-hidden="true">
          {days.map((day) => {
            const count = counts.get(day.key) ?? 0;
            const heightPct = Math.max((count / maxCount) * 100, count > 0 ? 10 : 3);
            return (
              <div className="trend-chart-column" key={day.key} title={`${fmt(day.key)}: ${count} ${count === 1 ? 'sinal' : 'sinais'}`}>
                {count > 0 ? <span className="trend-chart-value">{count}</span> : null}
                <span className="trend-chart-track"><span className="trend-chart-bar" style={{ height: `${heightPct}%` }} /></span>
                <span className="trend-chart-day">{day.date.getDate()}</span>
              </div>
            );
          })}
        </div>
        <table className="sr-only">
          <caption>Sinais de risco por dia, últimos {TREND_WINDOW_DAYS} dias</caption>
          <thead><tr><th>Data</th><th>Sinais</th></tr></thead>
          <tbody>
            {days.map((day) => <tr key={day.key}><td>{fmt(day.key)}</td><td>{counts.get(day.key) ?? 0}</td></tr>)}
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
  const maxCount = topSymptoms.reduce((max, term) => Math.max(max, term.count), 0);

  return (
    <div className="stack">
      <section className="grid">
        <MetricCard icon={<UsersThree aria-hidden="true" size={22} weight="duotone" />} label="Pacientes ativos" value={data?.active_patients ?? 0} tone="info" />
      </section>
      <RedFlagsTrendChart redFlags={redFlags} />
      <section className="split professional-detail-section">
        <article className="card">
          <span className="eyebrow">Últimos 14 dias</span>
          <h2>Sintomas de risco relatados</h2>
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
            <EmptyState description="Nenhum sintoma de risco relatado pelos seus pacientes nos últimos 14 dias." />
          )}
        </article>
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
    </div>
  );
}
