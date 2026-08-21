import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { PatientAnamneseEditor } from '@/components/professional/PatientAnamneseEditor';

const api = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock('@/services/professional', () => ({
  getPatientAnamnese: api.get,
  createPatientAnamnese: api.create,
  updatePatientAnamnese: api.update,
}));

const existing = { id: 1, user_id: 10, info: 'Histórico\nclínico', created_at: '2026-08-14T12:00:00Z', updated_at: '2026-08-14T13:00:00Z' };

describe('anamnese do profissional', () => {
  beforeEach(() => { api.get.mockReset(); api.create.mockReset(); api.update.mockReset(); });
  afterEach(cleanup);

  it('mantém o campo inteiro visível e usa skeletons enquanto carrega', () => { api.get.mockReturnValue(new Promise(() => {})); render(<PatientAnamneseEditor patientId="10" />); expect(screen.getByRole('textbox')).toBeTruthy(); expect(screen.getByRole('textbox').getAttribute('aria-busy')).toBe('true'); expect(screen.getByLabelText('Carregando anamnese')).toBeTruthy(); });

  it('carrega e atualiza uma anamnese existente com PUT', async () => {
    api.get.mockResolvedValue(existing);
    api.update.mockResolvedValue({ ...existing, info: 'Conteúdo atualizado' });
    render(<PatientAnamneseEditor patientId="10" />);
    const field = await screen.findByLabelText('Conteúdo clínico');
    expect((field as HTMLTextAreaElement).value).toBe('Histórico\nclínico');
    fireEvent.change(field, { target: { value: 'Conteúdo atualizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar anamnese' }));
    await waitFor(() => expect(api.update).toHaveBeenCalledWith('10', { info: 'Conteúdo atualizado' }));
    expect(await screen.findByText('Anamnese atualizada com sucesso.')).toBeTruthy();
  });

  it('trata GET 404 como ausência e cria a primeira anamnese com POST', async () => {
    api.get.mockResolvedValue(null);
    api.create.mockResolvedValue({ ...existing, info: 'Primeira anamnese' });
    render(<PatientAnamneseEditor patientId="10" />);
    const field = await screen.findByLabelText('Conteúdo clínico');
    expect(screen.getByText('Este paciente ainda não possui anamnese.')).toBeTruthy();
    fireEvent.change(field, { target: { value: ' Primeira anamnese ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar anamnese' }));
    await waitFor(() => expect(api.create).toHaveBeenCalledWith('10', { info: 'Primeira anamnese' }));
    expect(await screen.findByText('Anamnese cadastrada com sucesso.')).toBeTruthy();
  });

  it('mostra acesso negado no 403 sem liberar edição', async () => {
    api.get.mockRejectedValue(new ApiError('erro', 403));
    render(<PatientAnamneseEditor patientId="10" />);
    expect(await screen.findByText('Você não possui acesso à anamnese deste paciente.')).toBeTruthy();
    expect((screen.getByLabelText('Conteúdo clínico') as HTMLTextAreaElement).disabled).toBe(true);
  });

  it('no conflito 409 recarrega a existência e preserva o texto digitado', async () => {
    api.get.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    api.create.mockRejectedValue(new ApiError('conflito', 409));
    render(<PatientAnamneseEditor patientId="10" />);
    const field = await screen.findByLabelText('Conteúdo clínico');
    fireEvent.change(field, { target: { value: 'Meu rascunho' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar anamnese' }));
    expect(await screen.findByText(/já foi cadastrada/)).toBeTruthy();
    expect((field as HTMLTextAreaElement).value).toBe('Meu rascunho');
  });
});
