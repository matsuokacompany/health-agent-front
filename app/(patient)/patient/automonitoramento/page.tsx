'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, MetricCard } from '@/components/ui/design';
import { MetricCardSkeleton, SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { InsightResultBody } from '@/components/patient/InsightResultBody';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import { shortcutPeriod } from '@/services/aiReports';
import type { EvolutionRedFlagEvent, EvolutionReport, EvolutionSymptomOccurrence, SelfMonitoringInsight } from '@/lib/types';

const PERIOD_PRESETS = [
  [30, 'Últimos 30 dias'],
  [90, 'Últimos 90 dias'],
  [180, 'Últimos 6 meses'],
  [365, 'Último ano'],
] as const;
type PeriodDays = (typeof PERIOD_PRESETS)[number][0];

const trendLabel: Record<EvolutionReport['symptom_trend'], string> = {
  increasing: '📈 Sintomas em alta no período',
  decreasing: '📉 Sintomas em queda no período',
  stable: '➡️ Estável no período',
  insufficient_data: 'Dados insuficientes para calcular tendência',
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

function EvolutionPaywall() {
  return <Card>
    <span className="eyebrow">Evolução</span>
    <h2>Assine para continuar</h2>
    <p className="muted">
      Seu período de teste gratuito terminou. <a href="/patient/assinatura">Assine um plano</a> para voltar a
      receber os check-ins pelo WhatsApp e ver sua evolução.
    </p>
  </Card>;
}

function SymptomsCard({ symptoms }: { symptoms: EvolutionSymptomOccurrence[] }) {
  if (!symptoms.length) return null;
  return <Card>
    <span className="eyebrow">Sintomas mais frequentes</span>
    <h2>O que você mais relatou no período</h2>
    <div className="stack compact">
      {symptoms.slice(0, 5).map((symptom) => (
        <div key={symptom.description} className="list-row">
          <span>{symptom.description}</span>
          <span className="muted">
            {symptom.occurrences === 1 ? '1 vez' : `${symptom.occurrences} vezes`}
            {formatDate(symptom.last_reported_at) ? ` · última em ${formatDate(symptom.last_reported_at)}` : ''}
          </span>
        </div>
      ))}
    </div>
  </Card>;
}

function PeriodSelector({ selected, onChange, disabled }: { selected: PeriodDays; onChange(days: PeriodDays): void; disabled?: boolean }) {
  return <div className="ai-shortcuts" aria-label="Período do relatório">
    {PERIOD_PRESETS.map(([days, label]) => (
      <button
        key={days}
        type="button"
        className="button secondary"
        aria-pressed={selected === days}
        disabled={disabled}
        onClick={() => onChange(days)}
      >
        {label}
      </button>
    ))}
  </div>;
}

function RedFlagEventsCard({ events }: { events: EvolutionRedFlagEvent[] }) {
  if (!events.length) return null;
  return <Card className="patient-red-flag-card" data-tour="patient-red-flags">
    <span className="eyebrow">Sinais de alerta</span>
    <h2>⚠️ Sinais identificados no período</h2>
    <p className="muted">
      Detectados automaticamente a partir das suas respostas nos check-ins — mostre isso ao profissional que for
      avaliar este relatório.
    </p>
    <div className="stack compact">
      {events.map((event, index) => (
        <div key={`${event.report_date}-${index}`} className="list-row">
          <span>{event.category_label}</span>
          <span className="muted">{formatDate(event.report_date)}</span>
        </div>
      ))}
    </div>
  </Card>;
}

function RiskFactorsCard({ riskFactors }: { riskFactors: string[] }) {
  if (!riskFactors.length) return null;
  return <Card data-tour="patient-risk-factors">
    <span className="eyebrow">Histórico de saúde</span>
    <h2>Fatores de risco registrados</h2>
    <ul>{riskFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
  </Card>;
}

function EvolutionCard({ report }: { report: EvolutionReport }) {
  if (!report.sufficient_data) {
    return <Card>
      <span className="eyebrow">Evolução</span>
      <h2>Ainda coletando dados</h2>
      <p className="muted">
        São necessários pelo menos {report.minimum_completed_checkins} check-ins concluídos para calcular sua evolução
        ({report.metrics.completed_checkins} até agora).
      </p>
    </Card>;
  }

  const { adherence } = report;
  return <>
    <section className="patient-dashboard-summary-grid" aria-label="Evolução">
      <MetricCard icon="✅" label="Adesão aos check-ins" value={`${report.metrics.adherence_percentage}%`} description={`${report.metrics.completed_checkins} de ${report.metrics.total_checkins} check-ins`} tone={report.metrics.adherence_percentage >= 80 ? 'ok' : 'warn'} />
      <MetricCard icon="🩺" label="Dias com sintomas" value={report.metrics.checkins_with_symptoms} tone={report.metrics.checkins_with_symptoms > 0 ? 'warn' : 'ok'} />
      <MetricCard icon="🌿" label="Dias sem sintomas" value={report.metrics.checkins_without_symptoms} tone="ok" />
      <MetricCard icon="⏳" label="Maior intervalo sem responder" value={`${report.longest_gap_days} dias`} tone={report.longest_gap_days > 2 ? 'warn' : undefined} />
      {adherence.diet_percentage !== null ? <MetricCard icon="🥗" label="Adesão à dieta" value={`${adherence.diet_percentage}%`} tone={adherence.diet_percentage >= 80 ? 'ok' : 'warn'} /> : null}
      {adherence.exercise_percentage !== null ? <MetricCard icon="🏃" label="Adesão ao exercício" value={`${adherence.exercise_percentage}%`} tone={adherence.exercise_percentage >= 80 ? 'ok' : 'warn'} /> : null}
      {adherence.medication_percentage !== null ? <MetricCard icon="💊" label="Adesão à medicação/suplemento" value={`${adherence.medication_percentage}%`} tone={adherence.medication_percentage >= 80 ? 'ok' : 'warn'} /> : null}
    </section>
    <Card>
      <span className="eyebrow">Tendência</span>
      <h2>{trendLabel[report.symptom_trend]}</h2>
      <p className="muted">Período de {formatDate(report.start_date)} a {formatDate(report.end_date)}.</p>
    </Card>
    <RedFlagEventsCard events={report.red_flag_events} />
    <RiskFactorsCard riskFactors={report.risk_factors} />
    <SymptomsCard symptoms={report.symptoms} />
  </>;
}

function insightDaysUntil(nextGenerationAt?: string | null) {
  if (!nextGenerationAt) return null;
  const next = new Date(nextGenerationAt);
  if (Number.isNaN(next.getTime())) return null;
  return Math.max(0, Math.ceil((next.getTime() - Date.now()) / 86_400_000));
}

function InsightCard({
  report,
  insight,
  periodLabel,
  error,
  generating,
  onGenerate,
}: {
  report: EvolutionReport | null;
  insight: SelfMonitoringInsight | null;
  periodLabel: string;
  error: string | null;
  generating: boolean;
  onGenerate(): void;
}) {
  const notEnoughData = Boolean(report && !report.sufficient_data);
  const result = insight?.insight ?? null;
  const daysUntilNext = insight ? insightDaysUntil(insight.next_generation_at) : null;
  // While the 15-day cooldown is active, generating again just returns the
  // cached insight — which may cover a different period than the one
  // currently selected above. Showing the period this specific result
  // actually covers keeps that honest instead of implying it matches the
  // selector.
  const resultPeriodLabel = insight ? `${formatDate(insight.start_date)} a ${formatDate(insight.end_date)}` : null;

  return <Card>
    <span className="eyebrow">Resumo por IA</span>
    <h2>{result ? 'Como você tem passado' : 'Resumo da sua evolução, em linguagem simples'}</h2>
    {!result ? (
      <p className="muted">
        Gere um resumo dos seus check-ins e da sua anamnese no período selecionado ({periodLabel}) — o que está indo
        bem, pontos que vale acompanhar e, quando fizer sentido, que tipo de especialista procurar. Sem diagnóstico,
        é só um apoio para você chegar mais preparado(a) numa consulta.
      </p>
    ) : null}
    {result && resultPeriodLabel ? <p className="muted compact">Período considerado: {resultPeriodLabel}.</p> : null}
    {result ? <InsightResultBody result={result} /> : null}
    {notEnoughData ? (
      <p className="notice">Ainda não há check-ins suficientes para gerar o resumo — continue respondendo ao WhatsApp diariamente.</p>
    ) : null}
    {error ? <p className="notice danger">{error}</p> : null}
    <div className="page-actions">
      <Button
        variant={result ? 'secondary' : 'primary'}
        disabled={generating || notEnoughData}
        loading={generating}
        loadingLabel="Gerando resumo..."
        onClick={onGenerate}
      >
        {result ? 'Atualizar resumo' : 'Gerar resumo com IA'}
      </Button>
    </div>
    {daysUntilNext !== null && daysUntilNext > 0 ? (
      <p className="muted compact">
        Um novo resumo passa a ser gerado a partir de {daysUntilNext === 1 ? '1 dia' : `${daysUntilNext} dias`}; até
        lá, "Atualizar resumo" só mostra o resultado atual de novo.
      </p>
    ) : null}
    {result ? <p className="muted compact"><a href="/patient/relatorios">Ver histórico completo de resumos →</a></p> : null}
  </Card>;
}

function LoadingAutomonitoramento() {
  return <section className="stack" aria-busy="true" aria-label="Carregando automonitoramento">
    <section className="patient-dashboard-summary-grid">
      {Array.from({ length: 4 }, (_, index) => <MetricCardSkeleton key={index} />)}
    </section>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></Card>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>
  </section>;
}

export default function Automonitoramento() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodDays>(30);
  const period = useMemo(() => shortcutPeriod(selectedPeriod), [selectedPeriod]);
  const [report, setReport] = useState<EvolutionReport | null>(null);
  const [reportBlocked, setReportBlocked] = useState(false);
  const [insight, setInsight] = useState<SelfMonitoringInsight | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function generateInsight() {
    setGeneratingInsight(true);
    setInsightError(null);
    try {
      setInsight(await selfMonitoringApi.getInsight(period));
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        // The evolution-report paywall above already explains this — no
        // need for a second error message for the same cause.
        setInsight(null);
      } else {
        setInsightError(toFriendlyErrorMessage(err));
      }
    } finally {
      setGeneratingInsight(false);
    }
  }

  async function load(currentPeriod: { start_date: string; end_date: string }) {
    setLoading(true);
    setLoadError(null);
    try {
      setReport(await selfMonitoringApi.getEvolutionReport(currentPeriod));
      setReportBlocked(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setReport(null);
        setReportBlocked(true);
      } else {
        setLoadError(toFriendlyErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // A summary generated for a different period than the one now selected
    // would otherwise keep showing under the new selection until the
    // patient clicks "Gerar resumo com IA" again -- clear it so the card
    // goes back to prompting a fresh generation for the period just picked.
    setInsight(null);
    setInsightError(null);
    void load(period);
  }, [period]);

  if (loading) return <LoadingAutomonitoramento />;
  if (loadError) return <Card><p className="notice danger">{loadError}</p><Button onClick={() => void load(period)}>Tentar novamente</Button></Card>;

  const periodLabel = (PERIOD_PRESETS.find(([days]) => days === selectedPeriod)?.[1] ?? '').toLowerCase();

  return <section className="stack" aria-label="Automonitoramento">
    {!reportBlocked ? <div className="professional-section-heading">
      <div><span className="eyebrow">Automonitoramento</span><h1>Seu relatório de acompanhamento</h1><p className="muted">Mostre este relatório a um médico ou nutricionista — reúne o que você relatou, sinais identificados e seu histórico de saúde.</p></div>
      {report?.sufficient_data ? <Button variant="secondary" onClick={() => window.print()}>Baixar PDF / Imprimir</Button> : null}
    </div> : null}
    {!reportBlocked ? <PeriodSelector selected={selectedPeriod} onChange={setSelectedPeriod} disabled={loading} /> : null}
    {reportBlocked ? <EvolutionPaywall /> : report ? <EvolutionCard report={report} /> : null}
    {!reportBlocked ? (
      <InsightCard report={report} insight={insight} periodLabel={periodLabel} error={insightError} generating={generatingInsight} onGenerate={() => void generateInsight()} />
    ) : null}
  </section>;
}
