import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { SupportButton } from '@/components/support/SupportButton';

const { sendContact } = vi.hoisted(() => ({ sendContact: vi.fn() }));
vi.mock('@/services/support', async (original) => ({
  ...(await original<typeof import('@/services/support')>()),
  supportApi: { sendContact },
}));

describe('SupportButton', () => {
  beforeEach(() => { sendContact.mockReset().mockResolvedValue(undefined); });
  afterEach(cleanup);

  it('abre o modal, envia a mensagem com o assunto escolhido e confirma o envio', async () => {
    render(<SupportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Suporte' }));
    expect(screen.getByRole('dialog', { name: 'Falar com o suporte' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Assunto'), { target: { value: 'Sugestão' } });
    fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: 'Seria bom ter um modo escuro melhor.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    await waitFor(() => expect(sendContact).toHaveBeenCalledWith({ subject: 'Sugestão', message: 'Seria bom ter um modo escuro melhor.', attachment: null }));
    expect(await screen.findByText(/Mensagem enviada/)).toBeTruthy();
  });

  it('exige uma mensagem antes de enviar', () => {
    render(<SupportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Suporte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(screen.getByText('Escreva uma mensagem antes de enviar.')).toBeTruthy();
    expect(sendContact).not.toHaveBeenCalled();
  });

  it('rejeita um anexo que não seja JPEG, PNG ou WebP', () => {
    render(<SupportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Suporte' }));
    fireEvent.change(screen.getByLabelText(/Anexar uma imagem/), { target: { files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] } });
    expect(screen.getByText('Anexe uma imagem JPEG, PNG ou WebP.')).toBeTruthy();
  });

  it('mostra uma mensagem amigável quando o envio falha', async () => {
    sendContact.mockRejectedValue(new ApiError('Ocorreu um erro inesperado.', 502, { detail: 'SUPPORT_EMAIL_DELIVERY_FAILED' }));
    render(<SupportButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Suporte' }));
    fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: 'Não consigo enviar um check-in.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    expect(await screen.findByText('Não foi possível enviar sua mensagem agora. Tente novamente em instantes.')).toBeTruthy();
  });
});
