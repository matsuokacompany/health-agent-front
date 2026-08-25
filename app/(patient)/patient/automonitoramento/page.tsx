'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button, Card, MetricCard } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { useAuth } from '@/components/auth/AuthProvider';
import { billingApi } from '@/services/billing';
import { selfMonitoringApi } from '@/services/selfMonitoring';
import { usersApi } from '@/services/users';
import type { EvolutionReport, Subscription, SubscriptionStatus } from '@/lib/types';

const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  PENDING: '🟡 Aguardando pagamento',
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

function SubscriptionCard({ subscription, onCheckout }: { subscription: Subscription; onCheckout(): Promise<void> }) {
  const { user, refreshMe } = useAuth();
  const [cpf, setCpf] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsCpf = !user?.cpf;

  async function handleSubscribe(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (needsCpf) {
        if (!user) throw new Error('Usuário não autenticado.');
        await usersApi.update(Number(user.id), { cpf });
        await refreshMe();
      }
      await onCheckout();
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
        {needsCpf ? (
          <label>
            CPF (obrigatório para pagamento)
            <input inputMode="numeric" name="cpf" onChange={(event) => setCpf(event.target.value)} placeholder="000.000.000-00" required value={cpf} />
          </label>
        ) : null}
        {error ? <p className="notice danger">{error}</p> : null}
        <Button disabled={saving} loading={saving} loadingLabel="Abrindo pagamento..." type="submit">Assinar</Button>
      </form>
    ) : null}
  </Card>;
}

function LoadingAutomonitoramento() {
  return <section className="patient-dashboard-v2"><Card><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card></section>;
}

export default function Automonitoramento() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [report, setReport] = useState<EvolutionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [subscriptionResult, reportResult] = await Promise.all([
        billingApi.getSubscription(),
        selfMonitoringApi.getEvolutionReport(),
      ]);
      setSubscription(subscriptionResult);
      setReport(reportResult);
    } catch (err) {
      setLoadError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleCheckout() {
    const result = await billingApi.startCheckout();
    if (result.checkout_url && typeof window !== 'undefined') window.open(result.checkout_url, '_blank', 'noopener,noreferrer');
    setSubscription({ status: result.status });
  }

  if (loading) return <LoadingAutomonitoramento />;
  if (loadError) return <Card><p className="notice danger">{loadError}</p><Button onClick={() => void load()}>Tentar novamente</Button></Card>;

  return <section className="patient-dashboard-v2" aria-label="Automonitoramento">
    {subscription ? <SubscriptionCard subscription={subscription} onCheckout={handleCheckout} /> : null}
    {report ? <EvolutionCard report={report} /> : null}
  </section>;
}
