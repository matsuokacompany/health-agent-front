'use client';

import { useEffect, useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { Button, Card } from '@/components/ui/design';
import { Modal } from '@/components/ui/Modal';
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

function LoadingReportDetail() {
  return <section className="stack" aria-busy="true" aria-label="Carregando relatório">
    <section className="patient-dashboard-summary-grid">{Array.from({ length: 8 }, (_, index) => <MetricCardSkeleton key={index} />)}</section>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card>
  </section>;
}

/** Fetches and shows a single self-monitoring report inside a Modal -- used
 * from the reports table so opening a report no longer navigates away from
 * the list (see AiReportsJourney's own report modal for the same pattern
 * on the professional side). Re-fetches the report's own period's metrics
 * alongside the stored summary, best-effort, same as the page this
 * replaced. */
export function ReportDetailModal({ reportId, onClose }: { reportId: number | null; onClose(): void }) {
  const [insight, setInsight] = useState<SelfMonitoringInsight | null>(null);
  const [metrics, setMetrics] = useState<EvolutionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId === null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInsight(null);
    setMetrics(null);
    (async () => {
      try {
        const result = await selfMonitoringApi.getInsightDetail(reportId);
        if (cancelled) return;
        setInsight(result);
        selfMonitoringApi.getEvolutionReport({ start_date: result.start_date, end_date: result.end_date })
          .then((value) => { if (!cancelled) setMetrics(value); })
          .catch(() => { if (!cancelled) setMetrics(null); });
      } catch (err) {
        if (!cancelled) setError(toFriendlyErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reportId]);

  return (
    <Modal open={reportId !== null} title="Relatório" onClose={onClose} className="relatorio-detail-modal">
      {loading ? <LoadingReportDetail /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && !insight ? <EmptyState title="Relatório não encontrado" /> : null}
      {!loading && !error && insight?.insight ? (
        <div className="stack">
          {metrics?.sufficient_data ? <EvolutionMetricsGrid report={metrics} /> : null}
          <Card>
            <span className="eyebrow">Período de {formatDate(insight.start_date)} a {formatDate(insight.end_date)}</span>
            <InsightResultBody result={insight.insight} />
          </Card>
          <div className="page-actions">
            <Button variant="secondary" onClick={() => window.print()}>
              <DownloadSimple aria-hidden="true" size={18} weight="bold" /> Baixar PDF
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
