import { ApiError, ForbiddenError } from '@/infrastructure/http/ApiClient';
import { api } from './api';

export type AiReportMode = 'preventivo' | 'avaliacao_clinica';
export type AiReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type AiReportMetrics = { total_checkins: number; completed_checkins: number; pending_checkins: number; checkins_with_symptoms: number; checkins_without_symptoms: number; days_with_checkins: number; adherence_percentage: number; symptom_rate_percentage: number; calendar_coverage_percentage: number };
export type AiReportPreviewResponse = {
  modo: AiReportMode;
  eligibility: { can_generate: boolean; reason: string | null; next_generation_at: string | null; sufficient_data: boolean; completed_checkins: number; minimum_required: number; latest_report_id: number | null; last_generated_at: string | null };
  summary: { patient_id: number; start_date: string; end_date: string; period_days: number; aggregation: 'weekly' | 'monthly' | 'yearly'; minimum_completed_checkins: number; sufficient_data: boolean; metrics: AiReportMetrics; symptom_trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data'; longest_gap_days: number; symptoms: Array<{ description: string; occurrences: number; first_reported_at: string; last_reported_at: string }>; timeline: Array<{ start_date: string; end_date: string; metrics: AiReportMetrics }> };
  preview_token: string | null;
  preview_expires_at: string | null;
};
export type AiReport = { report_id: number; patient_id: number; requested_by_user_id: number; start_date: string; end_date: string; modo: AiReportMode; status: AiReportStatus; requested_at: string; processing_started_at: string | null; generated_at: string | null; next_generation_at: string | null; clinical_summary: string | null; ai: Record<string, unknown> | null; input_tokens: number | null; output_tokens: number | null; estimated_cost: number | null; actual_cost: number | null; model_name: string | null; failure_code: string | null };
export type AiReportHistoryItem = Pick<AiReport, 'report_id' | 'patient_id' | 'requested_by_user_id' | 'start_date' | 'end_date' | 'modo' | 'status' | 'requested_at' | 'generated_at' | 'next_generation_at' | 'estimated_cost' | 'actual_cost' | 'model_name' | 'failure_code'>;
export type AiReportHistoryResponse = { items: AiReportHistoryItem[]; pagination: { page: number; per_page: number; total: number; total_pages: number } };
export type AiReportPeriod = { start_date: string; end_date: string; modo: AiReportMode };

const DAY = 86_400_000;
export function localIsoDate(date: Date) { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 10); }
export function inclusiveDays(start: string, end: string) { return Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY) + 1; }
export function subtractInclusiveDays(end: Date, days: number) { const start = new Date(end); start.setDate(start.getDate() - days + 1); return localIsoDate(start); }
export function validateAiReportPeriod(start: string, end: string, today = localIsoDate(new Date())) {
  if (!start || !end) return 'Informe a data inicial e a data final.';
  if (start > end) return 'A data inicial não pode ser posterior à data final.';
  if (end > today) return 'A data final não pode estar no futuro.';
  if (inclusiveDays(start, end) < 30) return 'O período deve conter no mínimo 30 dias.';
  const maxEnd = new Date(`${start}T00:00:00`); maxEnd.setFullYear(maxEnd.getFullYear() + 5);
  if (new Date(`${end}T00:00:00`) >= maxEnd) return 'O período deve estar limitado a cinco anos-calendário.';
  return null;
}
export function shortcutPeriod(days: 30 | 90 | 180 | 365, today = new Date()) { return { start_date: subtractInclusiveDays(today, days), end_date: localIsoDate(today) }; }
export function fullMonitoringPeriod(monitoringStart?: string | null, today = new Date()) { const end = localIsoDate(today); const limit = new Date(today); limit.setFullYear(limit.getFullYear() - 5); limit.setDate(limit.getDate() + 1); return { start_date: monitoringStart && monitoringStart > localIsoDate(limit) ? monitoringStart.slice(0, 10) : localIsoDate(limit), end_date: end }; }

export type AiReportUserError = { title: string; message: string; action?: string; code?: string };
const errors: Record<string, AiReportUserError> = {
  PREVIEW_DATA_CHANGED: { title: 'Os dados foram atualizados', message: 'Os check-ins do paciente mudaram desde a última revisão. Atualize os dados antes de gerar.', action: 'Atualizar revisão' },
  REPORT_IN_PROGRESS: { title: 'Relatório em andamento', message: 'Já existe um relatório em geração para este paciente.', action: 'Ver histórico' },
  PATIENT_MONTHLY_LIMIT_REACHED: { title: 'Nova geração ainda indisponível', message: 'Consulte a data indicada para saber quando um novo relatório poderá ser gerado.', action: 'Ver último relatório' },
  INSUFFICIENT_DATA: { title: 'Dados insuficientes', message: 'O período selecionado não possui check-ins respondidos suficientes.', action: 'Alterar período' },
  REPORT_INPUT_TOO_LARGE: { title: 'Período muito extenso', message: 'O período possui dados demais para uma única análise. Selecione um intervalo menor.', action: 'Alterar período' },
  REPORT_COST_LIMIT_EXCEEDED: { title: 'Geração indisponível', message: 'Não foi possível gerar o relatório devido a um limite operacional.', action: 'Tentar mais tarde' },
  AI_GENERATION_FAILED: { title: 'Não foi possível concluir a análise', message: 'Ocorreu uma falha durante a geração. A tentativa não consumiu a disponibilidade do paciente.', action: 'Tentar novamente' },
  PREVIEW_TOKEN_EXPIRED: { title: 'A revisão expirou', message: 'Atualize os dados para continuar com segurança.', action: 'Atualizar revisão' },
  PREVIEW_TOKEN_MISMATCH: { title: 'A revisão expirou', message: 'Atualize os dados para continuar com segurança.', action: 'Atualizar revisão' },
};
export function eligibilityMessage(reason: string | null) { return reason ? errors[reason]?.message ?? 'A geração não está disponível neste momento.' : null; }
function errorCode(payload: unknown): string | null { if (!payload || typeof payload !== 'object') return null; const value = payload as Record<string, unknown>; const detail = value.detail; if (typeof value.code === 'string') return value.code; if (typeof detail === 'string') return detail; if (detail && typeof detail === 'object' && typeof (detail as Record<string, unknown>).code === 'string') return (detail as Record<string, unknown>).code as string; return null; }
export function aiReportUserError(error: unknown): AiReportUserError {
  if (error instanceof ForbiddenError) return { title: 'Acesso não autorizado', message: 'Você não possui acesso a este paciente.' };
  if (error instanceof ApiError) {
    const code = errorCode(error.payload);
    if (code && errors[code]) return { ...errors[code], code };
    if (error.status === 401) return { title: 'Sessão expirada', message: 'Sua sessão expirou. Entre novamente.' };
    if (error.status === 403) return { title: 'Acesso não autorizado', message: 'Você não possui acesso a este paciente.' };
    if (error.status === 502) return { ...errors.AI_GENERATION_FAILED, code: 'AI_GENERATION_FAILED' };
    if (error.status === 503) return { title: 'Serviço indisponível', message: 'A geração de relatórios está temporariamente indisponível.' };
    if (error.status === 404) return { title: 'Relatório não encontrado', message: 'Não foi possível localizar este relatório.' };
    return { title: 'Não foi possível concluir', message: 'Não foi possível concluir a operação. Tente novamente.' };
  }
  return { title: 'Falha de conexão', message: 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.' };
}
export function aiReportErrorMessage(error: unknown) { return aiReportUserError(error).message; }

function base(patientId: number | string) { return `/api/professional/patients/${patientId}/ai-reports`; }
export const aiReportsApi = {
  preview: (patientId: number | string, payload: AiReportPeriod) => api<AiReportPreviewResponse>(`${base(patientId)}/preview`, { method: 'POST', body: JSON.stringify(payload) }),
  generate: (patientId: number | string, payload: AiReportPeriod & { preview_token: string }) => api<AiReport>(base(patientId), { method: 'POST', body: JSON.stringify(payload) }),
  history: (patientId: number | string, page = 1, perPage = 20, status?: AiReportStatus | '') => api<AiReportHistoryResponse>(`${base(patientId)}?${new URLSearchParams({ page: String(page), per_page: String(perPage), ...(status ? { status } : {}) })}`),
  detail: (patientId: number | string, reportId: number) => api<AiReport>(`${base(patientId)}/${reportId}`),
};

/** @deprecated Fluxo semanal legado; mantido enquanto outros consumidores forem migrados. */
export const LEGACY_AI_REPORT_ENDPOINT = '/api/professional/patients/{patient_id}/ai-report';
