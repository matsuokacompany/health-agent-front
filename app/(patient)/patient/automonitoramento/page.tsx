'use client';

import { useEffect, useState } from 'react';
import { Button, Card, MetricCard } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { InsightResultBody } from '@/components/patient/InsightResultBody';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import type { EvolutionReport, EvolutionSymptomOccurrence, SelfMonitoringInsight } from '@/lib/types';

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

  return <>
    <section className="patient-dashboard-summary-grid" aria-label="Evolução">
      <MetricCard label="Adesão" value={`${report.metrics.adherence_percentage}%`} description={`${report.metrics.completed_checkins} de ${report.metrics.total_checkins} check-ins`} />
      <MetricCard label="Dias com sintomas" value={report.metrics.checkins_with_symptoms} />
      <MetricCard label="Dias sem sintomas" value={report.metrics.checkins_without_symptoms} />
      <MetricCard label="Maior intervalo sem responder" value={`${report.longest_gap_days} dias`} />
    </section>
    <Card>
      <span className="eyebrow">Tendência</span>
      <h2>{trendLabel[report.symptom_trend]}</h2>
      <p className="muted">Período de {formatDate(report.start_date)} a {formatDate(report.end_date)}.</p>
    </Card>
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
  error,
  generating,
  onGenerate,
}: {
  report: EvolutionReport | null;
  insight: SelfMonitoringInsight | null;
  error: string | null;
  generating: boolean;
  onGenerate(): void;
}) {
  const notEnoughData = Boolean(report && !report.sufficient_data);
  const result = insight?.insight ?? null;
  const daysUntilNext = insight ? insightDaysUntil(insight.next_generation_at) : null;

  return <Card>
    <span className="eyebrow">Resumo por IA</span>
    <h2>{result ? 'Como você tem passado' : 'Resumo da sua evolução, em linguagem simples'}</h2>
    {!result ? (
      <p className="muted">
        Gere um resumo dos seus check-ins e da sua anamnese dos últimos 30 dias — o que está indo bem, pontos que
        vale acompanhar e, quando fizer sentido, que tipo de especialista procurar. Sem diagnóstico, é só um apoio
        para você chegar mais preparado(a) numa consulta.
      </p>
    ) : null}
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
      {result ? <Button variant="secondary" onClick={() => window.print()}>Baixar PDF</Button> : null}
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
      {Array.from({ length: 4 }, (_, index) => <Card key={index}><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-metric" /></Card>)}
    </section>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></Card>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>
  </section>;
}

export default function Automonitoramento() {
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
      setInsight(await selfMonitoringApi.getInsight());
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

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      setReport(await selfMonitoringApi.getEvolutionReport());
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

  useEffect(() => { void load(); }, []);

  if (loading) return <LoadingAutomonitoramento />;
  if (loadError) return <Card><p className="notice danger">{loadError}</p><Button onClick={() => void load()}>Tentar novamente</Button></Card>;

  return <section className="stack" aria-label="Automonitoramento">
    {reportBlocked ? <EvolutionPaywall /> : report ? <EvolutionCard report={report} /> : null}
    {!reportBlocked ? (
      <InsightCard report={report} insight={insight} error={insightError} generating={generatingInsight} onGenerate={() => void generateInsight()} />
    ) : null}
  </section>;
}
