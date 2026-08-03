import { describe, expect, it } from 'vitest';

import { ApiError } from '@/infrastructure/http/ApiClient';
import { monitoringLoadErrorMessage } from '@/services/patientMonitoring';

describe('erros ao carregar o monitoramento do paciente', () => {
  it('não descreve um erro do calendário como resposta do paciente', () => {
    const message = monitoringLoadErrorMessage(new ApiError('Not found', 404));

    expect(message).toBe('Não foi possível localizar o calendário deste monitoramento.');
    expect(message).not.toContain('Resposta não encontrada');
  });

  it('diferencia falta de permissão de sessão expirada', () => {
    expect(monitoringLoadErrorMessage(new ApiError('Forbidden', 403))).toBe('Você não possui acesso a este monitoramento.');
    expect(monitoringLoadErrorMessage(new ApiError('Unauthorized', 401))).toBe('Sessão expirada. Faça login novamente.');
  });
});
