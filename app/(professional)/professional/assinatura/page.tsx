'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { useAuth } from '@/components/auth/AuthProvider';
import { SubscriptionActions } from '@/components/billing/SubscriptionActions';
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

const CYCLES = [
  ['MONTHLY', 'Mensal'],
  ['SEMIANNUALLY', 'Semestral'],
  ['YEARLY', 'Anual'],
] as const;
type Cycle = (typeof CYCLES)[number][0];

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function monthlyEquivalent(plan: BillingPlan) {
  return formatCurrency(Math.round(plan.price_cents / plan.months));
}

function tierOf(plan: BillingPlan) {
  return plan.max_patients ?? 0;
}

function groupByTier(plans: BillingPlan[]) {
  const tiers = new Map<number, BillingPlan[]>();
  for (const plan of plans) {
    const key = tierOf(plan);
    tiers.set(key, [...(tiers.get(key) ?? []), plan]);
  }
  return [...tiers.entries()].sort(([a], [b]) => a - b);
}

function LoadingAssinatura() {
  return <Card><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>;
}

export default function ProfessionalAssinatura() {
  const { user, refreshMe } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [cycle, setCycle] = useState<Cycle>('MONTHLY');
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
      const currentPlan = plansResult.find((plan) => plan.id === subscriptionResult.plan_id);
      if (currentPlan) setCycle(currentPlan.cycle as Cycle);
      setSelectedPlanId((current) => current || subscriptionResult.plan_id || plansResult[0]?.id || '');
    } catch (err) {
      setLoadError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const tiers = useMemo(() => groupByTier(plans), [plans]);
  const currentTierPlans = useMemo(
    () => (subscription?.plan_id ? plans.filter((plan) => plan.id === subscription.plan_id) : []),
    [plans, subscription],
  );
  const currentTier = currentTierPlans[0] ? tierOf(currentTierPlans[0]) : null;
  const isActive = subscription?.status === 'ACTIVE';
  const usagePercent = subscription?.max_patients ? Math.min(100, Math.round(((subscription.active_patient_count ?? 0) / subscription.max_patients) * 100)) : null;
  const nearCap = usagePercent !== null && usagePercent >= 80;

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
          <div className="pricing-heading">
            <div><span className="eyebrow">Faixas por nº de pacientes</span><h2>Escolha o plano ideal para o seu volume de pacientes</h2></div>
            <div className="pricing-cycle-toggle" role="group" aria-label="Ciclo de cobrança">
              {CYCLES.map(([value, label]) => (
                <button type="button" key={value} aria-pressed={cycle === value} onClick={() => setCycle(value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="pricing-grid">
            {tiers.map(([maxPatients, tierPlans]) => {
              const plan = tierPlans.find((candidate) => candidate.cycle === cycle) ?? tierPlans[0];
              const isCurrent = currentTier === maxPatients;
              const isSelected = selectedPlanId === plan.id;
              return (
                <article className={`pricing-card${isCurrent ? ' is-current' : ''}${isSelected && !isActive ? ' is-selected' : ''}`} key={maxPatients}>
                  {maxPatients === 25 ? <span className="pricing-card-badge">Mais escolhido</span> : null}
                  {isCurrent ? <span className="pricing-card-badge is-current-badge">Seu plano atual</span> : null}
                  <h3>Até {maxPatients} pacientes</h3>
                  <p className="pricing-price"><strong>{formatCurrency(plan.price_cents)}</strong><span className="muted"> /{plan.cycle === 'MONTHLY' ? 'mês' : plan.cycle === 'SEMIANNUALLY' ? 'semestre' : 'ano'}</span></p>
                  {plan.months > 1 ? <p className="muted compact">equivale a {monthlyEquivalent(plan)}/mês</p> : null}
                  {!isActive ? (
                    <label className="pricing-select">
                      <input type="radio" name="plan" checked={isSelected} onChange={() => setSelectedPlanId(plan.id)} value={plan.id} />
                      Selecionar esta faixa
                    </label>
                  ) : isCurrent ? (
                    <p className="muted compact">Faixa ativa no momento.</p>
                  ) : (
                    <p className="muted compact">Para migrar de faixa com assinatura ativa, fale com o suporte da Julha.</p>
                  )}
                </article>
              );
            })}
          </div>

          {!isActive ? (
            <form className="login-form" onSubmit={handleSubscribe}>
              {needsCpf ? (
                <label>
                  CPF (obrigatório para pagamento)
                  <input inputMode="numeric" name="cpf" onChange={(event) => setCpf(event.target.value)} placeholder="000.000.000-00" required value={cpf} />
                </label>
              ) : null}
              {formError ? <p className="notice danger">{formError}</p> : null}
              <Button disabled={saving || !selectedPlanId} loading={saving} loadingLabel="Abrindo pagamento..." type="submit">Assinar</Button>
            </form>
          ) : null}
        </Card>
      ) : (
        <Card><p className="notice">Nenhum plano de profissional configurado ainda. Fale com o suporte da Julha.</p></Card>
      )}
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
