import { mockReports } from '@/lib/mockData';
import type { AiReport, DailyReport, User } from '@/lib/types';
import { canAccessPatient, sanitizeClinicalText } from '@/lib/rbac';
import { USE_MOCK, api } from './api';
import { audit } from './audit';

export async function getReports(user: User, patientId: string): Promise<DailyReport[]> {
  if (!canAccessPatient(user, patientId)) throw new Error('forbidden');

  audit(user.id, 'reports.read', `patient:${patientId}`);

  if (USE_MOCK) return mockReports.filter((report) => report.user_id === patientId);

  return api<DailyReport[]>(`/patients/${patientId}/reports`);
}

export async function createReport(user: User, report: Omit<DailyReport, 'painLevel' | 'riskFlags'> & Partial<Pick<DailyReport, 'painLevel' | 'riskFlags'>>): Promise<DailyReport> {
  if (!canAccessPatient(user, report.user_id)) throw new Error('forbidden');

  const safe: DailyReport = {
    ...report,
    painLevel: report.painLevel ?? 0,
    riskFlags: report.riskFlags ?? [],
    symptom_description: sanitizeClinicalText(report.symptom_description),
  };

  audit(user.id, 'reports.write', `report:${report.id}`);

  if (USE_MOCK) {
    mockReports.push(safe);
    return safe;
  }

  return api<DailyReport>('/reports', { method: 'POST', body: JSON.stringify(safe) });
}

export async function generateAiReport(user: User, patientId: string, clinicalSummary: string): Promise<AiReport> {
  if (!canAccessPatient(user, patientId)) throw new Error('forbidden');

  const prompt = sanitizeClinicalText(clinicalSummary);

  audit(user.id, 'ai.report.generate', `patient:${patientId}`);

  if (USE_MOCK) {
    return {
      risk: prompt.includes('Falta de ar') ? 'alto' : 'moderado',
      summary: `Resumo clínico anonimizado: ${prompt}`,
      recommendations: ['Revisar sinais de alerta', 'Manter acompanhamento conforme plano terapêutico'],
    };
  }

  return api<AiReport>(`/ai/report/${patientId}`, { method: 'POST', body: JSON.stringify({ prompt }) });
}
