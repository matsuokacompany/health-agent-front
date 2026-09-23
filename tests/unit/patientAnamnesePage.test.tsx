import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import PatientAnamnese from '@/app/(patient)/patient/anamnese/page';

const anamnese = vi.hoisted(() => ({ me: vi.fn() }));
vi.mock('@/services/anamnese', () => ({ anamnesesApi: { me: anamnese.me } }));

const auth = vi.hoisted(() => ({ user: { id: 10, name: 'Paciente' } as { id: number; name: string } | null }));
vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: auth.user }) }));

const patientData = vi.hoisted(() => ({ plans: [] as Array<{ origin: string; active?: boolean; status?: string }>, loading: false }));
vi.mock('@/components/patient/PatientDataProvider', () => ({ usePatientData: () => patientData }));

const supplements = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@/services/supplements', () => ({ supplementsApi: { list: supplements.list, create: vi.fn(), update: vi.fn(), remove: vi.fn() } }));

const dietDocument = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/services/dietDocument', async (original) => ({
  ...(await original<typeof import('@/services/dietDocument')>()),
  dietDocumentApi: { get: dietDocument.get, upload: vi.fn(), remove: vi.fn(), view: vi.fn() },
}));

const patientHandoff = vi.hoisted(() => ({ me: vi.fn(), forPatient: vi.fn() }));
vi.mock('@/services/patientHandoff', () => ({ patientHandoffApi: { me: patientHandoff.me, forPatient: patientHandoff.forPatient } }));

describe('página de anamnese do paciente', () => {
  beforeEach(() => {
    anamnese.me.mockReset();
    supplements.list.mockReset().mockResolvedValue([]);
    dietDocument.get.mockReset().mockRejectedValue(new ApiError('não encontrado', 404));
    patientHandoff.me.mockReset();
    patientData.plans = [];
    patientData.loading = false;
    auth.user = { id: 10, name: 'Paciente' };
  });
  afterEach(cleanup);

  it('mostra o botão de baixar resumo no topo da página, não no final', async () => {
    render(<PatientAnamnese />);
    await waitFor(() => expect(supplements.list).toHaveBeenCalled());

    const button = screen.getByRole('button', { name: /Baixar resumo para o médico/ });
    const dietHeading = screen.getByRole('heading', { name: 'Dieta em PDF' });
    // The action sits before the rest of the page's cards, not appended
    // after every other card on the page.
    expect(button.compareDocumentPosition(dietHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('mostra o editor de autoatendimento quando não há profissional vinculado', async () => {
    render(<PatientAnamnese />);
    expect(await screen.findByText('Conte um pouco sobre sua saúde')).toBeTruthy();
  });

  it('mostra a anamnese somente leitura quando há um profissional ativo', async () => {
    patientData.plans = [{ origin: 'PROFESSIONAL', active: true }];
    anamnese.me.mockResolvedValue({ info: 'Histórico registrado pelo profissional.' });
    render(<PatientAnamnese />);
    expect(await screen.findByText('Somente leitura', { exact: false })).toBeTruthy();
  });

  it('mostra um skeleton em vez de piscar o editor errado enquanto os planos carregam', () => {
    patientData.loading = true;
    render(<PatientAnamnese />);
    expect(screen.getByLabelText('Carregando anamnese')).toBeTruthy();
    expect(screen.queryByText('Conte um pouco sobre sua saúde')).toBeNull();
  });
});
