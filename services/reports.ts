import type { GeneratedReport, InsightClinicalResponse, InsightPreventiveResponse, ReportPeriod } from '@/lib/types';
import { api } from './api';
export const reportsApi = { generate: (userId: number, periodo: ReportPeriod) => api<GeneratedReport>(`/api/reports/${userId}?periodo=${periodo}`) };
export const insightsApi = {
  preventive: (relatorio_texto: string) => api<InsightPreventiveResponse>('/api/insights/preventivo', { method: 'POST', body: JSON.stringify({ relatorio_texto }) }),
  clinical: (relatorio_texto: string) => api<InsightClinicalResponse>('/api/insights/avaliacao-clinica', { method: 'POST', body: JSON.stringify({ relatorio_texto }) }),
};
export const getReports = (_user: unknown, patientId: number, periodo: ReportPeriod = 'semanal') => reportsApi.generate(patientId, periodo);

export const generatePreventiveInsight = (_user: unknown, clinicalSummary: string) => insightsApi.preventive(clinicalSummary);
export const generateAiReport = generatePreventiveInsight;
export const createReport = (_user?: unknown, _report?: unknown) => { throw new Error('POST /api/daily-reports/ não está disponível na lista de endpoints existente.'); };
