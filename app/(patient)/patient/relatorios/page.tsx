'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/design';
import { MetricCardSkeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { DEFAULT_PERIOD_DAYS, EvolutionPaywall, InsightGenerationCard, PERIOD_PRESETS, PeriodSelector, validateCustomPeriod, type CustomRange, type PeriodSelection } from '@/components/patient/EvolutionReportSection';
import { EvolutionMetricsGrid } from '@/components/patient/EvolutionMetricsGrid';
import { ReportDetailModal } from '@/components/patient/ReportDetailModal';
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
    <div className="table-wrap">
      <table>
        <thead><tr><th>Período</th><th>Gerado em</th><th>Ação</th></tr></thead>
        <tbody>
          {Array.from({ length: 3 }, (_, index) => (
            <tr key={index}><td><SkeletonBlock /></td><td><SkeletonBlock /></td><td><SkeletonBlock className="sk-action" /></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>;
}

export default function PatientRelatorios() {
  const [items, setItems] = useState<SelfMonitoringInsightListItem[] | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [openReportId, setOpenReportId] = useState<number | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD_DAYS);
  const [customRange, setCustomRange] = useState<CustomRange>({ start_date: '', end_date: '' });
  const customError = selectedPeriod === 'custom' && customRange.start_date && customRange.end_date
    ? validateCustomPeriod(customRange.start_date, customRange.end_date)
    : null;
  const period = useMemo(() => {
    if (selectedPeriod === 'custom') {
      if (!customRange.start_date || !customRange.end_date || validateCustomPeriod(customRange.start_date, customRange.end_date)) return null;
      return { start_date: customRange.start_date, end_date: customRange.end_date };
    }
    return shortcutPeriod(selectedPeriod);
  }, [selectedPeriod, customRange]);
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
    if (!period) { setReport(null); setLoadingReport(false); return; }
    setInsight(null);
    setInsightError(null);
    setLoadingReport(true);
    selfMonitoringApi.getEvolutionReport(period)
      .then((result) => { setReport(result); setReportBlocked(false); })
      .catch((err) => { if (err instanceof ApiError && err.status === 402) { setReport(null); setReportBlocked(true); } })
      .finally(() => setLoadingReport(false));
  }, [period]);

  async function generateInsight() {
    if (!period) return;
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

  const periodLabel = selectedPeriod === 'custom'
    ? 'período personalizado'
    : (PERIOD_PRESETS.find(([days]) => days === selectedPeriod)?.[1] ?? '').toLowerCase();

  return (
    <section className="stack" aria-label="Relatórios">
      <div className="stack" data-tour="relatorios-generate">
        {!reportBlocked ? (
          <div className="relatorios-toolbar">
            <PeriodSelector
              selected={selectedPeriod}
              onChange={setSelectedPeriod}
              disabled={loadingReport}
              onSelectCustom={() => setSelectedPeriod('custom')}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
              customError={customError}
            />
          </div>
        ) : null}
        {!reportBlocked && loadingReport ? (
          <section className="patient-dashboard-summary-grid" aria-busy="true" aria-label="Carregando métricas do período">
            {Array.from({ length: 8 }, (_, index) => <MetricCardSkeleton key={index} />)}
          </section>
        ) : null}
        {!reportBlocked && !loadingReport && report?.sufficient_data ? <EvolutionMetricsGrid report={report} /> : null}
        {reportBlocked ? <EvolutionPaywall /> : (
          <InsightGenerationCard
            report={report}
            insight={insight}
            latestInsight={latestInsight}
            periodLabel={periodLabel}
            error={insightError}
            generating={generatingInsight}
            onGenerate={() => void generateInsight()}
            onViewReport={setOpenReportId}
          />
        )}
      </div>
      {loadingList ? <LoadingRelatorios /> : null}
      {!loadingList && listError ? <ErrorState message={listError} /> : null}
      {!loadingList && !listError && items?.length === 0 ? (
        <EmptyState title="Nenhum relatório gerado ainda" description="Gere seu primeiro relatório de IA acima." />
      ) : null}
      {!loadingList && !listError && items?.length ? (
        <div className="table-wrap" data-tour="relatorios-list">
          <table>
            <thead><tr><th>Período</th><th>Gerado em</th><th>Ação</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.start_date)} a {formatDate(item.end_date)}</td>
                  <td className="muted">{formatDateTime(item.generated_at)}</td>
                  <td><button type="button" className="button secondary" onClick={() => setOpenReportId(item.id)}>Ver relatório</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <ReportDetailModal reportId={openReportId} onClose={() => setOpenReportId(null)} />
    </section>
  );
}
