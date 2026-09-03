import { ApiError } from '@/infrastructure/http/ApiClient';
import { api } from './api';

export const SUPPORT_SUBJECTS = [
  'Problema técnico',
  'Dúvida sobre minha conta ou assinatura',
  'Dúvida sobre um relatório ou monitoramento',
  'Sugestão',
  'Outro assunto',
] as const;

export const supportApi = {
  sendContact({ subject, message, attachment }: { subject: string; message: string; attachment?: File | null }) {
    const body = new FormData();
    body.append('subject', subject);
    body.append('message', message);
    if (attachment) body.append('attachment', attachment);
    return api<void>('/api/support/contact', { method: 'POST', body });
  },
};

const messages: Record<string, string> = {
  UNSUPPORTED_IMAGE_TYPE: 'Use uma imagem JPEG, PNG ou WebP.',
  IMAGE_TOO_LARGE: 'A imagem deve ter no máximo 5 MB.',
  SUPPORT_EMAIL_DELIVERY_FAILED: 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.',
};

function errorCode(payload: unknown) {
  if (!payload || typeof payload !== 'object') return;
  const value = payload as { detail?: string | { code?: string } };
  return typeof value.detail === 'string' ? value.detail : value.detail?.code;
}

export function supportContactError(error: unknown) {
  if (error instanceof ApiError) {
    const mapped = messages[errorCode(error.payload) ?? ''];
    if (mapped) return mapped;
  }
  return 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.';
}
