import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/api', () => ({ api: apiMock }));

import { dailyReportsApi } from '@/services/dailyReports';
import { monitoringApi } from '@/services/monitoring';
import { getMe } from '@/services/auth';
import { languageOptions, messages } from '@/lib/i18n';

describe('service API wrappers', () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it('builds daily report list filters safely', async () => {
    apiMock.mockResolvedValueOnce([]);

    await dailyReportsApi.list(7, { month: '2026-07' });

    expect(apiMock).toHaveBeenCalledWith('/api/daily-reports/?monitoring_plan_id=7&month=2026-07');
  });

  it('tries monitoring plan fallback paths until a plan list is found', async () => {
    apiMock.mockResolvedValueOnce([]).mockResolvedValueOnce({ items: [{ id: 1, patient_id: 2, status: 'active' }] });

    const plans = await monitoringApi.listCurrentPatientPlans(2);

    expect(plans).toHaveLength(1);
    expect(apiMock).toHaveBeenNthCalledWith(1, '/plans');
    expect(apiMock).toHaveBeenNthCalledWith(2, '/api/plans');
  });

  it('uses the authenticated user endpoint for getMe', async () => {
    apiMock.mockResolvedValueOnce({ id: 1, roles: ['patient'] });

    await getMe();

    expect(apiMock).toHaveBeenCalledWith('/api/auth/me');
  });

  it('exposes supported languages and translated navigation messages', () => {
    expect(languageOptions.map((option) => option.locale)).toEqual(['pt-BR', 'en', 'es']);
    expect(messages.en.nav.logout).toBe('Sign out');
    expect(messages['pt-BR'].nav.logout).toBe('Sair');
  });
});
