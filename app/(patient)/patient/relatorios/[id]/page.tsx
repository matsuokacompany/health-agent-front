'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, DownloadSimple } from '@phosphor-icons/react';
import { Button, Card } from '@/components/ui/design';
import { MetricCardSkeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { EvolutionMetricsGrid } from '@/components/patient/EvolutionMetricsGrid';
import { InsightResultBody } from '@/components/patient/InsightResultBody';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import type { EvolutionReport, SelfMonitoringInsight } from '@/lib/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

function LoadingRelatorio() {
  return <section className="stack" aria-busy="true" aria-label="Carregando relatório">
    <div className="page-actions">
      <SkeletonBlock className="sk-action" />
      <SkeletonBlock className="sk-action" />
    </div>
    <section className="patient-dashboard-summary-grid">
      {Array.from({ length: 4 }, (_, index) => <MetricCardSkeleton key={index} />)}
    </section>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card>
  </section>;
}

export default function PatientRelatorioDetail() {
  const id = Number(useParams()?.id);
  const [insight, setInsight] = useState<SelfMonitoringInsight | null>(null);
  const [metrics, setMetrics] = useState<EvolutionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await selfMonitoringApi.getInsightDetail(id);
      setInsight(result);
      // The stored summary is just text -- fetching the same period's
      // metrics again gives the report something concrete to point at
      // (adherence %, symptom-free days), instead of only the model's
      // prose. Best-effort: a missing/blocked metrics fetch shouldn't hide
      // the summary itself.
      selfMonitoringApi
        .getEvolutionReport({ start_date: result.start_date, end_date: result.end_date })
        .then(setMetrics)
        .catch(() => setMetrics(null));
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (id && !Number.isNaN(id)) void load(); }, [id]);

  return (
    <section className="stack" aria-label="Relatório">
      <div className="page-actions">
        <Button href="/patient/relatorios" variant="secondary">
          <ArrowLeft aria-hidden="true" size={18} weight="bold" /> Voltar ao histórico
        </Button>
        {insight?.insight ? (
          <Button variant="secondary" onClick={() => window.print()}>
            <DownloadSimple aria-hidden="true" size={18} weight="bold" /> Baixar PDF
          </Button>
        ) : null}
      </div>
      {loading ? <LoadingRelatorio /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && !insight ? <EmptyState title="Relatório não encontrado" /> : null}
      {!loading && !error && insight?.insight ? (
        <>
          {metrics?.sufficient_data ? <EvolutionMetricsGrid report={metrics} /> : null}
          <Card>
            <span className="eyebrow">Período de {formatDate(insight.start_date)} a {formatDate(insight.end_date)}</span>
            <InsightResultBody result={insight.insight} />
          </Card>
        </>
      ) : null}
    </section>
  );
}
