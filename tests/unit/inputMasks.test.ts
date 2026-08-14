import { describe, expect, it } from 'vitest';
import { maskCep, maskCpf, maskPhone, maskState } from '@/lib/inputMasks';

describe('input masks', () => {
  it('formats and limits CPF', () => expect(maskCpf('123abc456789019')).toBe('123.456.789-01'));
  it('formats Brazilian mobile phones with or without country code', () => {
    expect(maskPhone('11999998888')).toBe('(11) 99999-8888');
    expect(maskPhone('5511999998888')).toBe('+55 (11) 99999-8888');
  });
  it('formats CEP and normalizes state', () => {
    expect(maskCep('123456789')).toBe('12345-678');
    expect(maskState('r1j')).toBe('RJ');
  });
});
