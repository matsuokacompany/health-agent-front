import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { DietDocumentUpload } from '@/components/patient/DietDocumentUpload';

const api = vi.hoisted(() => ({ get: vi.fn(), upload: vi.fn(), remove: vi.fn(), view: vi.fn() }));
vi.mock('@/services/dietDocument', async (original) => ({
  ...(await original<typeof import('@/services/dietDocument')>()),
  dietDocumentApi: { get: api.get, upload: api.upload, remove: api.remove, view: api.view },
}));

const document_ = { id: 1, patient_id: 7, uploaded_by_user_id: 7, original_filename: 'plano.pdf', byte_size: 1000, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };

describe('upload do plano alimentar em PDF', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.upload.mockReset();
    api.remove.mockReset();
    api.view.mockReset();
    vi.stubGlobal('open', vi.fn());
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('mostra botão de envio quando não há documento', async () => {
    api.get.mockRejectedValue(new ApiError('não encontrado', 404));
    render(<DietDocumentUpload patientId={7} />);
    expect(await screen.findByRole('button', { name: 'Enviar plano alimentar (PDF)' })).toBeTruthy();
  });

  it('mostra o documento existente com ações de visualizar/substituir/remover', async () => {
    api.get.mockResolvedValue(document_);
    render(<DietDocumentUpload patientId={7} />);
    expect(await screen.findByText('plano.pdf')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Visualizar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Substituir' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remover' })).toBeTruthy();
  });

  it('envia um PDF selecionado e mostra sucesso', async () => {
    api.get.mockRejectedValue(new ApiError('não encontrado', 404));
    api.upload.mockResolvedValue(document_);
    render(<DietDocumentUpload patientId={7} />);
    await screen.findByRole('button', { name: 'Enviar plano alimentar (PDF)' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['%PDF-1.4'], 'dieta.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(api.upload).toHaveBeenCalledWith(7, file));
    expect(await screen.findByText('Plano alimentar salvo.')).toBeTruthy();
  });

  it('mostra mensagem amigável quando o upload é rejeitado', async () => {
    api.get.mockRejectedValue(new ApiError('não encontrado', 404));
    api.upload.mockRejectedValue(new ApiError('x', 415));
    render(<DietDocumentUpload patientId={7} />);
    await screen.findByRole('button', { name: 'Enviar plano alimentar (PDF)' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] } });
    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('remove o documento existente', async () => {
    api.get.mockResolvedValue(document_);
    api.remove.mockResolvedValue(undefined);
    render(<DietDocumentUpload patientId={7} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(7));
    expect(await screen.findByText('Plano alimentar removido.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enviar plano alimentar (PDF)' })).toBeTruthy();
  });

  it('abre a URL assinada ao visualizar', async () => {
    api.get.mockResolvedValue(document_);
    api.view.mockResolvedValue({ url: 'https://signed.test/plano.pdf', expires_in: 300 });
    render(<DietDocumentUpload patientId={7} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Visualizar' }));
    await waitFor(() => expect(window.open).toHaveBeenCalledWith('https://signed.test/plano.pdf', '_blank', 'noopener,noreferrer'));
  });
});
