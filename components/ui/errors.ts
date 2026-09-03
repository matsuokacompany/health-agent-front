import { ApiError } from '@/infrastructure/http/ApiClient';

function errorDetailCode(error: unknown): string | undefined {
  const payload = (error as { payload?: unknown } | null)?.payload;
  const detail = (payload as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  return (detail as { code?: string } | null)?.code;
}

export function toFriendlyErrorMessage(error: unknown) {
  if (errorDetailCode(error) === 'PROFESSIONAL_PATIENT_CAP_REACHED') {
    return 'Você atingiu o limite de pacientes ativos do seu plano atual. Faça upgrade em "Assinatura" para vincular mais pacientes.';
  }

  // ApiClient already picks a specific, safe, Portuguese message for every
  // HTTP failure it throws (wrong login vs. expired session, a duplicate
  // signup, forbidden, not found, ...) -- trust it instead of re-deriving
  // intent from the raw text below, which used to overwrite those with a
  // generic fallback because none of its substring checks matched them.
  if (error instanceof ApiError) return error.message;

  const raw = error instanceof Error ? error.message : String(error ?? '');
  const message = raw.toLowerCase();

  if (message.includes('network') || message.includes('failed to fetch')) return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';

  return 'Não foi possível concluir a operação. Tente novamente.';
}
