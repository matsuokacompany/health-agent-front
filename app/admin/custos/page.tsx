'use client';

import { useEffect, useState } from 'react';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { adminReportingApi, type AdminCostSummary } from '@/services/adminReporting';

function formatUsd(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
}

function formatBrlFromCents(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`));
}

export default function AdminCostsPage() {
  const [summary, setSummary] = useState<AdminCostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setSummary(await adminReportingApi.getCosts());
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  if (loading) return <LoadingState message="Carregando custos..." />;
  if (error || !summary) return <ErrorState message={error ?? 'Não foi possível carregar os custos.'} />;

  const whatsappConfigured = summary.whatsapp_cost_per_message_cents !== null;

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Finanças</span>
          <h1>Custos administrativos</h1>
          <p className="muted">
            Período: {formatDate(summary.start_date)} a {formatDate(summary.end_date)} (mês corrente). Custos reais, calculados a partir do uso — nenhum valor aqui é estimativa genérica.
          </p>
        </div>
      </div>

      <section className="grid admin-metrics-grid">
        <article className="card">
          <span className="metric-label">Relatórios de IA gerados</span>
          <strong className="metric">{summary.ai_report_count}</strong>
          <p className="muted compact">Custo real cobrado pela OpenAI</p>
        </article>
        <article className="card">
          <span className="metric-label">Custo com relatórios de IA</span>
          <strong className="metric">{formatUsd(summary.ai_report_cost_usd)}</strong>
          <p className="muted compact">Somado por relatório concluído no período</p>
        </article>
        <article className="card">
          <span className="metric-label">Mensagens de WhatsApp enviadas</span>
          <strong className="metric">{summary.whatsapp_message_count}</strong>
          <p className="muted compact">Check-ins diários enviados no período</p>
        </article>
        <article className="card">
          <span className="metric-label">Custo estimado com WhatsApp</span>
          <strong className="metric">{whatsappConfigured ? formatBrlFromCents(summary.whatsapp_cost_cents ?? 0) : '—'}</strong>
          <p className="muted compact">
            {whatsappConfigured
              ? `${formatBrlFromCents(summary.whatsapp_cost_per_message_cents ?? 0)} por mensagem`
              : 'Configure WHATSAPP_COST_PER_MESSAGE_CENTS para estimar'}
          </p>
        </article>
      </section>

      <section className="card stack admin-section-offset">
        <h2>Sobre estes números</h2>
        <ul className="admin-check-list">
          <li>Relatórios de IA: custo real reportado pela OpenAI para cada relatório concluído (dólares).</li>
          <li>WhatsApp: a contagem de mensagens é real; o custo é uma estimativa (reais), calculada como contagem × valor por mensagem que você configurar — a Meta não expõe o custo exato por mensagem para este app.</li>
          <li>Os dois custos não são somados em um único total porque estão em moedas diferentes.</li>
        </ul>
      </section>
    </>
  );
}
