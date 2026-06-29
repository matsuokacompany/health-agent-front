export function toFriendlyErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const message = raw.toLowerCase();

  if (message.includes('network') || message.includes('failed to fetch')) return 'Não foi possível conectar ao servidor.';
  if (message.includes('401') || message.includes('unauthorized') || message.includes('sessão expirada')) return 'Sua sessão expirou. Faça login novamente.';
  if (message.includes('403') || message.includes('forbidden') || message.includes('permissão')) return 'Você não tem permissão para realizar esta ação.';
  if (message.includes('500') || message.includes('internal server') || message.includes('fastapi')) return 'Ocorreu um erro inesperado.';
  if (message.includes('supabase') || message.includes('token') || message.includes('bearer') || message.includes('stack')) return 'Não foi possível concluir a operação.';

  return 'Não foi possível concluir a operação. Tente novamente.';
}
