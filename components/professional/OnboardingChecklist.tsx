'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { billingApi } from '@/services/billing';
import type { Subscription } from '@/lib/types';

const ACCESS_GRANTING_STATUSES = new Set(['ACTIVE', 'TRIALING']);

export function OnboardingChecklist({ patientCount, onAddPatient }: { patientCount: number; onAddPatient(): void }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    billingApi.getSubscription().then(setSubscription).catch(() => {});
  }, []);

  const hasAccess = subscription ? ACCESS_GRANTING_STATUSES.has(subscription.status) : false;
  const hasPatient = patientCount > 0;

  if (subscription === null) return null;
  if (hasAccess && hasPatient) return null;

  return (
    <article className="card onboarding-checklist">
      <span className="eyebrow">Primeiros passos</span>
      <h2>Vamos configurar sua conta</h2>
      <ul>
        <li className={hasAccess ? 'is-done' : ''}>
          <span aria-hidden="true">{hasAccess ? '✓' : '1'}</span>
          <div>
            <p>Ative sua assinatura</p>
            {!hasAccess ? <Link href="/professional/assinatura">Escolher plano →</Link> : <span className="muted">Concluído</span>}
          </div>
        </li>
        <li className={hasPatient ? 'is-done' : ''}>
          <span aria-hidden="true">{hasPatient ? '✓' : '2'}</span>
          <div>
            <p>Cadastre seu primeiro paciente</p>
            {!hasPatient ? <button type="button" className="link-button" onClick={onAddPatient}>Cadastrar paciente →</button> : <span className="muted">Concluído</span>}
          </div>
        </li>
      </ul>
    </article>
  );
}
