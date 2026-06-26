import type { DailyReport } from '@/lib/types';
import { api } from './api';
export const dailyReportsApi = {
  list: (monitoringPlanId?: number) => api<DailyReport[]>(`/api/daily-reports/${monitoringPlanId ? `?monitoring_plan_id=${monitoringPlanId}` : ''}`),
  get: (id: number) => api<DailyReport>(`/api/daily-reports/${id}`),
  update: (id: number, payload: Partial<DailyReport>) => api<DailyReport>(`/api/daily-reports/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id: number) => api<void>(`/api/daily-reports/${id}`, { method: 'DELETE' }),
};
