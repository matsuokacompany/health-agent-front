'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthLogo } from '@/components/ui/AuthLogo';
import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { billingApi } from '@/services/billing';
import type { BillingPlan } from '@/lib/types';
import { CYCLE_LABEL, CYCLE_ORDER, CYCLE_UNIT, bestValuePlanId, formatCurrency, groupByTier, monthlyEquivalent, perPatientMonthly, savingsPercent } from '@/lib/pricing';

type Audience = 'patient' | 'professional';

const AUDIENCE_COPY: Record<Audience, { heading: string; subheading: string; cta: string; ctaHref: string }> = {
  patient: {
    heading: 'Cuide da sua saúde todos os dias, sem complicação',
    subheading: 'Receba os check-ins pelo WhatsApp e acompanhe sua evolução com relatórios e resumos por IA — cancele quando quiser, sem multa.',
    cta: 'Criar minha conta',
    ctaHref: '/signup',
  },
  professional: {
    heading: 'Mais pacientes, mais relatórios de IA, mais crescimento',
    subheading: 'Todo plano ativo já inclui relatórios de IA sem limite de uso — a faixa escolhida só define quantos pacientes você acompanha ao mesmo tempo.',
    cta: 'Criar conta de profissional',
    ctaHref: '/signup-profissional',
  },
};

function PricingSkeleton() {
  return <div className="pricing-grid"><SkeletonBlock className="pricing-card-skeleton" /><SkeletonBlock className="pricing-card-skeleton" /><SkeletonBlock className="pricing-card-skeleton" /></div>;
}

export default function PublicPricingPage() {
  const [audience, setAudience] = useState<Audience>('patient');
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    billingApi.getPublicPlans(audience)
      .then((result) => { if (!cancelled) setPlans(result); })
      .catch((err) => { if (!cancelled) setError(toFriendlyErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [audience]);

  const tiers = useMemo(() => groupByTier(plans), [plans]);
  const copy = AUDIENCE_COPY[audience];

  return (
    <main className="public-pricing-page">
      <header className="public-pricing-nav">
        <Link href="/login" className="public-pricing-brand"><AuthLogo /><span className="sidebar-label">Julha</span></Link>
        <div className="public-pricing-nav-actions">
          <Button href="/login" variant="secondary">Entrar</Button>
          <Button href={copy.ctaHref}>Criar conta</Button>
        </div>
      </header>

      <section className="pricing-heading">
        <div>
          <span className="eyebrow">Planos</span>
          <h1>{copy.heading}</h1>
          <p className="muted pricing-subheading">{copy.subheading}</p>
        </div>
        <div className="public-pricing-audience-toggle" role="tablist" aria-label="Público">
          <button type="button" role="tab" aria-selected={audience === 'patient'} className={audience === 'patient' ? 'is-active' : ''} onClick={() => setAudience('patient')}>Para pacientes</button>
          <button type="button" role="tab" aria-selected={audience === 'professional'} className={audience === 'professional' ? 'is-active' : ''} onClick={() => setAudience('professional')}>Para profissionais</button>
        </div>
      </section>

      {loading ? <PricingSkeleton /> : null}
      {!loading && error ? <ErrorState message={error} /> : null}
      {!loading && !error && !plans.length ? <p className="notice">Nenhum plano configurado ainda. Fale com o suporte da Julha.</p> : null}

      {!loading && !error && plans.length ? (
        <div className="pricing-tiers">
          {tiers.map(([maxPatients, tierPlans]) => {
            const bestPlanId = bestValuePlanId(tierPlans);
            return (
              <div className="pricing-tier-group" key={maxPatients}>
                {audience === 'professional' ? (
                  <div className="pricing-tier-group-heading">
                    <h3>Até {maxPatients} pacientes</h3>
                  </div>
                ) : null}
                <div className="pricing-grid">
                  {tierPlans.map((plan) => {
                    const percentOff = savingsPercent(tierPlans, plan);
                    const perPatient = perPatientMonthly(plan);
                    const isBestValue = plan.id === bestPlanId && tierPlans.length > 1;
                    return (
                      <article className={`pricing-card${isBestValue ? ' is-highlighted' : ''}`} key={plan.id}>
                        {isBestValue ? <span className="pricing-card-badge pricing-card-badge-highlight">Melhor oferta</span> : null}
                        <h4>{CYCLE_LABEL[plan.cycle as (typeof CYCLE_ORDER)[number]] ?? plan.label}</h4>
                        <p className="pricing-price">
                          <strong>{formatCurrency(plan.price_cents)}</strong>
                          <span className="muted"> /{CYCLE_UNIT[plan.cycle as (typeof CYCLE_ORDER)[number]] ?? 'ciclo'}</span>
                          {percentOff !== null ? <span className="pricing-savings-badge">Economize {percentOff}%</span> : null}
                        </p>
                        {plan.months > 1 ? <p className="muted compact">equivale a {monthlyEquivalent(plan)}/mês</p> : null}
                        {perPatient ? <p className="muted compact">{perPatient} por paciente/mês</p> : null}
                        <Button href={copy.ctaHref} variant="secondary">{copy.cta}</Button>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <Card>
        <p className="muted compact">
          Já tem conta? <Link href="/login">Entrar</Link>.
          {' '}Cancele quando quiser, direto na plataforma, e peça reembolso em até 7 dias após o primeiro pagamento.
        </p>
      </Card>
    </main>
  );
}
