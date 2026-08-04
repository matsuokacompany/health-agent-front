import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCalendarMock, getOverviewMock } = vi.hoisted(() => ({
  getCalendarMock: vi.fn(),
  getOverviewMock: vi.fn(),
}));

vi.mock('@/services/patientDashboard', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/patientDashboard')>();
  return {
    ...original,
    patientDashboardApi: {
      ...original.patientDashboardApi,
      getCalendar: getCalendarMock,
      getOverview: getOverviewMock,
    },
  };
});

import { loadPatientMonitoringMonth } from '@/services/patientMonitoring';

describe('patient monitoring calendar loading', () => {
  afterEach(() => vi.clearAllMocks());

  it('keeps valid calendar data when the optional overview returns 404', async () => {
    const calendar = {
      year: 2026,
      month: 8,
      days: [{ date: '2026-08-01', has_checkin: true, completed: true, pending: false, has_symptoms: false, checkins: [{ id: 71, status: 'COMPLETED', completed: true, had_symptoms: false }] }],
    };
    getCalendarMock.mockResolvedValueOnce(calendar);
    getOverviewMock.mockRejectedValueOnce(new Error('404'));

    await expect(loadPatientMonitoringMonth(2026, 8)).resolves.toEqual({ calendar, overview: null });
    expect(getCalendarMock).toHaveBeenCalledWith(2026, 8);
  });
});
