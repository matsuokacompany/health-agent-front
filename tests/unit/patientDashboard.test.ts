import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock('@/services/api', () => ({ api: apiMock }));

import { patientDashboardApi } from '@/services/patientDashboard';

describe('patientDashboardApi', () => {
  beforeEach(() => {
    apiMock.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('normalizes object anamnesis summaries to renderable preview text', async () => {
    apiMock.mockResolvedValueOnce({
      anamnesis_summary: {
        has_anamnesis: true,
        conditions_count: 2,
        preview: 'Paciente relata acompanhamento clínico regular.',
      },
    });

    const overview = await patientDashboardApi.getOverview();

    expect(apiMock).toHaveBeenLastCalledWith('/patient/dashboard');
    expect(overview.anamnesisSummary).toBe('Paciente relata acompanhamento clínico regular.');
  });

  it('falls back to a condition count message when no anamnesis preview is provided', async () => {
    apiMock.mockResolvedValueOnce({
      anamnesisSummary: {
        hasAnamnesis: true,
        conditionsCount: 1,
      },
    });

    const overview = await patientDashboardApi.getOverview();

    expect(overview.anamnesisSummary).toBe('1 condição registrada na anamnese.');
  });

  it('requests the monitoring calendar without duplicating the API prefix', async () => {
    apiMock.mockResolvedValueOnce({ year: 2026, month: 8, days: [] });

    await patientDashboardApi.getCalendar(2026, 8);

    expect(apiMock).toHaveBeenLastCalledWith('/patient/dashboard/calendar?year=2026&month=8');
  });

  it('builds the calendar from daily reports when the dedicated route is unavailable', async () => {
    apiMock
      .mockRejectedValueOnce(new ApiError('Not found', 404))
      .mockResolvedValueOnce([{ id: 17, report_date: '2026-08-03', status: 'COMPLETED', completed: true, had_symptoms: false }]);

    const calendar = await patientDashboardApi.getCalendar(2026, 8);

    expect(apiMock).toHaveBeenNthCalledWith(1, '/patient/dashboard/calendar?year=2026&month=8');
    expect(apiMock).toHaveBeenNthCalledWith(2, '/api/daily-reports/?month=2026-08');
    expect(calendar.days).toHaveLength(31);
    expect(calendar.days[2]).toMatchObject({ date: '2026-08-03', has_checkin: true, completed: true, checkins: [{ id: 17 }] });
  });

  it('uses the aggregate patient dashboard when the overview route is unavailable', async () => {
    apiMock
      .mockRejectedValueOnce(new ApiError('Not found', 404))
      .mockResolvedValueOnce({ monitoring: { title: 'Acompanhamento', active: true, start_date: '2026-08-01' } });

    const overview = await patientDashboardApi.getOverview();

    expect(apiMock).toHaveBeenNthCalledWith(1, '/patient/dashboard');
    expect(apiMock).toHaveBeenNthCalledWith(2, '/dashboard/patient');
    expect(overview.activePlan).toMatchObject({ name: 'Acompanhamento', active: true, starts_at: '2026-08-01' });
  });

  it('normalizes the aggregated patient dashboard response', async () => {
    apiMock.mockResolvedValueOnce({
      has_active_monitoring: true,
      goal: 'Controle da ansiedade',
      status: 'active',
      start_date: '2026-06-05',
      end_date: '2026-09-05',
      progress: 42.3,
      days_elapsed: 28,
      days_total: 60,
      responses: { answered: 25, expected: 30, rate: 83.4 },
      symptoms: { with_symptoms: 7, without_symptoms: 18 },
      timeline: [{ date: '2026-07-01', status: 'without_symptoms' }],
      last_response: { date: '2026-07-01', time: '08:10', summary: 'Sem sintomas hoje.' },
      next_prompt: { scheduled_at: '2026-07-03T08:00:00Z' },
    });

    const dashboard = await patientDashboardApi.getPatientDashboard();

    expect(apiMock).toHaveBeenLastCalledWith('/dashboard/patient');
    expect(dashboard.goal).toBe('Controle da ansiedade');
    expect(dashboard.progress).toBe(42);
    expect(dashboard.responses.rate).toBe(83);
    expect(dashboard.symptoms.total).toBe(25);
    expect(dashboard.timeline).toHaveLength(1);
  });

  it('uses plan fields, derives followed days from dates, and limits timeline to 7 days', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-03T12:00:00Z'));
    apiMock.mockResolvedValueOnce({
      has_active_monitoring: true,
      plan_name: 'Plano pós-operatório',
      status: 'active',
      starts_at: '2026-06-30',
      ends_at: '2026-07-10',
      timeline: Array.from({ length: 10 }, (_, index) => ({
        date: `2026-07-${String(index + 1).padStart(2, '0')}`,
        status: 'no_response',
      })),
    });

    const dashboard = await patientDashboardApi.getPatientDashboard();

    expect(dashboard.goal).toBe('Plano pós-operatório');
    expect(dashboard.startDate).toBe('2026-06-30');
    expect(dashboard.endDate).toBe('2026-07-10');
    expect(dashboard.daysTotal).toBe(11);
    expect(dashboard.daysElapsed).toBe(4);
    expect(dashboard.timeline).toHaveLength(7);
    expect(dashboard.timeline[0].date).toBe('2026-07-04');
  });

  it('normalizes nested active plan details when aggregate fields are missing', async () => {
    apiMock.mockResolvedValueOnce({
      active_plan: {
        name: 'Plano nutricional',
        status: 'active',
        starts_at: '2026-07-01',
        ends_at: '2026-07-07',
      },
    });

    const dashboard = await patientDashboardApi.getPatientDashboard();

    expect(dashboard.hasActiveMonitoring).toBe(true);
    expect(dashboard.goal).toBe('Plano nutricional');
    expect(dashboard.status).toBe('active');
    expect(dashboard.startDate).toBe('2026-07-01');
    expect(dashboard.endDate).toBe('2026-07-07');
    expect(dashboard.daysTotal).toBe(7);
  });

});
