import { ApiError } from '@/infrastructure/http/ApiClient';
import { api } from './api';

export type ClinicalAttachmentSource = 'WHATSAPP' | 'PATIENT_PORTAL' | 'PROFESSIONAL_PORTAL';
export type ClinicalAttachmentStatus = 'AVAILABLE' | 'DELETED';
export interface ClinicalAttachment { id: number; patient_id: number; uploaded_by_user_id: number; daily_report_id: number | null; source: ClinicalAttachmentSource; content_type: string; byte_size: number; description: string | null; status: ClinicalAttachmentStatus; created_at: string }
export interface ClinicalAttachmentUrl { url: string; expires_in: number }

export const clinicalAttachmentsApi = {
  list: (patientId: number) => api<ClinicalAttachment[]>(`/api/clinical-attachments/patients/${patientId}`),
  upload(patientId: number, files: File[], description?: string, dailyReportId?: number) {
    const body = new FormData();
    files.forEach((file) => body.append('files', file));
    if (description?.trim()) body.append('description', description.trim());
    if (dailyReportId) body.append('daily_report_id', String(dailyReportId));
    return api<ClinicalAttachment[]>(`/api/clinical-attachments/patients/${patientId}`, { method: 'POST', body });
  },
  view: (id: number) => api<ClinicalAttachmentUrl>(`/api/clinical-attachments/${id}/view`, { cache: 'no-store' }),
  remove: (id: number) => api<void>(`/api/clinical-attachments/${id}`, { method: 'DELETE' }),
};
const messages: Record<string, string> = {
  IMAGE_BATCH_LIMIT_EXCEEDED: 'Você pode enviar no máximo 3 imagens por vez.', UNSUPPORTED_IMAGE_TYPE: 'Use uma imagem JPEG, PNG ou WebP.', INVALID_IMAGE: 'O arquivo selecionado não é uma imagem válida.', IMAGE_TOO_LARGE: 'Cada imagem deve ter no máximo 5 MB.', IMAGE_DIMENSIONS_TOO_LARGE: 'A resolução da imagem é muito alta.', PATIENT_IMAGE_QUOTA_REACHED: 'O limite de imagens deste acompanhamento foi atingido.', CLINICAL_IMAGE_UPLOADS_DISABLED: 'O envio de imagens está temporariamente indisponível.', CLINICAL_IMAGE_STORAGE_NOT_CONFIGURED: 'Não foi possível enviar a imagem agora. Tente novamente mais tarde.', ATTACHMENT_DELETE_NOT_ALLOWED: 'Você não possui permissão para excluir esta imagem.', ATTACHMENT_NOT_FOUND: 'Esta imagem não está mais disponível.',
};
function errorCode(payload: unknown) { if (!payload || typeof payload !== 'object') return; const value = payload as { code?: string; detail?: string | { code?: string } }; return value.code ?? (typeof value.detail === 'object' ? value.detail.code : value.detail); }
export function clinicalAttachmentError(error: unknown, action: 'upload' | 'delete' | 'view' | 'list' = 'upload') {
  if (!(error instanceof ApiError)) return action === 'list' ? 'Não foi possível carregar as imagens.' : 'Não foi possível concluir a operação. Tente novamente.';
  const mapped = messages[errorCode(error.payload) ?? '']; if (mapped) return mapped;
  if (error.status === 403) return action === 'delete' ? 'Somente o paciente ou o usuário que enviou a imagem pode excluí-la.' : 'Acesso negado.';
  if (error.status === 413) return messages.IMAGE_TOO_LARGE;
  if (error.status === 415) return messages.UNSUPPORTED_IMAGE_TYPE;
  if (error.status === 503) return messages.CLINICAL_IMAGE_UPLOADS_DISABLED;
  return action === 'list' ? 'Não foi possível carregar as imagens.' : 'Não foi possível concluir a operação. Tente novamente.';
}
