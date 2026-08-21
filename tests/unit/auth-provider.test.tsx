import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { UnauthorizedError } from '@/infrastructure/http/ApiClient';

const { getCurrentUserMock, refreshSessionMock, signInMock, signOutMock } = vi.hoisted(() => ({ getCurrentUserMock: vi.fn(), refreshSessionMock: vi.fn(), signInMock: vi.fn(), signOutMock: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  clearLegacySupabaseSession: vi.fn(),
  getCurrentUser: getCurrentUserMock,
  refreshSession: refreshSessionMock,
  signInWithPassword: signInMock,
  signOut: signOutMock,
}));

function AuthStatus() {
  const { error, isAuthenticated, loading, signIn, signOut } = useAuth();
  return <div><span>{loading ? 'Carregando' : error ?? (isAuthenticated ? 'Autenticado' : 'Sem aviso')}</span><button onClick={() => void signIn('ana@example.com', 'senha')}>Entrar</button><button onClick={() => void signOut()}>Sair</button></div>;
}

describe('AuthProvider session restoration', () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); vi.useRealTimers(); });

  it('treats an absent or expired session as a normal signed-out state', async () => {
    getCurrentUserMock.mockRejectedValueOnce(new UnauthorizedError());

    render(<AuthProvider><AuthStatus /></AuthProvider>);

    await waitFor(() => expect(screen.getByText('Sem aviso')).toBeTruthy());
    expect(screen.queryByText(/sessão expirou/i)).toBeNull();
  });

  it('keeps unexpected restoration failures visible', async () => {
    getCurrentUserMock.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<AuthProvider><AuthStatus /></AuthProvider>);

    await waitFor(() => expect(screen.getByText('Não foi possível conectar ao servidor.')).toBeTruthy());
  });

  it('renews an authenticated session periodically while the page is visible', async () => {
    vi.useFakeTimers();
    refreshSessionMock.mockResolvedValue(undefined);
    getCurrentUserMock.mockResolvedValueOnce({ id: '1', email: 'ana@example.com', roles: ['patient'] });

    render(<AuthProvider><AuthStatus /></AuthProvider>);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10 * 60 * 1000); });

    expect(refreshSessionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Autenticado')).toBeTruthy();
  });

  it('keeps the authenticated user after login', async () => {
    getCurrentUserMock.mockRejectedValueOnce(new UnauthorizedError());
    signInMock.mockResolvedValueOnce({ id: '1', email: 'ana@example.com', roles: ['patient'] });
    render(<AuthProvider><AuthStatus /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('Sem aviso')).toBeTruthy());

    screen.getByRole('button', { name: 'Entrar' }).click();

    await waitFor(() => expect(screen.getByText('Autenticado')).toBeTruthy());
    expect(signInMock).toHaveBeenCalledWith('ana@example.com', 'senha');
  });

  it('clears the local user immediately when logout starts', async () => {
    let finishLogout!: () => void;
    signOutMock.mockReturnValueOnce(new Promise<void>(resolve => { finishLogout = resolve; }));
    getCurrentUserMock.mockResolvedValueOnce({ id: '1', email: 'ana@example.com', roles: ['patient'] });
    render(<AuthProvider><AuthStatus /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('Autenticado')).toBeTruthy());

    screen.getByRole('button', { name: 'Sair' }).click();

    await waitFor(() => expect(screen.getByText('Sem aviso')).toBeTruthy());
    finishLogout();
  });

  it('does not restore the user when a pending /me response arrives after logout', async () => {
    let finishBootstrap!: (user: { id: string; email: string; roles: ['patient'] }) => void;
    getCurrentUserMock.mockReturnValueOnce(new Promise(resolve => { finishBootstrap = resolve; }));
    signOutMock.mockResolvedValueOnce(undefined);
    render(<AuthProvider><AuthStatus /></AuthProvider>);

    screen.getByRole('button', { name: 'Sair' }).click();
    finishBootstrap({ id: '1', email: 'ana@example.com', roles: ['patient'] });

    await waitFor(() => expect(screen.getByText('Sem aviso')).toBeTruthy());
    expect(screen.queryByText('Autenticado')).toBeNull();
  });
});
