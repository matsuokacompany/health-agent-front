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
});
