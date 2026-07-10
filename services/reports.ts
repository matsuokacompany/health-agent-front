import type { GeneratedReport, InsightClinicalResponse, InsightPreventiveResponse, ReportPeriod, User } from '@/lib/types';
import { assertCanAccessPatient } from '@/lib/rbac';
import { api } from './api';
export const reportsApi = { generate: (userId: number, periodo: ReportPeriod) => api<GeneratedReport>(`/api/reports/${userId}?periodo=${periodo}`) };
export const insightsApi = {
  preventive: (relatorio_texto: string) => api<InsightPreventiveResponse>('/api/insights/preventivo', { method: 'POST', body: JSON.stringify({ relatorio_texto }) }),
  clinical: (relatorio_texto: string) => api<InsightClinicalResponse>('/api/insights/avaliacao-clinica', { method: 'POST', body: JSON.stringify({ relatorio_texto }) }),
};
export const getReports = async (user: User, patientId: number, periodo: ReportPeriod = 'semanal') => {
  assertCanAccessPatient(user, patientId);
  return reportsApi.generate(patientId, periodo);
};

export const generatePreventiveInsight = (_user: unknown, clinicalSummary: string) => insightsApi.preventive(clinicalSummary);
export const generateAiReport = generatePreventiveInsight;
type CreateReportPayload = { user_id?: number | string; patient_id?: number | string; [key: string]: unknown };

export const createReport = async (user?: User, report?: CreateReportPayload) => {
  const patientId = report?.user_id ?? report?.patient_id;
  if (user && patientId !== undefined) assertCanAccessPatient(user, patientId);
  throw new Error('POST /api/daily-reports/ não está disponível na lista de endpoints existente.');
};
