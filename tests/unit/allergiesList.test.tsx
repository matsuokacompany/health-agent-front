import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { AllergiesList } from '@/components/patient/AllergiesList';

const api = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }));
vi.mock('@/services/allergies', async (original) => ({
  ...(await original<typeof import('@/services/allergies')>()),
  allergiesApi: { list: api.list, create: api.create, update: api.update, remove: api.remove },
}));

const seafood = { id: 1, allergen: 'Frutos do mar', severity: 'RISCO_DE_MORTE' as const, created_at: '2026-01-01T00:00:00Z' };
const pollen = { id: 2, allergen: 'Pólen', severity: 'LEVE' as const, created_at: '2026-01-01T00:00:00Z' };

describe('lista de alergias na anamnese', () => {
  beforeEach(() => {
    api.list.mockReset();
    api.create.mockReset();
    api.update.mockReset();
    api.remove.mockReset();
  });
  afterEach(() => cleanup());

  it('mostra mensagem vazia quando não há alergias cadastradas', async () => {
    api.list.mockResolvedValue([]);
    render(<AllergiesList />);
    expect(await screen.findByText('Nenhuma alergia cadastrada ainda.')).toBeTruthy();
  });

  it('lista alergias existentes com o rótulo de intensidade', async () => {
    api.list.mockResolvedValue([seafood, pollen]);
    const { container } = render(<AllergiesList />);
    await screen.findByText('Frutos do mar');
    expect(screen.getByText('Pólen')).toBeTruthy();
    const badgeTexts = Array.from(container.querySelectorAll('.badge')).map((badge) => badge.textContent);
    expect(badgeTexts).toContain('Risco de morte');
    expect(badgeTexts).toContain('Leve');
  });

  it('destaca com ícone apenas a alergia com risco de morte', async () => {
    api.list.mockResolvedValue([seafood, pollen]);
    const { container } = render(<AllergiesList />);
    await screen.findByText('Frutos do mar');
    const badges = container.querySelectorAll('.badge');
    const riscoBadge = Array.from(badges).find((badge) => badge.textContent?.includes('Risco de morte'));
    const leveBadge = Array.from(badges).find((badge) => badge.textContent?.includes('Leve'));
    expect(riscoBadge?.querySelector('svg')).toBeTruthy();
    expect(leveBadge?.querySelector('svg')).toBeFalsy();
  });

  it('adiciona uma nova alergia', async () => {
    api.list.mockResolvedValue([]);
    api.create.mockResolvedValue(pollen);
    render(<AllergiesList />);
    await screen.findByText('Nenhuma alergia cadastrada ainda.');
    fireEvent.change(screen.getByLabelText('Nome da alergia'), { target: { value: 'Pólen' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    await waitFor(() => expect(api.create).toHaveBeenCalledWith({ allergen: 'Pólen', severity: 'MODERADA' }));
    expect(await screen.findByText('Pólen')).toBeTruthy();
  });

  it('edita uma alergia existente', async () => {
    api.list.mockResolvedValue([pollen]);
    api.update.mockResolvedValue({ ...pollen, allergen: 'Pólen de gramíneas', severity: 'GRAVE' });
    render(<AllergiesList />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const nameInput = screen.getAllByLabelText('Nome da alergia')[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Pólen de gramíneas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith(2, { allergen: 'Pólen de gramíneas', severity: 'LEVE' }));
    expect(await screen.findByText('Pólen de gramíneas')).toBeTruthy();
  });

  it('remove uma alergia', async () => {
    api.list.mockResolvedValue([pollen]);
    api.remove.mockResolvedValue(undefined);
    render(<AllergiesList />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(2));
    expect(await screen.findByText('Nenhuma alergia cadastrada ainda.')).toBeTruthy();
  });

  it('mostra mensagem amigável quando a remoção falha e restaura o item', async () => {
    api.list.mockResolvedValue([pollen]);
    api.remove.mockRejectedValue(new ApiError('erro', 500));
    render(<AllergiesList />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(api.remove).toHaveBeenCalled());
    expect(await screen.findByText('Pólen')).toBeTruthy();
  });
});
