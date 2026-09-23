'use client';

import { Warning } from '@phosphor-icons/react';
import { Button, Card } from '@/components/ui/design';
import { EvolutionMetricsGrid } from '@/components/patient/EvolutionMetricsGrid';
import { InsightResultBody } from '@/components/patient/InsightResultBody';
import type { EvolutionRedFlagEvent, EvolutionReport, EvolutionSymptomOccurrence, SelfMonitoringInsight, SelfMonitoringInsightListItem } from '@/lib/types';

export const PERIOD_PRESETS = [
  [30, 'Últimos 30 dias'],
  [90, 'Últimos 90 dias'],
  [180, 'Últimos 6 meses'],
  [365, 'Último ano'],
] as const;
export type PeriodDays = (typeof PERIOD_PRESETS)[number][0];
// The dashboard and the reports module both default to a full year, wide
// enough to give a doctor a real longitudinal view instead of a snapshot.
export const DEFAULT_PERIOD_DAYS: PeriodDays = 365;

export function formatReportDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

export function EvolutionPaywall() {
  return <Card>
    <span className="eyebrow">Evolução</span>
    <h2>Assine para continuar</h2>
    <p className="muted">
      Seu período de teste gratuito terminou. <a href="/patient/assinatura">Assine um plano</a> para voltar a
      receber os check-ins pelo WhatsApp e ver sua evolução.
    </p>
  </Card>;
}

export function SymptomsCard({ symptoms }: { symptoms: EvolutionSymptomOccurrence[] }) {
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
            {formatReportDate(symptom.last_reported_at) ? ` · última em ${formatReportDate(symptom.last_reported_at)}` : ''}
          </span>
        </div>
      ))}
    </div>
  </Card>;
}

export function PeriodSelector({ selected, onChange, disabled }: { selected: PeriodDays; onChange(days: PeriodDays): void; disabled?: boolean }) {
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

export function RedFlagEventsCard({ events }: { events: EvolutionRedFlagEvent[] }) {
  if (!events.length) return null;
  return <Card className="patient-red-flag-card" data-tour="patient-red-flags">
    <span className="eyebrow">Sinais de alerta</span>
    <h2><Warning aria-hidden="true" size={20} weight="duotone" /> Sinais identificados no período</h2>
    <p className="muted">
      Detectados automaticamente a partir das suas respostas nos check-ins — mostre isso ao profissional que for
      avaliar este relatório.
    </p>
    <div className="stack compact">
      {events.map((event, index) => (
        <div key={`${event.report_date}-${index}`} className="list-row">
          <span>{event.category_label}</span>
          <span className="muted">{formatReportDate(event.report_date)}</span>
        </div>
      ))}
    </div>
  </Card>;
}

export function RiskFactorsCard({ riskFactors }: { riskFactors: string[] }) {
  if (!riskFactors.length) return null;
  return <Card data-tour="patient-risk-factors">
    <span className="eyebrow">Histórico de saúde</span>
    <h2>Fatores de risco registrados</h2>
    <ul>{riskFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
  </Card>;
}

/** The at-a-glance evolution overview for a selected period -- metrics grid,
 * red flags, risk factors and most-frequent symptoms, all as reported by the
 * patient's own check-ins with their dates, so a professional reviewing this
 * can see not just a conclusion but the records and dates behind it. */
export function EvolutionCard({ report }: { report: EvolutionReport }) {
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
    <EvolutionMetricsGrid report={report} />
    <RedFlagEventsCard events={report.red_flag_events} />
    <RiskFactorsCard riskFactors={report.risk_factors} />
    <SymptomsCard symptoms={report.symptoms} />
  </>;
}

export function insightDaysUntil(nextGenerationAt?: string | null) {
  if (!nextGenerationAt) return null;
  const next = new Date(nextGenerationAt);
  if (Number.isNaN(next.getTime())) return null;
  return Math.max(0, Math.ceil((next.getTime() - Date.now()) / 86_400_000));
}

/** The "generate an AI report" action -- lives primarily on /patient/relatorios
 * now, and also as a shortcut on the dashboard (both pass the same period
 * filter through, so the button always matches whatever range is on screen). */
export function InsightGenerationCard({
  report,
  insight,
  latestInsight,
  periodLabel,
  error,
  generating,
  onGenerate,
  compact = false,
}: {
  report: EvolutionReport | null;
  insight: SelfMonitoringInsight | null;
  latestInsight: SelfMonitoringInsightListItem | null;
  periodLabel: string;
  error: string | null;
  generating: boolean;
  onGenerate(): void;
  compact?: boolean;
}) {
  const notEnoughData = Boolean(report && !report.sufficient_data);
  const result = insight?.insight ?? null;
  // Cooldown is per patient, not per period selected above -- read it from
  // the patient's latest insight (fetched once, independent of the period
  // selector) so switching periods can't hide an active cooldown and make
  // the button look available again when it isn't.
  const daysUntilNext = latestInsight ? insightDaysUntil(latestInsight.next_generation_at) : null;
  const cooldownActive = daysUntilNext !== null && daysUntilNext > 0;
  const resultPeriodLabel = insight ? `${formatReportDate(insight.start_date)} a ${formatReportDate(insight.end_date)}` : null;

  return <Card>
    <span className="eyebrow">Relatório de IA</span>
    <h2>{result ? 'Como você tem passado' : (compact ? 'Relatório de IA para o médico' : 'Relatório da sua evolução, para levar ao médico')}</h2>
    {!result ? (
      <p className="muted">
        Gere um relatório dos seus check-ins e da sua anamnese no período selecionado ({periodLabel}) — o que está
        indo bem, pontos que vale acompanhar e, quando fizer sentido, que tipo de especialista procurar. Sem
        diagnóstico, é só um apoio para você chegar mais preparado(a) numa consulta.
      </p>
    ) : null}
    {result && resultPeriodLabel ? <p className="muted compact">Período considerado: {resultPeriodLabel}.</p> : null}
    {result ? <InsightResultBody result={result} /> : null}
    {notEnoughData ? (
      <p className="notice">Ainda não há check-ins suficientes para gerar o relatório — continue respondendo ao WhatsApp diariamente.</p>
    ) : null}
    {error ? <p className="notice danger">{error}</p> : null}
    {cooldownActive ? (
      <p className="notice compact">
        Você já gerou um relatório recentemente. Um novo relatório pode ser gerado a cada 15 dias. Faltam{' '}
        {daysUntilNext === 1 ? '1 dia' : `${daysUntilNext} dias`} para o próximo.
        {latestInsight ? <> {' '}<a href={`/patient/relatorios/${latestInsight.id}`}>Ver o relatório mais recente →</a></> : null}
      </p>
    ) : null}
    <div className="page-actions">
      <Button
        variant={result ? 'secondary' : 'primary'}
        disabled={generating || notEnoughData || cooldownActive}
        loading={generating}
        loadingLabel="Gerando relatório..."
        onClick={onGenerate}
      >
        {cooldownActive ? 'Disponível novamente em breve' : result ? 'Atualizar relatório' : 'Gerar relatório de IA'}
      </Button>
    </div>
    {!compact ? <p className="muted compact"><a href="/patient/relatorios">Ver histórico completo de relatórios →</a></p> : null}
  </Card>;
}
