'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { useAuth } from '@/components/auth/AuthProvider';
import { billingApi } from '@/services/billing';
import { usersApi } from '@/services/users';
import type { BillingPlan, Subscription, SubscriptionStatus } from '@/lib/types';

const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  PENDING: '🟡 Aguardando pagamento',
  TRIALING: '🧪 Em período de teste',
  ACTIVE: '🟢 Assinatura ativa',
  PAST_DUE: '🔴 Pagamento atrasado',
  CANCELED: '⚪ Assinatura cancelada',
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function LoadingAssinatura() {
  return <Card><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>;
}

export default function ProfessionalAssinatura() {
  const { user, refreshMe } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cpf, setCpf] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const needsCpf = !user?.cpf;

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [plansResult, subscriptionResult] = await Promise.all([billingApi.getPlans(), billingApi.getSubscription()]);
      setPlans(plansResult);
      setSubscription(subscriptionResult);
      setSelectedPlanId((current) => current || subscriptionResult.plan_id || plansResult[0]?.id || '');
    } catch (err) {
      setLoadError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlanId) return;
    setFormError(null);
    setSaving(true);
    try {
      if (needsCpf) {
        if (!user) throw new Error('Usuário não autenticado.');
        await usersApi.update(Number(user.id), { cpf });
        await refreshMe();
      }
      const result = await billingApi.startCheckout(selectedPlanId);
      if (result.checkout_url && typeof window !== 'undefined') window.open(result.checkout_url, '_blank', 'noopener,noreferrer');
      await load();
    } catch (err) {
      setFormError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingAssinatura />;
  if (loadError) return <Card><p className="notice danger">{loadError}</p><Button onClick={() => void load()}>Tentar novamente</Button></Card>;
  if (!subscription) return null;

  return (
    <section className="patient-dashboard-v2" aria-label="Assinatura">
      <Card>
        <span className="eyebrow">Assinatura</span>
        <h1>{subscriptionStatusLabel[subscription.status]}</h1>
        <p className="muted">
          Com a assinatura ativa você pode cadastrar novos pacientes, gerar relatórios de IA e enviar pedidos de vínculo.
          Pacientes que você já acompanha continuam recebendo os check-ins pelo WhatsApp normalmente, mesmo sem assinatura.
        </p>
        {subscription.status !== 'ACTIVE' ? (
          <form className="login-form" onSubmit={handleSubscribe}>
            {needsCpf ? (
              <label>
                CPF (obrigatório para pagamento)
                <input inputMode="numeric" name="cpf" onChange={(event) => setCpf(event.target.value)} placeholder="000.000.000-00" required value={cpf} />
              </label>
            ) : null}
            {plans.length ? (
              <div className="billing-plan-options">
                {plans.map((plan) => (
                  <label className="billing-plan-option" key={plan.id}>
                    <input checked={selectedPlanId === plan.id} name="plan" onChange={() => setSelectedPlanId(plan.id)} type="radio" value={plan.id} />
                    <span>
                      <strong>{plan.label}</strong>
                      <span className="muted"> — {formatCurrency(plan.price_cents)}</span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="notice">Nenhum plano de profissional configurado ainda. Fale com o suporte da Julha.</p>
            )}
            {formError ? <p className="notice danger">{formError}</p> : null}
            <Button disabled={saving || !plans.length} loading={saving} loadingLabel="Abrindo pagamento..." type="submit">Assinar</Button>
          </form>
        ) : null}
      </Card>
    </section>
  );
}
