'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ErrorState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { adminReportingApi, type AdminCostSummary, type AdminUser, type AdminWhatsappStats } from '@/services/adminReporting';

function formatUsd(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' });
}

function formatBrlFromCents(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const shortcuts = [
  { icon: '👥', title: 'Usuários', description: 'Veja quem está na plataforma, ativos e inativos, com filtros por papel.', href: '/admin/usuarios', cta: 'Ver usuários' },
  { icon: '🧑‍🤝‍🧑', title: 'Pacientes', description: 'Cadastre pacientes, consulte anamneses, planos e relatórios.', href: '/admin/pacientes', cta: 'Abrir pacientes' },
  { icon: '💰', title: 'Custos', description: 'Custos de IA e WhatsApp calculados automaticamente, mais lançamentos manuais.', href: '/admin/custos', cta: 'Ver custos' },
  { icon: '💬', title: 'WhatsApp', description: 'Status da integração, volume de mensagens e custo estimado por período.', href: '/admin/whatsapp', cta: 'Ver operação' },
] as const;

export default function Page() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [costs, setCosts] = useState<AdminCostSummary | null>(null);
  const [whatsapp, setWhatsapp] = useState<AdminWhatsappStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [usersResult, costsResult, whatsappResult] = await Promise.all([
          adminReportingApi.listUsers(),
          adminReportingApi.getCosts(),
          adminReportingApi.getWhatsappStats(30),
        ]);
        setUsers(usersResult);
        setCosts(costsResult);
        setWhatsapp(whatsappResult);
      } catch (err) {
        setError(toFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const activeUsers = users?.filter((user) => user.status === 'ACTIVE').length ?? 0;
  const totalManualCents = costs?.manual_cost_total_cents ?? 0;
  const totalWhatsappCents = costs?.whatsapp_cost_cents ?? 0;
  const totalKnownCostsBrl = totalManualCents + totalWhatsappCents;

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Administração</span>
          <h1>Dashboard administrativo</h1>
          <p className="muted">Visão geral do mês atual — usuários, custos de IA/WhatsApp e lançamentos manuais.</p>
        </div>
      </div>

      {error ? <ErrorState message={error} /> : null}

      {loading ? (
        <section className="grid admin-metrics-grid" aria-label="Carregando indicadores administrativos" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => <article className="card" key={index}><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-metric" /></article>)}
        </section>
      ) : !error ? (
        <section className="grid admin-metrics-grid" aria-label="Indicadores administrativos" data-tour="admin-metrics">
          <article className="card"><span className="metric-label">👥 Usuários ativos</span><strong className="metric">{activeUsers}</strong><p className="muted compact">{users?.length ?? 0} no total</p></article>
          <article className="card"><span className="metric-label">✨ Relatórios de IA (mês)</span><strong className="metric">{costs?.ai_report_count ?? 0}</strong><p className="muted compact">{costs ? formatUsd(costs.ai_report_cost_usd) : '—'}</p></article>
          <article className="card"><span className="metric-label">💬 Mensagens WhatsApp (30 dias)</span><strong className="metric">{whatsapp?.total_sent ?? 0}</strong><p className="muted compact">{whatsapp?.estimated_cost_cents != null ? `${formatBrlFromCents(whatsapp.estimated_cost_cents)} estimado` : 'custo por mensagem não configurado'}</p></article>
          <article className="card"><span className="metric-label">💰 Custos conhecidos (mês)</span><strong className="metric">{formatBrlFromCents(totalKnownCostsBrl)}</strong><p className="muted compact">WhatsApp + lançamentos manuais</p></article>
        </section>
      ) : null}

      {/* Static shortcuts — not tied to the fetched indicators above, so they render immediately instead of waiting behind that loading state. */}
      <section className="grid" aria-label="Atalhos administrativos" data-tour="admin-shortcuts">
        {shortcuts.map((shortcut) => (
          <article className="card stack" key={shortcut.href}>
            <h2><span aria-hidden="true">{shortcut.icon}</span> {shortcut.title}</h2>
            <p className="muted">{shortcut.description}</p>
            <Link className="button secondary" href={shortcut.href as never}>{shortcut.cta}</Link>
          </article>
        ))}
      </section>
    </>
  );
}
