import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PatientAssinatura from '@/app/(patient)/patient/assinatura/page';

const billing = vi.hoisted(() => ({ getSubscription: vi.fn(), getPlans: vi.fn() }));
vi.mock('@/services/billing', () => ({ billingApi: billing }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('página de assinatura do paciente', () => {
  it('mostra que o acesso já está coberto por um profissional pagante, sem oferecer planos', async () => {
    billing.getSubscription.mockResolvedValue({ status: 'PENDING', covered_by_professional: true });
    billing.getPlans.mockResolvedValue([{ id: 'monthly', label: 'Mensal', cycle: 'MONTHLY', months: 1, price_cents: 2990 }]);

    render(<PatientAssinatura />);

    expect(await screen.findByText('Coberto pelo seu profissional', { exact: false })).toBeTruthy();
    expect(screen.getByText(/já paga pela plataforma/)).toBeTruthy();
    expect(screen.queryByText('Mensal')).toBeNull();
  });

  it('mostra o status normal e os planos quando não há cobertura profissional', async () => {
    billing.getSubscription.mockResolvedValue({ status: 'PENDING', covered_by_professional: false });
    billing.getPlans.mockResolvedValue([]);

    render(<PatientAssinatura />);

    await waitFor(() => expect(billing.getSubscription).toHaveBeenCalled());
    expect(screen.getByText('🟡 Aguardando pagamento')).toBeTruthy();
  });
});
