'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { DEFAULT_PERIOD_DAYS, EvolutionPaywall, InsightGenerationCard, PERIOD_PRESETS, PeriodSelector, type PeriodDays } from '@/components/patient/EvolutionReportSection';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import { shortcutPeriod } from '@/services/aiReports';
import type { EvolutionReport, SelfMonitoringInsight, SelfMonitoringInsightListItem } from '@/lib/types';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

function LoadingRelatorios() {
  return <section className="stack" aria-busy="true" aria-label="Carregando relatórios">
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock className="sk-action" /></Card>
    <Card><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card>
  </section>;
}

export default function PatientRelatorios() {
  const [items, setItems] = useState<SelfMonitoringInsightListItem[] | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodDays>(DEFAULT_PERIOD_DAYS);
  const period = useMemo(() => shortcutPeriod(selectedPeriod), [selectedPeriod]);
  const [report, setReport] = useState<EvolutionReport | null>(null);
  const [reportBlocked, setReportBlocked] = useState(false);
  const [loadingReport, setLoadingReport] = useState(true);
  const [insight, setInsight] = useState<SelfMonitoringInsight | null>(null);
  const [latestInsight, setLatestInsight] = useState<SelfMonitoringInsightListItem | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  async function loadList() {
    setLoadingList(true);
    setListError(null);
    try {
      const result = await selfMonitoringApi.listInsights();
      setItems(result.items);
      setLatestInsight(result.items[0] ?? null);
    } catch (err) {
      setListError(toFriendlyErrorMessage(err));
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { void loadList(); }, []);

  useEffect(() => {
    setInsight(null);
    setInsightError(null);
    setLoadingReport(true);
    selfMonitoringApi.getEvolutionReport(period)
      .then((result) => { setReport(result); setReportBlocked(false); })
      .catch((err) => { if (err instanceof ApiError && err.status === 402) { setReport(null); setReportBlocked(true); } })
      .finally(() => setLoadingReport(false));
  }, [period]);

  async function generateInsight() {
    setGeneratingInsight(true);
    setInsightError(null);
    try {
      const result = await selfMonitoringApi.getInsight(period);
      setInsight(result);
      if (result.id) {
        setLatestInsight({
          id: result.id,
          start_date: result.start_date,
          end_date: result.end_date,
          generated_at: result.generated_at ?? new Date().toISOString(),
          next_generation_at: result.next_generation_at,
        });
      }
      void loadList();
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 402)) setInsightError(toFriendlyErrorMessage(err));
    } finally {
      setGeneratingInsight(false);
    }
  }

  const periodLabel = (PERIOD_PRESETS.find(([days]) => days === selectedPeriod)?.[1] ?? '').toLowerCase();

  return (
    <section className="stack" aria-label="Relatórios">
      <div data-tour="relatorios-generate">
        {!reportBlocked ? <PeriodSelector selected={selectedPeriod} onChange={setSelectedPeriod} disabled={loadingReport} /> : null}
        {reportBlocked ? <EvolutionPaywall /> : (
          <InsightGenerationCard
            report={report}
            insight={insight}
            latestInsight={latestInsight}
            periodLabel={periodLabel}
            error={insightError}
            generating={generatingInsight}
            onGenerate={() => void generateInsight()}
          />
        )}
      </div>
      {loadingList ? <LoadingRelatorios /> : null}
      {!loadingList && listError ? <ErrorState message={listError} /> : null}
      {!loadingList && !listError && items?.length === 0 ? (
        <EmptyState title="Nenhum relatório gerado ainda" description="Gere seu primeiro relatório de IA acima." />
      ) : null}
      {!loadingList && !listError && items?.length ? (
        <div className="stack" data-tour="relatorios-list">
          {items.map((item) => (
            <Link key={item.id} href={`/patient/relatorios/${item.id}` as never} className="card report-history-item">
              <div>
                <strong>Relatório de {formatDate(item.start_date)} a {formatDate(item.end_date)}</strong>
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
