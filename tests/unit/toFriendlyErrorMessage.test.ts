import { describe, expect, it } from 'vitest';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { ApiError, ConflictError, ForbiddenError, InvalidCredentialsError, NotFoundError, UnauthorizedError } from '@/infrastructure/http/ApiClient';

describe('toFriendlyErrorMessage', () => {
  it('mostra a mensagem específica de credenciais inválidas no login, não a de sessão expirada', () => {
    expect(toFriendlyErrorMessage(new InvalidCredentialsError())).toBe('E-mail ou senha não estão corretos.');
  });

  it('mostra a mensagem genérica de conflito de cadastro, sem revelar qual campo já existe', () => {
    const message = toFriendlyErrorMessage(new ConflictError());
    expect(message).toBe('Não foi possível salvar porque já existe um cadastro com estes dados.');
    expect(message.toLowerCase()).not.toContain('e-mail');
    expect(message.toLowerCase()).not.toContain('cpf');
    expect(message.toLowerCase()).not.toContain('telefone');
  });

  it('mostra a mensagem de sessão expirada para um 401 fora do login', () => {
    expect(toFriendlyErrorMessage(new UnauthorizedError())).toBe('Sessão expirada. Faça login novamente.');
  });

  it('preserva as demais mensagens já traduzidas do ApiClient', () => {
    expect(toFriendlyErrorMessage(new ForbiddenError())).toBe('Permissão insuficiente para acessar este recurso.');
    expect(toFriendlyErrorMessage(new NotFoundError())).toBe('O recurso solicitado não foi encontrado.');
    expect(toFriendlyErrorMessage(new ApiError('Ocorreu um erro inesperado.', 500))).toBe('Ocorreu um erro inesperado.');
  });

  it('prioriza o código PROFESSIONAL_PATIENT_CAP_REACHED mesmo vindo de um ApiError', () => {
    const error = new ApiError('Ocorreu um erro inesperado.', 422, { detail: { code: 'PROFESSIONAL_PATIENT_CAP_REACHED' } });
    expect(toFriendlyErrorMessage(error)).toContain('limite de pacientes ativos');
  });

  it('trata falha de rede (erro que não é ApiError) com uma mensagem amigável', () => {
    expect(toFriendlyErrorMessage(new TypeError('Failed to fetch'))).toBe('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.');
  });

  it('cai para uma mensagem genérica em qualquer outro erro inesperado', () => {
    expect(toFriendlyErrorMessage(new Error('algo bem específico do stack'))).toBe('Não foi possível concluir a operação. Tente novamente.');
    expect(toFriendlyErrorMessage('string qualquer')).toBe('Não foi possível concluir a operação. Tente novamente.');
  });
});
