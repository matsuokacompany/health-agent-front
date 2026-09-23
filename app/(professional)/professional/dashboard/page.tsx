'use client';
import Link from 'next/link';
import { useProfessionalDashboardOverview } from '@/hooks/useProfessional';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { MetricCard } from '@/components/ui/design';
import { MetricCardSkeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { UsersThree, Warning } from '@phosphor-icons/react';

function LoadingDashboard() {
  return <div aria-busy="true" aria-label="Carregando dashboard">
    <section className="grid">
      <MetricCardSkeleton />
    </section>
    <section className="split professional-detail-section">
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></article>
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></article>
    </section>
  </div>;
}

function fmt(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
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
