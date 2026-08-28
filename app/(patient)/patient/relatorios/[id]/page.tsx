'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, PageHeader } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { InsightResultBody } from '@/components/patient/InsightResultBody';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import type { SelfMonitoringInsight } from '@/lib/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

function LoadingRelatorio() {
  return <Card><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card>;
}

export default function PatientRelatorioDetail() {
  const id = Number(useParams()?.id);
  const [insight, setInsight] = useState<SelfMonitoringInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setInsight(await selfMonitoringApi.getInsightDetail(id));
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id && !Number.isNaN(id)) void load(); }, [id]);

  return (
    <section className="stack" aria-label="Relatório">
      <PageHeader
        eyebrow="Relatórios"
        title="Resumo por IA"
        action={<Button href="/patient/relatorios" variant="secondary">Voltar ao histórico</Button>}
      />
      {loading ? <LoadingRelatorio /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && !insight ? <EmptyState title="Relatório não encontrado" /> : null}
      {!loading && !error && insight?.insight ? (
        <Card>
          <span className="eyebrow">Período de {formatDate(insight.start_date)} a {formatDate(insight.end_date)}</span>
          <InsightResultBody result={insight.insight} />
        </Card>
      ) : null}
    </section>
  );
}
