import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PatientDashboard from '@/app/(patient)/patient/dashboard/page';

const notifications = vi.hoisted(() => ({ list: vi.fn(), markAllRead: vi.fn(), markRead: vi.fn() }));
vi.mock('@/services/notifications', () => ({ notificationsApi: notifications }));

const plan = { id: 1, title: 'Plano', active: true, start_date: '2026-08-01', end_date: null };
let mockReports: Array<Record<string, unknown>> = [];
vi.mock('@/components/patient/PatientDataProvider', () => ({
  usePatientData: () => ({ reports: mockReports, plans: [plan], loading: false, refresh: vi.fn() }),
}));

describe('status de monitoramento no dashboard do paciente', () => {
  beforeEach(() => {
    notifications.list.mockReset();
    notifications.list.mockResolvedValue({ items: [], unread_count: 0 });
    mockReports = [];
  });
  afterEach(cleanup);

  it('mostra o sinal de alerta mais recente dentro dos últimos 30 dias', async () => {
    mockReports = [
      { id: 1, report_date: '2026-08-20', completed: true, red_flag_category: 'dor_abdominal' },
      { id: 2, report_date: '2026-09-05', completed: true, red_flag_category: 'cardiorrespiratorio' },
    ];

    render(<PatientDashboard />);

    expect(await screen.findByText('🔴 Sinal de alerta identificado')).toBeTruthy();
    expect(screen.getByText(/Sinais cardiorrespiratórios/)).toBeTruthy();
  });

  it('mostra status tranquilo quando não há sinais de alerta recentes', async () => {
    mockReports = [{ id: 1, report_date: '2026-09-05', completed: true, had_symptoms: false }];

    render(<PatientDashboard />);

    expect(await screen.findByText('🟢 Sem sinais de alerta')).toBeTruthy();
  });

  it('ignora sinais de alerta fora da janela de 30 dias', async () => {
    mockReports = [{ id: 1, report_date: '2026-01-01', completed: true, red_flag_category: 'febre' }];

    render(<PatientDashboard />);

    expect(await screen.findByText('🟢 Sem sinais de alerta')).toBeTruthy();
  });

  it('mostra o padrão laranja quando há uma notificação SYMPTOM_CLUSTER_ALERT recente e nenhum sinal vermelho', async () => {
    mockReports = [{ id: 1, report_date: '2026-09-05', completed: true, had_symptoms: false }];
    notifications.list.mockResolvedValue({
      items: [
        {
          id: 10,
          kind: 'SYMPTOM_CLUSTER_ALERT',
          message: 'Ao longo dos últimos check-ins você relatou uma combinação de sinais...',
          created_at: '2026-09-05T10:00:00Z',
        },
      ],
      unread_count: 1,
    });

    render(<PatientDashboard />);

    // The same unread notification also renders inside NoticesCard's own
    // list, so the message text isn't unique on the page -- the heading
    // alone is enough to confirm the status card picked it up.
    expect(await screen.findByText('🟠 Padrão de sinais em observação')).toBeTruthy();
  });

  it('prioriza o sinal vermelho sobre uma notificação laranja no mesmo período', async () => {
    mockReports = [{ id: 1, report_date: '2026-09-05', completed: true, red_flag_category: 'cardiorrespiratorio' }];
    notifications.list.mockResolvedValue({
      items: [{ id: 10, kind: 'SYMPTOM_CLUSTER_ALERT', message: 'combinação de sinais', created_at: '2026-09-05T10:00:00Z' }],
      unread_count: 1,
    });

    render(<PatientDashboard />);

    expect(await screen.findByText('🔴 Sinal de alerta identificado')).toBeTruthy();
    expect(screen.queryByText('🟠 Padrão de sinais em observação')).toBeNull();
  });

  it('ignora notificação laranja fora da janela de 21 dias', async () => {
    mockReports = [{ id: 1, report_date: '2026-09-05', completed: true, had_symptoms: false }];
    notifications.list.mockResolvedValue({
      items: [{ id: 10, kind: 'SYMPTOM_CLUSTER_ALERT', message: 'combinação de sinais', created_at: '2026-07-01T10:00:00Z' }],
      unread_count: 1,
    });

    render(<PatientDashboard />);

    expect(await screen.findByText('🟢 Sem sinais de alerta')).toBeTruthy();
  });
});
