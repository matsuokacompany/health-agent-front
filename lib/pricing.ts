import type { BillingPlan } from '@/lib/types';

export const CYCLE_ORDER = ['MONTHLY', 'SEMIANNUALLY', 'YEARLY'] as const;
export const CYCLE_LABEL: Record<(typeof CYCLE_ORDER)[number], string> = { MONTHLY: 'Mensal', SEMIANNUALLY: 'Semestral', YEARLY: 'Anual' };
export const CYCLE_UNIT: Record<(typeof CYCLE_ORDER)[number], string> = { MONTHLY: 'mês', SEMIANNUALLY: 'semestre', YEARLY: 'ano' };

export function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function monthlyEquivalentCents(plan: BillingPlan) {
  return plan.price_cents / plan.months;
}

export function monthlyEquivalent(plan: BillingPlan) {
  return formatCurrency(Math.round(monthlyEquivalentCents(plan)));
}

export function tierOf(plan: BillingPlan) {
  return plan.max_patients ?? 0;
}

export function groupByTier(plans: BillingPlan[]) {
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

export function savingsPercent(tierPlans: BillingPlan[], plan: BillingPlan) {
  if (plan.cycle === 'MONTHLY') return null;
  const monthlyPlan = tierPlans.find((candidate) => candidate.cycle === 'MONTHLY');
  if (!monthlyPlan || !monthlyPlan.price_cents) return null;
  const percent = Math.round((1 - monthlyEquivalentCents(plan) / monthlyPlan.price_cents) * 100);
  return percent > 0 ? percent : null;
}

export function perPatientMonthly(plan: BillingPlan) {
  if (!plan.max_patients) return null;
  return formatCurrency(Math.round(monthlyEquivalentCents(plan) / plan.max_patients));
}

/** Which cycle actually has the lowest monthly-equivalent cost within a
 * tier — computed from the real prices instead of always assuming the
 * longest cycle wins, so a "best offer" badge can't go stale if a plan's
 * pricing is ever configured to break that assumption. */
export function bestValuePlanId(tierPlans: BillingPlan[]) {
  let bestId: string | null = null;
  let bestCostCents = Infinity;
  for (const plan of tierPlans) {
    const costCents = monthlyEquivalentCents(plan);
    if (costCents < bestCostCents) {
      bestCostCents = costCents;
      bestId = plan.id;
    }
  }
  return bestId;
}
