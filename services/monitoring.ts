import type { MonitoringPlan, ProfessionalProfile } from '@/lib/types';
import { api } from './api';
export const monitoringApi = {
  createProfessionalProfile: (payload: Partial<ProfessionalProfile>) => api<ProfessionalProfile>('/api/monitoring/professional-profiles', { method: 'POST', body: JSON.stringify(payload) }),
  updateProfessionalProfile: (id: number, payload: Partial<ProfessionalProfile>) => api<ProfessionalProfile>(`/api/monitoring/professional-profiles/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  createPlan: (payload: Partial<MonitoringPlan>) => api<MonitoringPlan>('/api/monitoring/plans', { method: 'POST', body: JSON.stringify(payload) }),
  listCurrentPatientPlans: () => api<MonitoringPlan[]>('/plans'),
  listPatientPlans: (patientId: number) => api<MonitoringPlan[]>(`/api/monitoring/patients/${patientId}/plans`),
  updatePlan: (id: number, payload: Partial<MonitoringPlan>) => api<MonitoringPlan>(`/api/monitoring/plans/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addProfessional: (planId: number, payload: { professional_profile_id: number }) => api(`/api/monitoring/plans/${planId}/professionals`, { method: 'POST', body: JSON.stringify(payload) }),
  updatePlanProfessional: (linkId: number, payload: Record<string, unknown>) => api(`/api/monitoring/plan-professionals/${linkId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
};
