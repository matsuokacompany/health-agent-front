'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/design';
import { Modal } from '@/components/ui/Modal';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { billingApi } from '@/services/billing';
import type { Subscription } from '@/lib/types';

const REFUND_WINDOW_DAYS = 7;

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

function withinRefundWindow(firstPaidAt?: string | null) {
  if (!firstPaidAt) return false;
  const paidAt = new Date(firstPaidAt).getTime();
  if (Number.isNaN(paidAt)) return false;
  return Date.now() - paidAt <= REFUND_WINDOW_DAYS * 86_400_000;
}

export function SubscriptionActions({ subscription, onChanged }: { subscription: Subscription; onChanged(next: Subscription): void }) {
  const [confirming, setConfirming] = useState<'cancel' | 'refund' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (subscription.status !== 'ACTIVE') return null;

  async function runAction(action: 'cancel' | 'refund') {
    setSaving(true);
    setError(null);
    try {
      const next = action === 'cancel' ? await billingApi.cancelSubscription() : await billingApi.refundSubscription();
      onChanged(next);
      setConfirming(null);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (subscription.cancel_at_period_end) {
    const endLabel = formatDate(subscription.current_period_end);
    return (
      <div className="subscription-actions">
        <p className="notice">
          Sua assinatura foi cancelada e não será renovada{endLabel ? ` — você continua com acesso até ${endLabel}` : ''}.
        </p>
        {error ? <p className="notice danger">{error}</p> : null}
        <Button variant="secondary" disabled={saving} onClick={() => runAction('cancel')}>
          {saving ? 'Reativando...' : 'Manter assinatura'}
        </Button>
      </div>
    );
  }

  const eligibleForRefund = withinRefundWindow(subscription.first_paid_at);

  return (
    <div className="subscription-actions">
      {error ? <p className="notice danger">{error}</p> : null}
      <div className="subscription-actions-buttons">
        <Button variant="secondary" disabled={saving} onClick={() => setConfirming('cancel')}>Cancelar assinatura</Button>
        {eligibleForRefund ? (
          <Button variant="ghost" disabled={saving} onClick={() => setConfirming('refund')}>Solicitar reembolso (7 dias)</Button>
        ) : null}
      </div>

      <Modal open={confirming === 'cancel'} title="Cancelar assinatura" onClose={() => setConfirming(null)}>
        <p className="muted">
          Você mantém acesso até o fim do ciclo já pago{subscription.current_period_end ? ` (${formatDate(subscription.current_period_end)})` : ''},
          e não haverá nova cobrança depois disso. Você pode reativar a qualquer momento antes dessa data.
        </p>
        <div className="page-actions">
          <Button variant="secondary" disabled={saving} onClick={() => setConfirming(null)}>Voltar</Button>
          <Button disabled={saving} onClick={() => runAction('cancel')}>{saving ? 'Cancelando...' : 'Confirmar cancelamento'}</Button>
        </div>
      </Modal>

      <Modal open={confirming === 'refund'} title="Solicitar reembolso" onClose={() => setConfirming(null)}>
        <p className="muted">
          Você está dentro do prazo de 7 dias de arrependimento. O valor pago será estornado integralmente para o
          método de pagamento utilizado (pode levar até 10 dias úteis para aparecer na fatura) e sua assinatura
          será cancelada imediatamente.
        </p>
        <div className="page-actions">
          <Button variant="secondary" disabled={saving} onClick={() => setConfirming(null)}>Voltar</Button>
          <Button disabled={saving} onClick={() => runAction('refund')}>{saving ? 'Processando...' : 'Confirmar reembolso'}</Button>
        </div>
      </Modal>
    </div>
  );
}
