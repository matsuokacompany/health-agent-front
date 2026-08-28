'use client';

import { useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { InvoiceHistory } from '@/components/billing/InvoiceHistory';
import { SubscriptionActions } from '@/components/billing/SubscriptionActions';
import { SubscriptionPlans } from '@/components/billing/SubscriptionPlans';
import { billingApi } from '@/services/billing';
import type { BillingPlan, Subscription, SubscriptionStatus } from '@/lib/types';

const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  PENDING: '🟡 Aguardando pagamento',
  TRIALING: '🧪 Em período de teste',
  ACTIVE: '🟢 Assinatura ativa',
  PAST_DUE: '🔴 Pagamento atrasado',
  CANCELED: '⚪ Assinatura cancelada',
};

function LoadingAssinatura() {
  return <section className="pricing-page" aria-busy="true" aria-label="Carregando assinatura">
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>
    <Card className="pricing-card-shell"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card>
  </section>;
}

export default function ProfessionalAssinatura() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [plansResult, subscriptionResult] = await Promise.all([billingApi.getPlans(), billingApi.getSubscription()]);
      setPlans(plansResult);
      setSubscription(subscriptionResult);
    } catch (err) {
      setLoadError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const usagePercent = subscription?.max_patients ? Math.min(100, Math.round(((subscription.active_patient_count ?? 0) / subscription.max_patients) * 100)) : null;
  const nearCap = usagePercent !== null && usagePercent >= 80;

  if (loading) return <LoadingAssinatura />;
  if (loadError) return <Card><p className="notice danger">{loadError}</p><Button onClick={() => void load()}>Tentar novamente</Button></Card>;
  if (!subscription) return null;

  return (
    <section className="pricing-page" aria-label="Assinatura">
      <Card>
        <span className="eyebrow">Assinatura</span>
        <h1>{subscriptionStatusLabel[subscription.status]}</h1>
        <p className="muted">
          Com a assinatura ativa você pode cadastrar novos pacientes, gerar relatórios de IA e enviar pedidos de vínculo.
          Pacientes que você já acompanha continuam recebendo os check-ins pelo WhatsApp normalmente, mesmo sem assinatura.
        </p>
        {usagePercent !== null ? (
          <div className={`pricing-usage${nearCap ? ' is-near-cap' : ''}`}>
            <div className="pricing-usage-label">
              <span>{subscription.active_patient_count} de {subscription.max_patients} pacientes ativos</span>
              {nearCap ? <span className="badge risk-alto">Perto do limite</span> : null}
            </div>
            <div className="pricing-usage-bar"><span style={{ width: `${usagePercent}%` }} /></div>
          </div>
        ) : subscription.max_patients === null && (subscription.active_patient_count ?? 0) > 0 ? (
          <p className="muted compact">{subscription.active_patient_count} pacientes ativos · sem limite (acesso cortesia)</p>
        ) : null}
        <SubscriptionActions subscription={subscription} onChanged={() => void load()} />
      </Card>

      {plans.length ? (
        <Card className="pricing-card-shell">
          <SubscriptionPlans subscription={subscription} plans={plans} onSubscribed={() => void load()} />
        </Card>
      ) : (
        <Card><p className="notice">Nenhum plano de profissional configurado ainda. Fale com o suporte da Julha.</p></Card>
      )}
      <InvoiceHistory />
      <p className="muted compact legal-links">
        <a href="/termos-de-uso" rel="noopener noreferrer" target="_blank">Termos de Uso</a>
        {' · '}
        <a href="/politica-de-privacidade" rel="noopener noreferrer" target="_blank">Política de Privacidade</a>
        {' · '}
        <a href="/politica-de-reembolso" rel="noopener noreferrer" target="_blank">Política de Reembolso</a>
      </p>
    </section>
  );
}
