import type { EvolutionReport, MonitoringPlan } from '@/lib/types';
import { api } from './api';

export const selfMonitoringApi = {
  createPlan: () => api<MonitoringPlan>('/api/self-monitoring/plan', { method: 'POST' }),
  getEvolutionReport: (params?: { start_date?: string; end_date?: string }) => {
    const search = new URLSearchParams();
    if (params?.start_date) search.set('start_date', params.start_date);
    if (params?.end_date) search.set('end_date', params.end_date);
    const query = search.toString();
    return api<EvolutionReport>(`/api/self-monitoring/evolution-report${query ? `?${query}` : ''}`);
  },
};
