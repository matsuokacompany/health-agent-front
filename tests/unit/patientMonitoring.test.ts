import { afterEach, describe, expect, it, vi } from 'vitest';

const { getCalendarMock } = vi.hoisted(() => ({
  getCalendarMock: vi.fn(),
}));

vi.mock('@/services/patientDashboard', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/patientDashboard')>();
  return {
    ...original,
    patientDashboardApi: {
      ...original.patientDashboardApi,
      getCalendar: getCalendarMock,
    },
  };
});

import { loadPatientMonitoringMonth, resolvePatientRecordId } from '@/services/patientMonitoring';

describe('patient monitoring calendar loading', () => {
  afterEach(() => vi.clearAllMocks());

  it('loads the calendar without requesting the removed overview endpoint', async () => {
    const calendar = {
      year: 2026,
      month: 8,
      days: [{ date: '2026-08-01', has_checkin: true, completed: true, pending: false, has_symptoms: false, checkins: [{ id: 71, status: 'COMPLETED', completed: true, had_symptoms: false }] }],
    };
    getCalendarMock.mockResolvedValueOnce(calendar);
    await expect(loadPatientMonitoringMonth(2026, 8)).resolves.toEqual({ calendar, overview: null });
    expect(getCalendarMock).toHaveBeenCalledWith(2026, 8);
  });

  it('resolves the patient record from daily-report fields used by image uploads', () => {
    expect(resolvePatientRecordId(undefined, null, 0, 17)).toBe(17);
    expect(resolvePatientRecordId(undefined, '23')).toBe(23);
  });
});
