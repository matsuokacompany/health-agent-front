import type { EvolutionReport, MonitoringPlan, SelfMonitoringInsight, SelfMonitoringInsightListResponse } from '@/lib/types';
import { api } from './api';

function periodQuery(params?: { start_date?: string; end_date?: string }) {
  const search = new URLSearchParams();
  if (params?.start_date) search.set('start_date', params.start_date);
  if (params?.end_date) search.set('end_date', params.end_date);
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const selfMonitoringApi = {
  createPlan: () => api<MonitoringPlan>('/api/self-monitoring/plan', { method: 'POST' }),
  getEvolutionReport: (params?: { start_date?: string; end_date?: string }) =>
    api<EvolutionReport>(`/api/self-monitoring/evolution-report${periodQuery(params)}`),
  getInsight: (params?: { start_date?: string; end_date?: string }) =>
    api<SelfMonitoringInsight>(`/api/self-monitoring/insight${periodQuery(params)}`),
  listInsights: (page = 1, perPage = 20) =>
    api<SelfMonitoringInsightListResponse>(`/api/self-monitoring/insights?${new URLSearchParams({ page: String(page), per_page: String(perPage) })}`),
  getInsightDetail: (id: number) => api<SelfMonitoringInsight>(`/api/self-monitoring/insights/${id}`),
};
