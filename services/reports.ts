
import { mockReports } from '@/lib/mockData';
import type { AiReport, DailyReport, User } from '@/lib/types';
import { canAccessPatient, sanitizeClinicalText } from '@/lib/rbac';
import { api } from './api';
import { audit } from './audit';

export async function getReports(user: User, patientId: number, periodo = 'semanal'): Promise<DailyReport[]> {
  if (!canAccessPatient(user, patientId)) throw new Error('forbidden');
  audit(user.id, 'reports.read', `patient:${patientId}`);
  return api<DailyReport[]>(`/api/reports/${patientId}?periodo=${encodeURIComponent(periodo)}`);
}

export async function createReport(user: User, report: Omit<DailyReport, 'painLevel' | 'riskFlags'> & Partial<Pick<DailyReport, 'painLevel' | 'riskFlags'>>): Promise<DailyReport> {
  if (!canAccessPatient(user, report.user_id)) throw new Error('forbidden');
  const safe: DailyReport = { ...report, painLevel: report.painLevel ?? 0, riskFlags: report.riskFlags ?? [], symptom_description: sanitizeClinicalText(report.symptom_description) };
  audit(user.id, 'daily-reports.write', `report:${report.id}`);
  return api<DailyReport>('/api/daily-reports/', { method: 'POST', body: JSON.stringify(safe) });
}

export async function generatePreventiveInsight(user: User, clinicalSummary: string): Promise<AiReport> {
  const prompt = sanitizeClinicalText(clinicalSummary);
  audit(user.id, 'insights.preventivo', `user:${user.id}`);
  return api<AiReport>('/api/insights/preventivo', { method: 'POST', body: JSON.stringify({ prompt }) });
}

export const generateAiReport = generatePreventiveInsight;
