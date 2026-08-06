import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { UnauthorizedError } from '@/infrastructure/http/ApiClient';

const { getCurrentUserMock } = vi.hoisted(() => ({ getCurrentUserMock: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  clearLegacySupabaseSession: vi.fn(),
  getCurrentUser: getCurrentUserMock,
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
});
