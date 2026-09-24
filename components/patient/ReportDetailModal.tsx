'use client';

import { useEffect, useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { Button, Card } from '@/components/ui/design';
import { Modal } from '@/components/ui/Modal';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { InsightResultBody } from '@/components/patient/InsightResultBody';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import type { SelfMonitoringInsight } from '@/lib/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

function LoadingReportDetail() {
  return <section className="stack" aria-busy="true" aria-label="Carregando relatório">
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card>
  </section>;
}

/** Fetches and shows a single self-monitoring report inside a Modal -- used
 * from the reports table so opening a report no longer navigates away from
 * the list (see AiReportsJourney's own report modal for the same pattern
 * on the professional side). The adherence/symptom metrics grid lives on
 * the /patient/relatorios page itself (scoped to the period filter there),
 * not here -- a report's own saved period rarely matches the page's
 * current filter, and re-fetching it here caused the modal to visibly
 * swap content shortly after opening. */
export function ReportDetailModal({ reportId, onClose }: { reportId: number | null; onClose(): void }) {
  const [insight, setInsight] = useState<SelfMonitoringInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId === null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInsight(null);
    (async () => {
      try {
        const result = await selfMonitoringApi.getInsightDetail(reportId);
        if (cancelled) return;
        setInsight(result);
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
