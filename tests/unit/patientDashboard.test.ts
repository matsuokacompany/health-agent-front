import { describe, expect, it, vi } from 'vitest';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));

vi.mock('@/services/api', () => ({ api: apiMock }));

import { patientDashboardApi } from '@/services/patientDashboard';

describe('patientDashboardApi', () => {
  it('normalizes object anamnesis summaries to renderable preview text', async () => {
    apiMock.mockResolvedValueOnce({
      anamnesis_summary: {
        has_anamnesis: true,
        conditions_count: 2,
        preview: 'Paciente relata acompanhamento clínico regular.',
      },
    });

    const overview = await patientDashboardApi.getOverview();

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

});
