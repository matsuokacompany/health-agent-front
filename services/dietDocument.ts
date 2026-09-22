import { ApiError } from '@/infrastructure/http/ApiClient';
import type { DietDocument } from '@/lib/types';
import { api } from './api';

export interface DietDocumentUrl { url: string; expires_in: number }

export const dietDocumentApi = {
  get: (patientId: number) => api<DietDocument | null>(`/api/diet-documents/patients/${patientId}`),
  upload(patientId: number, file: File) {
    const body = new FormData();
    body.append('file', file);
    return api<DietDocument>(`/api/diet-documents/patients/${patientId}`, { method: 'PUT', body });
  },
  view: (patientId: number) => api<DietDocumentUrl>(`/api/diet-documents/patients/${patientId}/view`, { cache: 'no-store' }),
  remove: (patientId: number) => api<void>(`/api/diet-documents/patients/${patientId}`, { method: 'DELETE' }),
};

const messages: Record<string, string> = {
  UNSUPPORTED_DOCUMENT_TYPE: 'Envie o plano alimentar em formato PDF.',
  INVALID_PDF: 'O arquivo selecionado não é um PDF válido.',
  DOCUMENT_TOO_LARGE: 'O arquivo deve ter no máximo 10 MB.',
  DIET_DOCUMENT_UPLOADS_DISABLED: 'O envio de plano alimentar está temporariamente indisponível.',
  DIET_DOCUMENT_NOT_FOUND: 'Nenhum plano alimentar foi enviado ainda.',
};

function errorCode(payload: unknown) {
  if (!payload || typeof payload !== 'object') return;
  const value = payload as { code?: string; detail?: string | { code?: string } };
  return value.code ?? (typeof value.detail === 'object' ? value.detail.code : value.detail);
}

export function dietDocumentError(error: unknown) {
  if (!(error instanceof ApiError)) return 'Não foi possível concluir a operação. Tente novamente.';
  const mapped = messages[errorCode(error.payload) ?? ''];
  if (mapped) return mapped;
  if (error.status === 403) return 'Acesso negado.';
  if (error.status === 413) return messages.DOCUMENT_TOO_LARGE;
  if (error.status === 415) return messages.UNSUPPORTED_DOCUMENT_TYPE;
  if (error.status === 503) return messages.DIET_DOCUMENT_UPLOADS_DISABLED;
  return 'Não foi possível concluir a operação. Tente novamente.';
}
