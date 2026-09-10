import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PatientDashboard from '@/app/(patient)/patient/dashboard/page';

const notifications = vi.hoisted(() => ({ list: vi.fn(), markAllRead: vi.fn(), markRead: vi.fn() }));
vi.mock('@/services/notifications', () => ({ notificationsApi: notifications }));

const plan = { id: 1, title: 'Plano', active: true, start_date: '2026-08-01', end_date: null };
vi.mock('@/components/patient/PatientDataProvider', () => ({
  usePatientData: () => ({ reports: [], plans: [plan], loading: false, refresh: vi.fn() }),
}));

describe('avisos no dashboard do paciente', () => {
  beforeEach(() => { notifications.list.mockReset(); notifications.markAllRead.mockReset(); });
  afterEach(cleanup);

  it('mostra os avisos não lidos e permite marcar tudo como lido', async () => {
    notifications.list.mockResolvedValue({
      items: [
        { id: 1, kind: 'PATIENT_INACTIVE', message: 'Você não faz check-in há 3 dias.', created_at: '2026-09-09T12:00:00Z', read_at: null },
        { id: 2, kind: 'SYMPTOM_PATTERN_ALERT', message: 'Dor de cabeça relatada 3 vezes esta semana.', created_at: '2026-09-08T12:00:00Z', read_at: null },
      ],
      unread_count: 2,
    });
    notifications.markAllRead.mockResolvedValue({ items: [], unread_count: 0 });

    render(<PatientDashboard />);

    expect(await screen.findByText('Você não faz check-in há 3 dias.')).toBeTruthy();
    expect(screen.getByText('Dor de cabeça relatada 3 vezes esta semana.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar tudo como lido' }));

    await waitFor(() => expect(notifications.markAllRead).toHaveBeenCalled());
    expect(screen.queryByText('Você não faz check-in há 3 dias.')).toBeNull();
  });

  it('não mostra o card de avisos quando não há avisos não lidos', async () => {
    notifications.list.mockResolvedValue({
      items: [{ id: 3, kind: 'CHECKIN_PENDING', message: 'Já lido', created_at: '2026-09-01T12:00:00Z', read_at: '2026-09-01T13:00:00Z' }],
      unread_count: 0,
    });

    render(<PatientDashboard />);

    await waitFor(() => expect(notifications.list).toHaveBeenCalled());
    expect(screen.queryByText('Avisos')).toBeNull();
  });
});
