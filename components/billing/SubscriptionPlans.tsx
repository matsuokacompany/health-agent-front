'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/design';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { useAuth } from '@/components/auth/AuthProvider';
import { billingApi } from '@/services/billing';
import { usersApi } from '@/services/users';
import type { BillingPlan, Subscription } from '@/lib/types';

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

/** Plan grid + cycle toggle + subscribe form, shared by the professional and
 * patient "Assinatura" pages so both let the caller pick a billing cycle
 * before subscribing. */
export function SubscriptionPlans({
  subscription,
  plans,
  onSubscribed,
}: {
  subscription: Subscription;
  plans: BillingPlan[];
  onSubscribed(): void | Promise<void>;
}) {
  const { user, refreshMe } = useAuth();
  const [cycle, setCycle] = useState<Cycle>('MONTHLY');
  const [cpf, setCpf] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const needsCpf = !user?.cpf;
  const isActive = subscription.status === 'ACTIVE';

  useEffect(() => {
    const currentPlan = plans.find((plan) => plan.id === subscription.plan_id);
    if (currentPlan) setCycle(currentPlan.cycle as Cycle);
    setSelectedPlanId((current) => current || subscription.plan_id || plans[0]?.id || '');
  }, [plans, subscription.plan_id]);

  const tiers = useMemo(() => groupByTier(plans), [plans]);
  const currentTierPlans = useMemo(
    () => (subscription.plan_id ? plans.filter((plan) => plan.id === subscription.plan_id) : []),
    [plans, subscription.plan_id],
  );
  const currentTier = currentTierPlans[0] ? tierOf(currentTierPlans[0]) : null;
  const availableCycles = useMemo(() => new Set(plans.map((plan) => plan.cycle)), [plans]);

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
      await onSubscribed();
    } catch (err) {
      setFormError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!plans.length) {
    return <p className="notice">Nenhum plano configurado ainda. Fale com o suporte da Julha.</p>;
  }

  return (
    <>
      <div className="pricing-heading">
        <div>
          <span className="eyebrow">Planos</span>
          <h2>Escolha o plano ideal para você</h2>
        </div>
        <div className="pricing-cycle-toggle" role="group" aria-label="Ciclo de cobrança">
          {CYCLES.filter(([value]) => availableCycles.has(value)).map(([value, label]) => (
            <button type="button" key={value} aria-pressed={cycle === value} onClick={() => setCycle(value)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="pricing-grid">
        {tiers.map(([maxPatients, tierPlans]) => {
          const plan = tierPlans.find((candidate) => candidate.cycle === cycle) ?? tierPlans[0];
          const isCurrent = currentTier === maxPatients;
          const isSelected = selectedPlanId === plan.id;
          const heading = maxPatients > 0 ? `Até ${maxPatients} pacientes` : plan.label;
          return (
            <article className={`pricing-card${isCurrent ? ' is-current' : ''}${isSelected && !isActive ? ' is-selected' : ''}`} key={maxPatients}>
              {maxPatients === 25 ? <span className="pricing-card-badge">Mais escolhido</span> : null}
              {isCurrent ? <span className="pricing-card-badge is-current-badge">Seu plano atual</span> : null}
              <h3>{heading}</h3>
              <p className="pricing-price"><strong>{formatCurrency(plan.price_cents)}</strong><span className="muted"> /{plan.cycle === 'MONTHLY' ? 'mês' : plan.cycle === 'SEMIANNUALLY' ? 'semestre' : 'ano'}</span></p>
              {plan.months > 1 ? <p className="muted compact">equivale a {monthlyEquivalent(plan)}/mês</p> : null}
              {!isActive ? (
                <label className="pricing-select">
                  <input type="radio" name="plan" checked={isSelected} onChange={() => setSelectedPlanId(plan.id)} value={plan.id} />
                  Selecionar
                </label>
              ) : isCurrent ? (
                <p className="muted compact">Plano ativo no momento.</p>
              ) : (
                <p className="muted compact">Para trocar de plano com assinatura ativa, fale com o suporte da Julha.</p>
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
    </>
  );
}
