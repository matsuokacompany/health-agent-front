import { afterEach, describe, expect, it, vi } from 'vitest';

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }));
vi.mock('@/services/api', () => ({ api: apiMock }));

import { dailyReportsApi } from '@/services/dailyReports';

describe('dailyReportsApi', () => {
  afterEach(() => apiMock.mockReset());

  it('gets, answers, and clears a calendar check-in by report id', async () => {
    apiMock.mockResolvedValue({ id: 42 });
    await dailyReportsApi.get(42);
    await dailyReportsApi.update(42, { had_symptoms: true, symptom_description: 'Dor de cabeça', suspected_cause: 'Pouco sono' });
    await dailyReportsApi.removeResponse(42);

    expect(apiMock).toHaveBeenNthCalledWith(1, '/api/daily-reports/42');
    expect(apiMock).toHaveBeenNthCalledWith(2, '/api/daily-reports/42', { method: 'PATCH', body: JSON.stringify({ had_symptoms: true, symptom_description: 'Dor de cabeça', suspected_cause: 'Pouco sono' }) });
    expect(apiMock).toHaveBeenNthCalledWith(3, '/api/daily-reports/42/response', { method: 'DELETE' });
  });
});
