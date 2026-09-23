import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PatientDashboard from '@/app/(patient)/patient/dashboard/page';

const notifications = vi.hoisted(() => ({ list: vi.fn(), markAllRead: vi.fn(), markRead: vi.fn() }));
vi.mock('@/services/notifications', () => ({ notificationsApi: notifications }));

const selfMonitoring = vi.hoisted(() => ({ getEvolutionReport: vi.fn(), getInsight: vi.fn(), listInsights: vi.fn(), createPlan: vi.fn() }));
vi.mock('@/services/selfMonitoring', () => ({ selfMonitoringApi: selfMonitoring }));

const plan = { id: 1, title: 'Plano', active: true, start_date: '2026-08-01', end_date: null };
vi.mock('@/components/patient/PatientDataProvider', () => ({
  usePatientData: () => ({ reports: [], plans: [plan], loading: false, refresh: vi.fn() }),
}));

const baseReport = {
  patient_id: 1,
  start_date: '2025-09-23',
  end_date: '2026-09-23',
  period_days: 365,
  aggregation: 'weekly' as const,
  minimum_completed_checkins: 10,
  sufficient_data: true,
  metrics: {
    total_checkins: 30,
    completed_checkins: 28,
    pending_checkins: 2,
    checkins_with_symptoms: 5,
    checkins_without_symptoms: 23,
    days_with_checkins: 28,
    adherence_percentage: 93.3,
    symptom_rate_percentage: 17.9,
    calendar_coverage_percentage: 93.3,
  },
  symptom_trend: 'stable' as const,
  longest_gap_days: 2,
  symptoms: [{ description: 'Dor de cabeça', occurrences: 3, first_reported_at: '2026-08-15', last_reported_at: '2026-09-01' }],
  timeline: [],
  adherence: { diet_percentage: 80, exercise_percentage: null, medication_percentage: 100 },
  red_flag_events: [{ report_date: '2026-08-20', category_key: 'cardiorrespiratorio', category_label: 'Sinais cardiorrespiratórios', tier: 'absoluto' as const }],
  risk_factors: ['Doença cardíaca', 'Diabetes'],
};

describe('evolução no dashboard do paciente', () => {
  beforeEach(() => {
    notifications.list.mockReset().mockResolvedValue({ items: [], unread_count: 0 });
    selfMonitoring.getEvolutionReport.mockReset();
    selfMonitoring.getInsight.mockReset();
    selfMonitoring.listInsights.mockReset().mockResolvedValue({ items: [], pagination: { page: 1, per_page: 1, total: 0, total_pages: 0 } });
  });
  afterEach(cleanup);

  it('mostra sinais de alerta, adesão e fatores de risco do período selecionado (padrão: 1 ano)', async () => {
    selfMonitoring.getEvolutionReport.mockResolvedValue(baseReport);

    render(<PatientDashboard />);

    expect(await screen.findByText('Sinais cardiorrespiratórios')).toBeTruthy();
    expect(screen.getByText('Doença cardíaca')).toBeTruthy();
    expect(screen.getByText('Diabetes')).toBeTruthy();
    expect(screen.getByText('Adesão à dieta')).toBeTruthy();
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Último ano', pressed: true })).toBeTruthy();
    // Default period is a full year ending today, not a 30-day snapshot.
    const [{ start_date, end_date }] = selfMonitoring.getEvolutionReport.mock.calls[0];
    const spanDays = Math.round((new Date(`${end_date}T00:00:00`).getTime() - new Date(`${start_date}T00:00:00`).getTime()) / 86_400_000);
    expect(spanDays).toBe(364);
  });

  it('desabilita a geração do relatório e explica o cooldown quando já existe um relatório recente', async () => {
    selfMonitoring.getEvolutionReport.mockResolvedValue(baseReport);
    const nextGenerationAt = new Date(Date.now() + 5 * 86_400_000).toISOString();
    selfMonitoring.listInsights.mockResolvedValue({
      items: [{ id: 42, start_date: '2025-09-23', end_date: '2026-09-23', generated_at: '2026-09-23T12:00:00Z', next_generation_at: nextGenerationAt }],
      pagination: { page: 1, per_page: 1, total: 1, total_pages: 1 },
    });

    render(<PatientDashboard />);

    await waitFor(() => expect(selfMonitoring.getEvolutionReport).toHaveBeenCalled());
    expect(await screen.findByText('Faltam 5 dias para o próximo.', { exact: false })).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Disponível novamente em breve' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
