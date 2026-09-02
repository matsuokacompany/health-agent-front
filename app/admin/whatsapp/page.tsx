'use client';

import { useEffect, useState } from 'react';
import { ErrorState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { adminReportingApi, type AdminWhatsappStats } from '@/services/adminReporting';

function LoadingWhatsappStats() {
  return <div aria-busy="true" aria-label="Carregando estatísticas">
    <section className="grid admin-metrics-grid">
      {Array.from({ length: 3 }, (_, index) => <article className="card" key={index}><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-metric" /></article>)}
    </section>
    <section className="card admin-section-offset">
      <SkeletonBlock className="sk-title" />
      <div className="chart-lines">
        {Array.from({ length: 6 }, (_, index) => <div className="chart-row" key={index}><SkeletonBlock /><SkeletonBlock /></div>)}
      </div>
    </section>
  </div>;
}

function formatBrlFromCents(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDayLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

export default function AdminWhatsappPage() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<AdminWhatsappStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(periodDays: number) {
    setLoading(true);
    setError(null);
    try {
      setStats(await adminReportingApi.getWhatsappStats(periodDays));
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(days); }, [days]);

  const maxDaily = stats ? Math.max(1, ...stats.daily.map((point) => point.sent_count)) : 1;

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Operação</span>
          <h1>Mensagens de WhatsApp</h1>
          <p className="muted">Check-ins diários enviados pela plataforma — cada um é uma mensagem de template cobrada pela Meta.</p>
        </div>
        <label>
          Período
          <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </label>
      </div>

      {loading ? <LoadingWhatsappStats /> : null}
      {!loading && (error || !stats) ? <ErrorState message={error ?? 'Não foi possível carregar as estatísticas.'} /> : null}

      {!loading && stats ? (
        <>
          <section className="grid admin-metrics-grid" data-tour="whatsapp-metrics">
            <article className="card">
              <span className="metric-label">Mensagens enviadas</span>
              <strong className="metric">{stats.total_sent}</strong>
              <p className="muted compact">Nos últimos {stats.period_days} dias</p>
            </article>
            <article className="card">
              <span className="metric-label">Custo estimado</span>
              <strong className="metric">{stats.estimated_cost_cents !== null ? formatBrlFromCents(stats.estimated_cost_cents) : '—'}</strong>
              <p className="muted compact">
                {stats.cost_per_message_cents !== null
                  ? `${formatBrlFromCents(stats.cost_per_message_cents)} por mensagem`
                  : 'Configure WHATSAPP_COST_PER_MESSAGE_CENTS para estimar'}
              </p>
            </article>
            <article className="card">
              <span className="metric-label">Média por dia</span>
              <strong className="metric">{stats.period_days ? (stats.total_sent / stats.period_days).toFixed(1) : '0'}</strong>
              <p className="muted compact">Mensagens/dia no período</p>
            </article>
          </section>

          <section className="card admin-section-offset" data-tour="whatsapp-chart">
            <h2>Envios por dia</h2>
            <div className="chart-lines">
              {stats.daily.map((point) => (
                <div className="chart-row" key={point.date}>
                  <span className="muted">{formatDayLabel(point.date)}</span>
                  <i />
                  <b style={{ width: `${Math.round((point.sent_count / maxDaily) * 100)}%` }} title={`${point.sent_count} mensagens`} />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
