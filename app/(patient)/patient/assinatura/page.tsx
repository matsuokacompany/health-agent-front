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
    <Card><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></Card>
    <Card className="pricing-card-shell"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card>
  </section>;
}

export default function PatientAssinatura() {
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

  if (loading) return <LoadingAssinatura />;
  if (loadError) return <Card><p className="notice danger">{loadError}</p><Button onClick={() => void load()}>Tentar novamente</Button></Card>;
  if (!subscription) return null;

  return (
    <section className="pricing-page" aria-label="Assinatura">
      <Card data-tour="assinatura-status">
        <span className="eyebrow">Assinatura</span>
        <h1>{subscriptionStatusLabel[subscription.status]}</h1>
        <p className="muted">
          Assine para manter seus check-ins diários pelo WhatsApp e acompanhar sua evolução ao longo do tempo.
        </p>
        <SubscriptionActions subscription={subscription} onChanged={() => void load()} />
      </Card>

      {plans.length ? (
        <Card className="pricing-card-shell" data-tour="assinatura-plans">
          <SubscriptionPlans subscription={subscription} plans={plans} onSubscribed={() => void load()} />
        </Card>
      ) : (
        <Card><p className="notice">Nenhum plano configurado ainda. Fale com o suporte da Julha.</p></Card>
      )}
      <div data-tour="assinatura-invoices"><InvoiceHistory /></div>
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
