'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button, Card, MetricCard } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { useAuth } from '@/components/auth/AuthProvider';
import { billingApi } from '@/services/billing';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import { usersApi } from '@/services/users';
import type { BillingPlan, EvolutionReport, Subscription, SubscriptionStatus } from '@/lib/types';

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

function SubscriptionCard({ subscription, plans, onCheckout }: { subscription: Subscription; plans: BillingPlan[]; onCheckout(planId: string): Promise<void> }) {
  const { user, refreshMe } = useAuth();
  const [cpf, setCpf] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(subscription.plan_id ?? plans[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsCpf = !user?.cpf;

  useEffect(() => {
    if (!selectedPlanId && plans[0]) setSelectedPlanId(plans[0].id);
  }, [plans, selectedPlanId]);

  async function handleSubscribe(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!selectedPlanId) return;
    setError(null);
    setSaving(true);
    try {
      if (needsCpf) {
        if (!user) throw new Error('Usuário não autenticado.');
        await usersApi.update(Number(user.id), { cpf });
        await refreshMe();
      }
      await onCheckout(selectedPlanId);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return <Card>
    <span className="eyebrow">Assinatura</span>
    <h2>{subscriptionStatusLabel[subscription.status]}</h2>
    {subscription.status !== 'ACTIVE' ? (
      <form className="login-form" onSubmit={handleSubscribe}>
        <p className="muted">Assine para manter os check-ins diários pelo WhatsApp e o acompanhamento da sua evolução.</p>
        {needsCpf ? (
          <label>
            CPF (obrigatório para pagamento)
            <input inputMode="numeric" name="cpf" onChange={(event) => setCpf(event.target.value)} placeholder="000.000.000-00" required value={cpf} />
          </label>
        ) : null}
        {error ? <p className="notice danger">{error}</p> : null}
        <Button disabled={saving || !plans.length} loading={saving} loadingLabel="Abrindo pagamento..." type="submit">Assinar</Button>
      </form>
    ) : null}
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
  return <section className="patient-dashboard-v2"><Card><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card></section>;
}

export default function Automonitoramento() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [report, setReport] = useState<EvolutionReport | null>(null);
  const [reportBlocked, setReportBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  async function handleCheckout(planId: string) {
    const result = await billingApi.startCheckout(planId);
    if (result.checkout_url && typeof window !== 'undefined') window.open(result.checkout_url, '_blank', 'noopener,noreferrer');
    await load();
  }

  if (loading) return <LoadingAutomonitoramento />;
  if (loadError) return <Card><p className="notice danger">{loadError}</p><Button onClick={() => void load()}>Tentar novamente</Button></Card>;

  return <section className="patient-dashboard-v2" aria-label="Automonitoramento">
    {subscription ? <TrialBanner subscription={subscription} /> : null}
    {subscription ? <SubscriptionCard subscription={subscription} plans={plans} onCheckout={handleCheckout} /> : null}
    {reportBlocked ? <EvolutionPaywall /> : report ? <EvolutionCard report={report} /> : null}
  </section>;
}
