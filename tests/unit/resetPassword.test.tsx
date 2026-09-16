import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordPage from '@/app/(auth)/reset-password/page';
import { ApiError } from '@/infrastructure/http/ApiClient';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const { exchangePasswordRecoveryMock, updatePasswordMock } = vi.hoisted(() => ({
  exchangePasswordRecoveryMock: vi.fn(),
  updatePasswordMock: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  exchangePasswordRecovery: exchangePasswordRecoveryMock,
  updatePassword: updatePasswordMock,
}));

function setLocation(pathname: string, search: string, hash: string) {
  window.history.replaceState(null, '', `${pathname}${search}${hash}`);
}

describe('tela de redefinição de senha', () => {
  beforeEach(() => {
    exchangePasswordRecoveryMock.mockReset().mockResolvedValue(undefined);
    updatePasswordMock.mockReset();
  });
  afterEach(cleanup);

  it('troca os tokens do fluxo implícito (#access_token) pela sessão e libera o formulário', async () => {
    // Este projeto Supabase emite links de recuperação no fluxo implícito
    // (#access_token=...&refresh_token=...), não no fluxo PKCE (?code=...) --
    // confirmado com um link real. A página precisa reconhecer esse formato
    // em vez de travar com "link incompatível".
    setLocation('/reset-password', '', '#access_token=abc123&refresh_token=def456&expires_in=3600&type=recovery');

    render(<ResetPasswordPage />);

    await waitFor(() => expect(exchangePasswordRecoveryMock).toHaveBeenCalledWith({ access_token: 'abc123', refresh_token: 'def456', expires_in: 3600 }));
    await waitFor(() => expect((screen.getByLabelText('Nova senha') as HTMLInputElement).disabled).toBe(false));
    expect(screen.queryByText(/incompatível/i)).toBeNull();
  });

  it('troca o código PKCE (?code=) pela sessão quando presente', async () => {
    setLocation('/reset-password', '?code=some-pkce-code', '');

    render(<ResetPasswordPage />);

    await waitFor(() => expect(exchangePasswordRecoveryMock).toHaveBeenCalledWith({ code: 'some-pkce-code' }));
    await waitFor(() => expect((screen.getByLabelText('Nova senha') as HTMLInputElement).disabled).toBe(false));
  });

  it('mostra erro amigável quando a troca falha (ex.: link expirado)', async () => {
    exchangePasswordRecoveryMock.mockRejectedValue(new ApiError('Invalid or expired recovery code', 401));
    setLocation('/reset-password', '?code=expired-code', '');

    render(<ResetPasswordPage />);

    await waitFor(() => expect(screen.getByText('Invalid or expired recovery code')).toBeTruthy());
    expect((screen.getByLabelText('Nova senha') as HTMLInputElement).disabled).toBe(true);
  });

  it('mantém o formulário bloqueado quando o próprio Supabase nega o link (#error=access_denied)', async () => {
    // Regressão: o Supabase pode redirecionar de volta com um link já usado
    // ou expirado como #error=access_denied&error_code=otp_expired&... em vez
    // de tokens ou um código. Sem tokens não há sessão para trocar, então o
    // formulário não pode ser liberado -- antes disso, o efeito caía para
    // setReady(true) mesmo neste caso, e o envio subsequente do formulário
    // retornava 401 do backend por falta de sessão.
    setLocation('/reset-password', '', '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');

    render(<ResetPasswordPage />);

    await waitFor(() => expect(screen.getByText('Email link is invalid or has expired')).toBeTruthy());
    expect(exchangePasswordRecoveryMock).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Nova senha') as HTMLInputElement).disabled).toBe(true);
  });
});
