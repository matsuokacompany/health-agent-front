'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui/design';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { adminReportingApi, type AdminBillingSummary, type AdminCostSummary } from '@/services/adminReporting';

function formatUsd(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
}

function formatBrlFromCents(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// The per-message WhatsApp rate is usually well under one cent (most traffic
// falls inside Meta's free service-conversation window) — rendering it with
// the standard 2-decimal BRL formatter always shows R$ 0,00. Use more
// decimal places just for this one figure so it stays meaningful.
function formatBrlFromCentsPrecise(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`));
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function NewCostEntryForm({ onCreated }: { onCreated(): void }) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [incurredOn, setIncurredOn] = useState(isoToday());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountCents = Math.round(Number(amount.replace(',', '.')) * 100);
    if (!description.trim() || !amountCents || amountCents <= 0) {
      setError('Informe uma descrição e um valor maior que zero.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await adminReportingApi.createCostEntry({
        description: description.trim(),
        category: category.trim() || undefined,
        amount_cents: amountCents,
        incurred_on: incurredOn,
      });
      setDescription('');
      setCategory('');
      setAmount('');
      setIncurredOn(isoToday());
      onCreated();
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <span className="eyebrow">Novo lançamento</span>
      <h2>Adicionar custo manual</h2>
      <p className="muted">Registre gastos que este painel não calcula sozinho — contratos, ferramentas, suporte.</p>
      <form className="filter-bar" onSubmit={onSubmit}>
        <label>
          Descrição
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Contrato de suporte" required />
        </label>
        <label>
          Categoria (opcional)
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ex.: Operações" />
        </label>
        <label>
          Valor (R$)
          <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="150,00" inputMode="decimal" required />
        </label>
        <label>
          Data
          <input value={incurredOn} onChange={(event) => setIncurredOn(event.target.value)} type="date" required />
        </label>
        <Button disabled={saving} loading={saving} loadingLabel="Salvando..." type="submit">Adicionar</Button>
      </form>
      {error ? <p className="notice danger">{error}</p> : null}
    </Card>
  );
}

export default function AdminCostsPage() {
  const [startDate, setStartDate] = useState(isoMonthStart());
  const [endDate, setEndDate] = useState(isoToday());
  const [summary, setSummary] = useState<AdminCostSummary | null>(null);
  const [billingSummary, setBillingSummary] = useState<AdminBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [costs, billing] = await Promise.all([
        adminReportingApi.getCosts({ start_date: startDate, end_date: endDate }),
        adminReportingApi.getBillingSummary(),
      ]);
      setSummary(costs);
      setBillingSummary(billing);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  async function handleDelete(entryId: number) {
    setDeletingId(entryId);
    try {
      await adminReportingApi.deleteCostEntry(entryId);
      await load();
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && !summary) return <LoadingState message="Carregando custos..." />;
  if (error && !summary) return <ErrorState message={error} />;
  if (!summary) return null;

  const whatsappConfigured = summary.whatsapp_cost_per_message_cents !== null;
  const totalBrlCents = (summary.whatsapp_cost_cents ?? 0) + summary.manual_cost_total_cents;

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Finanças</span>
          <h1>Custos administrativos</h1>
          <p className="muted">Custos calculados automaticamente a partir do uso, mais os lançamentos manuais que você adicionar.</p>
        </div>
      </div>

      {billingSummary ? (
        <section className="grid admin-metrics-grid">
          <article className="card">
            <span className="metric-label">MRR</span>
            <strong className="metric">{formatBrlFromCents(billingSummary.mrr_cents)}</strong>
            <p className="muted compact">Receita recorrente mensal, assinaturas ativas</p>
          </article>
          <article className="card">
            <span className="metric-label">Assinaturas ativas</span>
            <strong className="metric">{billingSummary.active_subscriptions}</strong>
            <p className="muted compact">{billingSummary.trialing_subscriptions} em teste · {billingSummary.past_due_subscriptions} com pagamento atrasado</p>
          </article>
          <article className="card">
            <span className="metric-label">Churn (30 dias)</span>
            <strong className="metric">{(billingSummary.churn_rate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong>
            <p className="muted compact">{billingSummary.canceled_last_30d} cancelamento(s) nos últimos 30 dias</p>
          </article>
        </section>
      ) : null}

      <Card>
        <form className="filter-bar" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <label>
            De
            <input value={startDate} onChange={(event) => setStartDate(event.target.value)} type="date" />
          </label>
          <label>
            Até
            <input value={endDate} onChange={(event) => setEndDate(event.target.value)} type="date" />
          </label>
          <button className="button" type="submit">Aplicar período</button>
        </form>
      </Card>

      <section className="grid admin-metrics-grid admin-section-offset">
        <article className="card">
          <span className="metric-label">Total em reais (período)</span>
          <strong className="metric">{formatBrlFromCents(totalBrlCents)}</strong>
          <p className="muted compact">WhatsApp estimado + lançamentos manuais</p>
        </article>
        <article className="card">
          <span className="metric-label">Relatórios de IA gerados</span>
          <strong className="metric">{summary.ai_report_count}</strong>
          <p className="muted compact">{formatUsd(summary.ai_report_cost_usd)} — custo real cobrado pela OpenAI</p>
        </article>
        <article className="card">
          <span className="metric-label">Mensagens de WhatsApp enviadas</span>
          <strong className="metric">{summary.whatsapp_message_count}</strong>
          <p className="muted compact">
            {whatsappConfigured
              ? `${formatBrlFromCents(summary.whatsapp_cost_cents ?? 0)} estimado (${formatBrlFromCentsPrecise(summary.whatsapp_cost_per_message_cents ?? 0)}/mensagem)`
              : 'Configure WHATSAPP_COST_PER_MESSAGE_CENTS para estimar'}
          </p>
        </article>
        <article className="card">
          <span className="metric-label">Lançamentos manuais</span>
          <strong className="metric">{formatBrlFromCents(summary.manual_cost_total_cents)}</strong>
          <p className="muted compact">{summary.manual_cost_entries.length} lançamento(s) no período</p>
        </article>
      </section>

      <div className="admin-section-offset">
        <NewCostEntryForm onCreated={load} />
      </div>

      <div className="table-wrap admin-section-offset">
        <table>
          <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th /></tr></thead>
          <tbody>
            {summary.manual_cost_entries.length === 0 ? (
              <tr><td colSpan={5} className="muted">Nenhum lançamento manual neste período.</td></tr>
            ) : summary.manual_cost_entries.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.incurred_on)}</td>
                <td>{entry.description}</td>
                <td>{entry.category ?? '—'}</td>
                <td>{formatBrlFromCents(entry.amount_cents)}</td>
                <td>
                  <button className="button secondary" disabled={deletingId === entry.id} onClick={() => void handleDelete(entry.id)} type="button">
                    {deletingId === entry.id ? 'Removendo...' : 'Remover'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? <p className="notice danger admin-section-offset">{error}</p> : null}
    </>
  );
}
