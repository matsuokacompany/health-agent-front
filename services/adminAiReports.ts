import { ApiError, refreshCsrfToken } from '@/infrastructure/http/ApiClient';
import { api } from './api';

export type CooldownRelease = { patient_id: number; report_id: number; modo: 'avaliacao_clinica'; released_by_user_id: number; previous_next_generation_at: string | null; released_at: string };

function errorDetail(payload: unknown) {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return '';
  const value = payload as Record<string, unknown>;
  const detail = value.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && typeof (detail as Record<string, unknown>).message === 'string') return String((detail as Record<string, unknown>).message);
  return typeof value.message === 'string' ? value.message : '';
}

export function cooldownReleaseErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Não foi possível liberar o relatório. Tente novamente.';
  const detail = errorDetail(error.payload);
  if (error.status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (error.status === 403) return 'Apenas um super administrador pode liberar este relatório.';
  if (error.status === 404 && detail.includes('Patient not found')) return 'Paciente não encontrado.';
  if (error.status === 404 && detail.includes('Completed AI report not found for this patient and mode')) return 'Não existe um relatório concluído de Apoio à avaliação clínica para liberar.';
  if (error.status === 409 && detail.includes('AI report already in progress')) return 'Já existe um relatório em geração para este paciente.';
  if (error.status === 409 && detail.includes('AI report cooldown is not active')) return 'O relatório já está liberado ou o período de espera já terminou.';
  return 'Não foi possível liberar o relatório. Tente novamente.';
}

export const adminAiReportsApi = {
  async releaseClinicalCooldown(patientId: number) {
    const csrfToken = await refreshCsrfToken();
    return api<CooldownRelease>(`/api/admin/patients/${patientId}/ai-reports/release-cooldown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ modo: 'avaliacao_clinica' }),
    });
  },
};
