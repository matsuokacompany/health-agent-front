import type { AiReport, User } from '@/lib/types';
import { canAccessPatient, sanitizeClinicalText } from '@/lib/rbac';
import { USE_MOCK, apiClient } from './api';
import { audit } from './audit';

export async function generateAiReport(user: User, patientId: string, clinicalSummary: string): Promise<AiReport> {
  if (!canAccessPatient(user, patientId)) throw new Error('forbidden');
  const prompt = sanitizeClinicalText(clinicalSummary);
  audit(user.id, 'ai.report.generate', `patient:${patientId}`);
  if (USE_MOCK) return { risk: prompt.includes('Falta de ar') ? 'alto' : 'moderado', summary: `Resumo clínico anonimizado: ${prompt}`, recommendations: ['Revisar sinais de alerta', 'Manter acompanhamento conforme plano terapêutico'] };
  return apiClient.request<AiReport>(`/ai/report/${patientId}`, { method: 'POST', body: JSON.stringify({ prompt }) });
}
