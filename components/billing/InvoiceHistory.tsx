'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { billingApi } from '@/services/billing';
import type { Invoice } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Pago',
  RECEIVED: 'Pago',
  RECEIVED_IN_CASH: 'Pago',
  PENDING: 'Pendente',
  OVERDUE: 'Atrasado',
  REFUNDED: 'Estornado',
  REFUND_REQUESTED: 'Estorno solicitado',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatValue(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    billingApi.getInvoices()
      .then(setInvoices)
      .catch((err) => setError(toFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Card><span className="eyebrow">Cobranças</span><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>;
  }

  if (error) {
    return <Card><span className="eyebrow">Cobranças</span><p className="notice danger">{error}</p></Card>;
  }

  if (!invoices.length) {
    return <Card><span className="eyebrow">Cobranças</span><p className="muted compact">Nenhuma cobrança ainda.</p></Card>;
  }

  return (
    <Card>
      <span className="eyebrow">Cobranças</span>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{formatDate(invoice.payment_date ?? invoice.due_date)}</td>
                <td>{invoice.description ?? '—'}</td>
                <td>{formatValue(invoice.value)}</td>
                <td>{STATUS_LABEL[invoice.status] ?? invoice.status}</td>
                <td>{invoice.invoice_url ? <a href={invoice.invoice_url} rel="noopener noreferrer" target="_blank">Ver fatura</a> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
