'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/design';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { useAuth } from '@/components/auth/AuthProvider';
import { billingApi } from '@/services/billing';
import { usersApi } from '@/services/users';
import type { BillingPlan, Subscription } from '@/lib/types';
import {
  CYCLE_LABEL,
  CYCLE_ORDER,
  CYCLE_UNIT,
  bestValuePlanId,
  formatCurrency,
  groupByTier,
  monthlyEquivalent,
  monthlyEquivalentCents,
  perPatientMonthly,
  savingsPercent,
} from '@/lib/pricing';

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
// One line differentiating each professional tier beyond the patient cap —
// shared PROFESSIONAL_BENEFITS above still cover what every tier includes.
const TIER_TAGLINE: Record<number, string> = {
  10: 'Ideal para quem está começando a acompanhar pacientes pela Julha',
  25: 'Para consultórios em crescimento, com mais pacientes simultâneos',
  50: 'Para clínicas e equipes com alto volume de pacientes ativos',
};

/** Plan comparison, shared by the professional and patient "Assinatura" pages.
 * Every billing cycle is shown at once, side by side; each card's own button
 * subscribes to (or switches to) that plan directly, no separate selection step. */
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
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeNotice, setChangeNotice] = useState<string | null>(null);
  const needsCpf = !user?.cpf;
  const isActive = subscription.status === 'ACTIVE';
  const isProfessional = useMemo(() => plans.some((plan) => (plan.max_patients ?? 0) > 0), [plans]);

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

  async function handleSubscribeToPlan(planId: string) {
    setFormError(null);
    if (needsCpf && !cpf.trim()) {
      setFormError('Informe seu CPF para continuar.');
      return;
    }
    setSubscribingPlanId(planId);
    try {
      if (needsCpf) {
        if (!user) throw new Error('Usuário não autenticado.');
        await usersApi.update(Number(user.id), { cpf });
        await refreshMe();
      }
      const result = await billingApi.startCheckout(planId);
      if (result.checkout_url && typeof window !== 'undefined') window.open(result.checkout_url, '_blank', 'noopener,noreferrer');
      await onSubscribed();
    } catch (err) {
      setFormError(toFriendlyErrorMessage(err));
    } finally {
      setSubscribingPlanId(null);
    }
  }

  async function handleChangePlan(planId: string) {
    setChangeError(null);
    setChangeNotice(null);
    setChangingPlanId(planId);
    try {
      const result = await billingApi.changePlan(planId);
      if (result.checkout_url && typeof window !== 'undefined') {
        window.open(result.checkout_url, '_blank', 'noopener,noreferrer');
        setChangeNotice('Plano atualizado agora mesmo. Abrimos a cobrança proporcional do restante deste ciclo em outra aba — finalize o pagamento por lá.');
      } else {
        setChangeNotice('Plano atualizado agora mesmo.');
      }
      await onSubscribed();
    } catch (err) {
      setChangeError(toFriendlyErrorMessage(err));
    } finally {
      setChangingPlanId(null);
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

      {changeNotice ? <p className="notice success">{changeNotice}</p> : null}
      {changeError ? <p className="notice danger">{changeError}</p> : null}

      {!isActive && needsCpf ? (
        <label className="pricing-cpf-field">
          CPF (obrigatório para pagamento)
          <input inputMode="numeric" name="cpf" onChange={(event) => setCpf(event.target.value)} placeholder="000.000.000-00" required value={cpf} />
        </label>
      ) : null}
      {!isActive && formError ? <p className="notice danger">{formError}</p> : null}

      <div className="pricing-tiers">
        {tiers.map(([maxPatients, tierPlans]) => {
          const bestPlanId = bestValuePlanId(tierPlans);
          return (
            <div className="pricing-tier-group" key={maxPatients}>
              {isProfessional ? (
                <div className="pricing-tier-group-heading">
                  <h3>Até {maxPatients} pacientes</h3>
                  {maxPatients === bestValueTier ? <span className="pricing-tier-badge">Melhor custo-benefício</span> : null}
                  {TIER_TAGLINE[maxPatients] ? <p className="muted compact">{TIER_TAGLINE[maxPatients]}</p> : null}
                </div>
              ) : null}
              <div className="pricing-grid">
                {tierPlans.map((plan) => {
                  const isCurrent = plan.id === subscription.plan_id;
                  const percentOff = savingsPercent(tierPlans, plan);
                  const perPatient = perPatientMonthly(plan);
                  const isBestValue = plan.id === bestPlanId && tierPlans.length > 1;
                  return (
                    <article
                      className={`pricing-card${isCurrent ? ' is-current' : ''}${isBestValue ? ' is-highlighted' : ''}`}
                      key={plan.id}
                    >
                      {isBestValue ? <span className="pricing-card-badge pricing-card-badge-highlight">Melhor oferta</span> : null}
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
                          variant={isBestValue ? 'primary' : 'secondary'}
                          loading={subscribingPlanId === plan.id}
                          loadingLabel="Abrindo pagamento..."
                          disabled={subscribingPlanId !== null}
                          onClick={() => handleSubscribeToPlan(plan.id)}
                        >
                          Assinar agora
                        </Button>
                      ) : isCurrent ? (
                        <p className="muted compact">Plano ativo no momento.</p>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          loading={changingPlanId === plan.id}
                          loadingLabel="Trocando..."
                          disabled={changingPlanId !== null}
                          onClick={() => handleChangePlan(plan.id)}
                        >
                          Trocar para este plano
                        </Button>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
