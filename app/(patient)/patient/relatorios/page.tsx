'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, PageHeader } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import type { SelfMonitoringInsightListItem } from '@/lib/types';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

function LoadingRelatorios() {
  return <Card><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card>;
}

export default function PatientRelatorios() {
  const [items, setItems] = useState<SelfMonitoringInsightListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await selfMonitoringApi.listInsights();
      setItems(result.items);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <section className="stack" aria-label="Relatórios">
      <PageHeader
        eyebrow="Relatórios"
        title="Histórico de resumos por IA"
        description="Cada resumo gerado em Automonitoramento fica registrado aqui, para você acompanhar como sua avaliação evoluiu ao longo do tempo."
      />
      {loading ? <LoadingRelatorios /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && items?.length === 0 ? (
        <EmptyState title="Nenhum resumo gerado ainda" description='Gere seu primeiro resumo por IA na página "Automonitoramento".' />
      ) : null}
      {!loading && !error && items?.length ? (
        <div className="stack">
          {items.map((item) => (
            <Link key={item.id} href={`/patient/relatorios/${item.id}` as never} className="card report-history-item">
              <div>
                <strong>Resumo de {formatDate(item.start_date)} a {formatDate(item.end_date)}</strong>
                <p className="muted compact">Gerado em {formatDateTime(item.generated_at)}</p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
