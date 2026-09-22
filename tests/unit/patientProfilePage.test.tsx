import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PatientProfile from '@/app/(patient)/patient/profile/page';
import type { User } from '@/lib/types';

vi.mock('@/lib/supabase', () => ({ updatePassword: vi.fn() }));
vi.mock('@/services/users', () => ({ usersApi: { update: vi.fn() } }));

const auth = vi.hoisted(() => ({ user: null as User | null }));
vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: auth.user, refreshMe: vi.fn() }) }));

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
  beforeEach(() => { patientData.plans = []; });
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
});
