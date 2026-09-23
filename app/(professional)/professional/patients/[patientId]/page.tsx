'use client';
import { use } from 'react';

import { useProfessionalDashboard } from '@/hooks/useProfessional';
import { DAILY_REPORT_STATUS_LABELS } from '@/components/professional/StatusBadge';
import { ErrorState } from '@/components/ui/states';
import { MetricCardSkeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { Stethoscope, CheckCircle } from '@phosphor-icons/react';
import { MetricCard } from '@/components/ui/design';

function LoadingOverview() {
  return <div className="professional-tab-content" aria-busy="true" aria-label="Carregando visão geral">
    <section className="grid professional-detail-section">
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></article>
      <MetricCardSkeleton />
      <MetricCardSkeleton />
    </section>
    <section className="split professional-detail-section">
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></article>
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></article>
    </section>
  </div>;
}

function fmt(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.includes('T') ? 'short' : undefined }).format(new Date(value)) : '—'; }

// The scheduler creates each day's check-in for the *previous* calendar
// day, run every morning — so the first one a brand-new plan is eligible
// for lands the day after start_date, not on start_date itself. Format in
// UTC since start_date arrives as a date-only string (parsed as UTC
// midnight); formatting in the viewer's local timezone could shift it back
// a day for negative UTC offsets like America/Sao_Paulo.
function firstCheckinDate(startDate?: string | null) {
  if (!startDate) return null;
  const date = new Date(startDate.length <= 10 ? `${startDate}T00:00:00Z` : startDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + 1);
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }).format(date);
}

export default function PatientOverview({ params, searchParams }: { params: Promise<{ patientId: string }>; searchParams: Promise<{ created?: string; anamneseError?: string }> }) {
  const { patientId } = use(params);
  const { created, anamneseError } = use(searchParams);
  const dashboard = useProfessionalDashboard(patientId);

  if (dashboard.error) return <ErrorState message={dashboard.error.message} />;
  if (dashboard.isLoading) return <LoadingOverview />;

  const data = dashboard.data;
  const stats = data?.statistics;

  return (
    <div className="professional-tab-content">
      {created === '1' ? <p className="notice success" role="status">Paciente cadastrado. O acesso à conta será vinculado pelo fluxo de autenticação/convite da plataforma. {(() => { const label = firstCheckinDate(data?.monitoring?.start_date); return label ? `A primeira mensagem de check-in por WhatsApp chega em ${label}, por volta das 8h.` : null; })()}</p> : null}
      {anamneseError === '1' ? <p className="notice danger" role="alert">Paciente cadastrado com sucesso, mas não foi possível salvar a anamnese. Você poderá adicioná-la posteriormente na edição do paciente.</p> : null}
      <section className="grid professional-detail-section">
        <article className="card">
          <span className={data?.monitoring?.active ? 'badge success' : 'badge'}>{data?.monitoring?.active ? 'Plano ativo' : 'Plano inativo'}</span>
          <h2>{data?.monitoring?.title ?? 'Plano de acompanhamento'}</h2>
          <p className="muted">Início: {fmt(data?.monitoring?.start_date)} · Fim: {fmt(data?.monitoring?.end_date)}</p>
        </article>
        <MetricCard icon={<CheckCircle aria-hidden="true" size={22} weight="duotone" />} label="Aderência" value={`${stats?.adherence ?? 0}%`} description={`${stats?.answered ?? 0} respondidos de ${stats?.total ?? 0}`} tone={(stats?.adherence ?? 0) >= 80 ? 'ok' : 'warn'} />
        <MetricCard icon={<Stethoscope aria-hidden="true" size={22} weight="duotone" />} label="Sintomas" value={stats?.with_symptoms ?? 0} description={`${stats?.missed ?? 0} check-ins perdidos`} tone={(stats?.with_symptoms ?? 0) > 0 ? 'warn' : 'ok'} />
      </section>
      <section className="split professional-detail-section">
        <article className="card">
          <span className="badge">Check-in de hoje</span>
          <h2>{data?.today?.status ? DAILY_REPORT_STATUS_LABELS[data.today.status] ?? data.today.status : 'Sem status'}</h2>
          <p className="muted">Respondido: {data?.today?.completed ? 'Sim' : 'Não'} · Próximo: {fmt(data?.next_checkin?.scheduled_at)}</p>
        </article>
        <article className="card">
          <span className="badge">Anamnese</span>
          <h2>Resumo clínico</h2>
          <p>{Array.isArray(data?.anamnesis_summary?.preview) ? data?.anamnesis_summary?.preview.join(', ') : data?.anamnesis_summary?.preview || 'Resumo não disponível.'}</p>
        </article>
      </section>
    </div>
  );
}
