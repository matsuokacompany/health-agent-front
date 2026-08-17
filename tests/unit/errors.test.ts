import { describe, expect, it } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { toLoginErrorMessage } from '@/components/ui/errors';

describe('login errors', () => {
  it.each([400, 401])('does not reveal which credential failed for status %s', (status) => {
    expect(toLoginErrorMessage(new ApiError('backend detail', status))).toBe('E-mail ou senha incorretos. Confira os dados e tente novamente.');
  });
  it('keeps connection failures actionable', () => {
    expect(toLoginErrorMessage(new TypeError('Failed to fetch'))).toBe('Não foi possível conectar ao servidor.');
  });
});
