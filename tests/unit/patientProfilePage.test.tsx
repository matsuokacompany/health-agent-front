import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PatientProfile from '@/app/(patient)/patient/profile/page';
import type { User } from '@/lib/types';

vi.mock('@/lib/supabase', () => ({ updatePassword: vi.fn() }));
const usersApi = vi.hoisted(() => ({ update: vi.fn().mockResolvedValue({}) }));
vi.mock('@/services/users', () => ({ usersApi }));

const auth = vi.hoisted(() => ({ user: null as User | null }));
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: auth.user,
    refreshMe: vi.fn(),
    isPatient: (auth.user?.roles ?? []).includes('patient'),
    isProfessional: (auth.user?.roles ?? []).includes('professional'),
  }),
}));

const patientData = vi.hoisted(() => ({ plans: [] as Array<{ professionals?: Array<{ name?: string; specialty?: string | null }> }> }));
vi.mock('@/components/patient/PatientDataProvider', () => ({ usePatientData: () => patientData }));

const baseUser: User = {
  id: 10,
  name: 'Beatriz Matsuoka',
  email: 'betematsuoka@gmail.com',
  created_at: '2026-01-10T12:00:00Z',
  updated_at: '2026-01-10T12:00:00Z',
  roles: ['patient'],
};

describe('página de perfil do paciente', () => {
  beforeEach(() => { patientData.plans = []; usersApi.update.mockClear(); });
  afterEach(cleanup);

  it('mostra o profissional responsável quando o plano vem com um vínculo ativo', () => {
    auth.user = baseUser;
    patientData.plans = [{ professionals: [{ name: 'Dra. Ana', specialty: 'Nutrição' }] }];

    render(<PatientProfile />);

    expect(screen.getByDisplayValue('Dra. Ana')).toBeTruthy();
  });

  it('mostra a data de aceite explícito quando terms_accepted_at está preenchido', () => {
    auth.user = { ...baseUser, terms_accepted_at: '2026-02-01T10:00:00Z' };

    render(<PatientProfile />);

    expect(screen.getByDisplayValue('Aceito em 01/02/2026')).toBeTruthy();
  });

  it('cai para a data de criação da conta quando não há aceite explícito registrado', () => {
    auth.user = baseUser; // no terms_accepted_at, e.g. onboarded by a professional

    render(<PatientProfile />);

    expect(screen.getByDisplayValue('Não registrado formalmente — conta criada em 10/01/2026')).toBeTruthy();
  });

  it('salva apenas os campos de endereço/convênio preenchidos, sem enviar os vazios', async () => {
    auth.user = baseUser;

    render(<PatientProfile />);

    fireEvent.change(screen.getByLabelText('Endereço'), { target: { value: 'Rua das Flores, 123' } });
    fireEvent.change(screen.getByLabelText('Convênio'), { target: { value: 'Unimed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar endereço e convênio' }));

    await screen.findByText('Endereço e convênio atualizados.');

    expect(usersApi.update).toHaveBeenCalledWith(10, {
      street: 'Rua das Flores, 123',
      neighborhood: undefined,
      zip_code: undefined,
      health_plan: 'Unimed',
    });
  });

  it('não mostra o alternador de painel para um paciente comum (sem papel de profissional)', () => {
    auth.user = baseUser;

    render(<PatientProfile />);

    expect(screen.queryByText('Alternar modo de acesso')).toBeNull();
  });

  it('mostra o alternador de painel para uma conta com papel de paciente e de profissional', () => {
    auth.user = { ...baseUser, roles: ['patient', 'professional'] };

    render(<PatientProfile />);

    expect(screen.getByText('Alternar modo de acesso')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Painel do profissional/ }).getAttribute('href')).toBe('/professional');
  });
});
