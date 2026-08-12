import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { UnauthorizedError } from '@/infrastructure/http/ApiClient';

const { getCurrentUserMock, refreshSessionMock } = vi.hoisted(() => ({ getCurrentUserMock: vi.fn(), refreshSessionMock: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  clearLegacySupabaseSession: vi.fn(),
  getCurrentUser: getCurrentUserMock,
  refreshSession: refreshSessionMock,
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
}));

function AuthStatus() {
  const { error, loading } = useAuth();
  return <div>{loading ? 'Carregando' : error ?? 'Sem aviso'}</div>;
}

describe('AuthProvider session restoration', () => {
  afterEach(() => vi.clearAllMocks());

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
    vi.useRealTimers();
  });
});
