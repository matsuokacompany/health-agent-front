import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { SelfAnamneseEditor } from '@/components/patient/SelfAnamneseEditor';

const api = vi.hoisted(() => ({ me: vi.fn(), create: vi.fn(), updateMe: vi.fn() }));
vi.mock('@/services/anamnese', () => ({
  anamnesesApi: { me: api.me, create: api.create, updateMe: api.updateMe },
}));

const existing = { id: 1, user_id: 10, info: 'Histórico pessoal', created_at: '2026-08-14T12:00:00Z', updated_at: '2026-08-14T13:00:00Z' };

describe('anamnese do paciente em automonitoramento', () => {
  beforeEach(() => { api.me.mockReset(); api.create.mockReset(); api.updateMe.mockReset(); });
  afterEach(cleanup);

  it('cria a anamnese com os fatores de risco marcados', async () => {
    api.me.mockRejectedValue(new ApiError('não encontrada', 404));
    api.create.mockResolvedValue({ ...existing, risk_asthma_or_copd: true });
    render(<SelfAnamneseEditor />);
    const field = await screen.findByLabelText('Conteúdo');
    fireEvent.change(field, { target: { value: 'Histórico pessoal' } });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Asma ou DPOC' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar anamnese' }));

    await waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({ info: 'Histórico pessoal', risk_asthma_or_copd: true }),
    );
    expect(await screen.findByText('Anamnese salva.')).toBeTruthy();
  });

  it('pré-marca os fatores de risco já salvos ao carregar', async () => {
    api.me.mockResolvedValue({ ...existing, risk_pregnancy_or_postpartum: true });
    render(<SelfAnamneseEditor />);
    await screen.findByLabelText('Conteúdo');

    const pregnancy = screen.getByRole('checkbox', { name: 'Gravidez ou pós-parto' }) as HTMLInputElement;
    expect(pregnancy.checked).toBe(true);
  });
});
