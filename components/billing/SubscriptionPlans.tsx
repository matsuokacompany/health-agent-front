'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/design';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { useAuth } from '@/components/auth/AuthProvider';
import { billingApi } from '@/services/billing';
import { usersApi } from '@/services/users';
import type { BillingPlan, Subscription } from '@/lib/types';

const CYCLE_ORDER = ['MONTHLY', 'SEMIANNUALLY', 'YEARLY'] as const;
const CYCLE_LABEL: Record<(typeof CYCLE_ORDER)[number], string> = { MONTHLY: 'Mensal', SEMIANNUALLY: 'Semestral', YEARLY: 'Anual' };
const CYCLE_UNIT: Record<(typeof CYCLE_ORDER)[number], string> = { MONTHLY: 'mês', SEMIANNUALLY: 'semestre', YEARLY: 'ano' };

const PROFESSIONAL_BENEFITS = [
  'Cadastre pacientes dentro da faixa do seu plano, sem custo extra por paciente',
  'Gere relatórios de evolução com apoio de IA para cada paciente, quando precisar',
  'Envie pedidos de vínculo e receba os check-ins de WhatsApp organizados por paciente',
  'Cancele quando quiser e peça reembolso em até 7 dias após o primeiro pagamento',
];
const PATIENT_BENEFITS = [
  'Check-ins diários direto no seu WhatsApp, sem precisar abrir nenhum app',
  'Relatório de evolução com adesão, tendência de sintomas e histórico completo',
  'Resumo em linguagem simples gerado por IA, sempre que você quiser',
  'Cancele quando quiser e peça reembolso em até 7 dias após o primeiro pagamento',
];

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function monthlyEquivalentCents(plan: BillingPlan) {
  return plan.price_cents / plan.months;
}

function monthlyEquivalent(plan: BillingPlan) {
  return formatCurrency(Math.round(monthlyEquivalentCents(plan)));
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
  for (const tierPlans of tiers.values()) {
    tierPlans.sort((a, b) => CYCLE_ORDER.indexOf(a.cycle as (typeof CYCLE_ORDER)[number]) - CYCLE_ORDER.indexOf(b.cycle as (typeof CYCLE_ORDER)[number]));
  }
  return [...tiers.entries()].sort(([a], [b]) => a - b);
}

function savingsPercent(tierPlans: BillingPlan[], plan: BillingPlan) {
  if (plan.cycle === 'MONTHLY') return null;
  const monthlyPlan = tierPlans.find((candidate) => candidate.cycle === 'MONTHLY');
  if (!monthlyPlan || !monthlyPlan.price_cents) return null;
  const percent = Math.round((1 - monthlyEquivalentCents(plan) / monthlyPlan.price_cents) * 100);
  return percent > 0 ? percent : null;
}

function perPatientMonthly(plan: BillingPlan) {
  if (!plan.max_patients) return null;
  return formatCurrency(Math.round(monthlyEquivalentCents(plan) / plan.max_patients));
}

/** Plan comparison + subscribe form, shared by the professional and patient
 * "Assinatura" pages. Every billing cycle is shown at once, side by side, so
 * choosing a plan means picking a card directly instead of switching a tab
 * or toggle first. */
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
  const [cpf, setCpf] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const needsCpf = !user?.cpf;
  const isActive = subscription.status === 'ACTIVE';
  const isProfessional = useMemo(() => plans.some((plan) => (plan.max_patients ?? 0) > 0), [plans]);

  useEffect(() => {
    setSelectedPlanId((current) => current || subscription.plan_id || plans[0]?.id || '');
  }, [plans, subscription.plan_id]);

  const tiers = useMemo(() => groupByTier(plans), [plans]);

  const bestValueTier = useMemo(() => {
    if (!isProfessional) return null;
    let best: number | null = null;
    let bestCostCents = Infinity;
    for (const [maxPatients, tierPlans] of tiers) {
      if (!maxPatients) continue;
      const reference = tierPlans.find((candidate) => candidate.cycle === 'YEARLY') ?? tierPlans[0];
      const costCents = monthlyEquivalentCents(reference) / maxPatients;
      if (costCents < bestCostCents) {
        bestCostCents = costCents;
        best = maxPatients;
      }
    }
    return best;
  }, [tiers, isProfessional]);

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
          <h2>{isProfessional ? 'Mais pacientes, mais relatórios de IA, mais crescimento' : 'Cuide da sua saúde todos os dias, sem complicação'}</h2>
          <p className="muted pricing-subheading">
            {isProfessional
              ? 'Todo plano ativo já inclui relatórios de IA sem limite de uso — a faixa escolhida só define quantos pacientes você pode acompanhar ao mesmo tempo.'
              : 'Você recebe os check-ins pelo WhatsApp e acompanha sua evolução com relatórios e resumos por IA — cancele quando quiser, sem multa.'}
          </p>
        </div>
      </div>

      <ul className="pricing-benefits">
        {(isProfessional ? PROFESSIONAL_BENEFITS : PATIENT_BENEFITS).map((benefit) => (
          <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>
        ))}
      </ul>

      <div className="pricing-tiers">
        {tiers.map(([maxPatients, tierPlans]) => (
          <div className="pricing-tier-group" key={maxPatients}>
            {isProfessional ? (
              <div className="pricing-tier-group-heading">
                <h3>Até {maxPatients} pacientes</h3>
                {maxPatients === bestValueTier ? <span className="pricing-card-badge">Melhor custo-benefício</span> : null}
              </div>
            ) : null}
            <div className="pricing-grid">
              {tierPlans.map((plan) => {
                const isCurrent = plan.id === subscription.plan_id;
                const isSelected = selectedPlanId === plan.id;
                const percentOff = savingsPercent(tierPlans, plan);
                const perPatient = perPatientMonthly(plan);
                const isYearly = plan.cycle === 'YEARLY';
                return (
                  <article
                    className={`pricing-card${isCurrent ? ' is-current' : ''}${isSelected && !isActive ? ' is-selected' : ''}${isYearly ? ' is-highlighted' : ''}`}
                    key={plan.id}
                  >
                    {isYearly ? <span className="pricing-card-badge pricing-card-badge-highlight">Melhor oferta</span> : null}
                    {isCurrent ? <span className="pricing-card-badge is-current-badge">Seu plano atual</span> : null}
                    <h4>{CYCLE_LABEL[plan.cycle as (typeof CYCLE_ORDER)[number]] ?? plan.label}</h4>
                    <p className="pricing-price">
                      <strong>{formatCurrency(plan.price_cents)}</strong>
                      <span className="muted"> /{CYCLE_UNIT[plan.cycle as (typeof CYCLE_ORDER)[number]] ?? 'ciclo'}</span>
                      {percentOff !== null ? <span className="pricing-savings-badge">Economize {percentOff}%</span> : null}
                    </p>
                    {plan.months > 1 ? <p className="muted compact">equivale a {monthlyEquivalent(plan)}/mês</p> : null}
                    {perPatient ? <p className="muted compact">{perPatient} por paciente/mês</p> : null}
                    {!isActive ? (
                      <Button
                        type="button"
                        variant={isSelected ? 'primary' : 'secondary'}
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        {isSelected ? 'Selecionado ✓' : 'Selecionar este plano'}
                      </Button>
                    ) : isCurrent ? (
                      <p className="muted compact">Plano ativo no momento.</p>
                    ) : (
                      <p className="muted compact">Para trocar de plano com assinatura ativa, fale com o suporte da Julha.</p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
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
          <Button disabled={saving || !selectedPlanId} loading={saving} loadingLabel="Abrindo pagamento..." type="submit">Assinar agora</Button>
        </form>
      ) : null}
    </>
  );
}
