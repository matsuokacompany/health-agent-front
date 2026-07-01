import type { DailyReport } from '@/lib/types';
import { api } from './api';
export const dailyReportsApi = {
  list: (monitoringPlanId?: number, filters?: { month?: string }) => {
    const params = new URLSearchParams();
    if (monitoringPlanId) params.set('monitoring_plan_id', String(monitoringPlanId));
    if (filters?.month) params.set('month', filters.month);
    const query = params.toString();
    return api<DailyReport[]>(`/api/daily-reports/${query ? `?${query}` : ''}`);
  },
  get: (id: number) => api<DailyReport>(`/api/daily-reports/${id}`),
  update: (id: number, payload: Partial<DailyReport>) => api<DailyReport>(`/api/daily-reports/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: number) => api<void>(`/api/daily-reports/${id}`, { method: 'DELETE' }),
};
