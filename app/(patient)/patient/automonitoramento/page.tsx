'use client';

import { useEffect, useState } from 'react';
import { Button, Card, MetricCard } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { SubscriptionActions } from '@/components/billing/SubscriptionActions';
import { SubscriptionPlans } from '@/components/billing/SubscriptionPlans';
import { InsightResultBody } from '@/components/patient/InsightResultBody';
import { billingApi } from '@/services/billing';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import type { BillingPlan, EvolutionReport, SelfMonitoringInsight, Subscription, SubscriptionStatus } from '@/lib/types';

const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  PENDING: '🟡 Aguardando pagamento',
  TRIALING: '🧪 Em período de teste',
  ACTIVE: '🟢 Assinatura ativa',
  PAST_DUE: '🔴 Pagamento atrasado',
  CANCELED: '⚪ Assinatura cancelada',
};

const trendLabel: Record<EvolutionReport['symptom_trend'], string> = {
  increasing: '📈 Sintomas em alta no período',
  decreasing: '📉 Sintomas em queda no período',
  stable: '➡️ Estável no período',
  insufficient_data: 'Dados insuficientes para calcular tendência',
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

function trialDaysRemaining(trialEndsAt?: string | null) {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
}

function TrialBanner({ subscription }: { subscription: Subscription }) {
  if (subscription.status !== 'TRIALING') return null;
  const remaining = trialDaysRemaining(subscription.trial_ends_at);
  const endLabel = formatDate(subscription.trial_ends_at);
  if (remaining === null || !endLabel) return null;

  if (remaining <= 0) {
    return <Card className="patient-dashboard-self-service-card">
      <span className="eyebrow">Teste gratuito</span>
      <h2>Seu período de teste acabou</h2>
      <p className="muted">Assine um plano abaixo para voltar a receber os check-ins pelo WhatsApp e continuar vendo sua evolução.</p>
    </Card>;
  }

  return <Card className="patient-dashboard-self-service-card">
    <span className="eyebrow">Teste gratuito</span>
    <h2>{remaining} {remaining === 1 ? 'dia restante' : 'dias restantes'}</h2>
    <p className="muted">Seu período de teste termina em {endLabel}. Aproveite para acompanhar sua evolução antes de assinar.</p>
  </Card>;
}

function EvolutionPaywall() {
  return <Card>
    <span className="eyebrow">Evolução</span>
    <h2>Assine para continuar</h2>
    <p className="muted">Seu período de teste gratuito terminou. Assine um dos planos acima para voltar a receber os check-ins pelo WhatsApp e ver sua evolução.</p>
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
      <p className="muted">Período de {report.start_date} a {report.end_date}.</p>
    </Card>
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
        Gere um resumo dos seus check-ins dos últimos 30 dias — o que está indo bem, pontos que vale acompanhar e uma
        sugestão sobre conversar com um profissional. Sem diagnóstico, é só um apoio para você chegar mais
        preparado(a) numa consulta.
      </p>
    ) : null}
    {result ? <InsightResultBody result={result} /> : null}
    {notEnoughData ? (
      <p className="notice">Ainda não há check-ins suficientes para gerar o resumo — continue respondendo ao WhatsApp diariamente.</p>
    ) : null}
    {error ? <p className="notice danger">{error}</p> : null}
    <Button
      variant={result ? 'secondary' : 'primary'}
      disabled={generating || notEnoughData}
      loading={generating}
      loadingLabel="Gerando resumo..."
      onClick={onGenerate}
    >
      {result ? 'Atualizar resumo' : 'Gerar resumo com IA'}
    </Button>
    {daysUntilNext !== null && daysUntilNext > 0 ? (
      <p className="muted compact">
        Um novo resumo passa a ser gerado a partir de {daysUntilNext === 1 ? '1 dia' : `${daysUntilNext} dias`}; até
        lá, "Atualizar resumo" só mostra o resultado atual de novo.
      </p>
    ) : null}
    {result ? <p className="muted compact"><a href="/patient/relatorios">Ver histórico completo de resumos →</a></p> : null}
  </Card>;
}

function SubscriptionCard({ subscription, plans, onSubscriptionChanged }: { subscription: Subscription; plans: BillingPlan[]; onSubscriptionChanged(): void | Promise<void> }) {
  return <Card>
    <span className="eyebrow">Assinatura</span>
    <h2>{subscriptionStatusLabel[subscription.status]}</h2>
    {subscription.status !== 'ACTIVE' ? (
      <p className="muted">Assine para manter os check-ins diários pelo WhatsApp e o acompanhamento da sua evolução.</p>
    ) : null}
    <SubscriptionActions subscription={subscription} onChanged={() => void onSubscriptionChanged()} />
    {plans.length ? <SubscriptionPlans subscription={subscription} plans={plans} onSubscribed={onSubscriptionChanged} /> : null}
    <p className="muted compact legal-links">
      <a href="/termos-de-uso" rel="noopener noreferrer" target="_blank">Termos de Uso</a>
      {' · '}
      <a href="/politica-de-privacidade" rel="noopener noreferrer" target="_blank">Política de Privacidade</a>
      {' · '}
      <a href="/politica-de-reembolso" rel="noopener noreferrer" target="_blank">Política de Reembolso</a>
    </p>
  </Card>;
}

function LoadingAutomonitoramento() {
  return <section className="stack" aria-busy="true" aria-label="Carregando automonitoramento">
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>
    <section className="patient-dashboard-summary-grid">
      {Array.from({ length: 4 }, (_, index) => <Card key={index}><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-metric" /></Card>)}
    </section>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></Card>
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>
  </section>;
}

export default function Automonitoramento() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
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
      const [plansResult, subscriptionResult] = await Promise.all([billingApi.getPlans(), billingApi.getSubscription()]);
      setPlans(plansResult);
      setSubscription(subscriptionResult);
      try {
        setReport(await selfMonitoringApi.getEvolutionReport());
        setReportBlocked(false);
      } catch (err) {
        if (err instanceof ApiError && err.status === 402) {
          setReport(null);
          setReportBlocked(true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setLoadError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  if (loading) return <LoadingAutomonitoramento />;
  if (loadError) return <Card><p className="notice danger">{loadError}</p><Button onClick={() => void load()}>Tentar novamente</Button></Card>;

  return <section className="stack" aria-label="Automonitoramento">
    {subscription ? <TrialBanner subscription={subscription} /> : null}
    {subscription ? <SubscriptionCard subscription={subscription} plans={plans} onSubscriptionChanged={() => void load()} /> : null}
    {reportBlocked ? <EvolutionPaywall /> : report ? <EvolutionCard report={report} /> : null}
    {!reportBlocked ? (
      <InsightCard report={report} insight={insight} error={insightError} generating={generatingInsight} onGenerate={() => void generateInsight()} />
    ) : null}
  </section>;
}
