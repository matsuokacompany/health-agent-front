import type { MonitoringPlan, ProfessionalProfile } from '@/lib/types';
import { api } from './api';

type PlanListResponse = MonitoringPlan[] | { items?: MonitoringPlan[]; data?: MonitoringPlan[]; results?: MonitoringPlan[]; plans?: MonitoringPlan[] };

function normalizePlanList(value: PlanListResponse): MonitoringPlan[] {
  if (Array.isArray(value)) return value;
  return value.items ?? value.data ?? value.results ?? value.plans ?? [];
}

async function firstPlanList(paths: string[]) {
  for (const path of paths) {
    try {
      const plans = normalizePlanList(await api<PlanListResponse>(path));
      if (plans.length || path === paths[paths.length - 1]) return plans;
    } catch (error) {
      if (path === paths[paths.length - 1]) throw error;
    }
  }
  return [];
}

export const monitoringApi = {
  createProfessionalProfile: (payload: Partial<ProfessionalProfile>) => api<ProfessionalProfile>('/api/monitoring/professional-profiles', { method: 'POST', body: JSON.stringify(payload) }),
  updateProfessionalProfile: (id: number, payload: Partial<ProfessionalProfile>) => api<ProfessionalProfile>(`/api/monitoring/professional-profiles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  createPlan: (payload: Partial<MonitoringPlan>) => api<MonitoringPlan>('/api/monitoring/plans', { method: 'POST', body: JSON.stringify(payload) }),
  listCurrentPatientPlans: (patientId?: number | string) => firstPlanList(['/plans', '/api/plans', ...(patientId ? [`/api/monitoring/patients/${patientId}/plans`] : [])]),
  listPatientPlans: (patientId: number) => api<MonitoringPlan[]>(`/api/monitoring/patients/${patientId}/plans`),
  updatePlan: (id: number, payload: Partial<MonitoringPlan>) => api<MonitoringPlan>(`/api/monitoring/plans/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addProfessional: (planId: number, payload: { professional_profile_id: number }) => api(`/api/monitoring/plans/${planId}/professionals`, { method: 'POST', body: JSON.stringify(payload) }),
  updatePlanProfessional: (linkId: number, payload: Record<string, unknown>) => api(`/api/monitoring/plan-professionals/${linkId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
};
