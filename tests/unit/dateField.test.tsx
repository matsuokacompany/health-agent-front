import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateField } from '@/components/ui/DateField';

describe('DateField', () => {
  afterEach(cleanup);

  it('máscara os dígitos digitados como dd/mm/aaaa e reporta o valor ISO quando completo', () => {
    const onChange = vi.fn();
    render(<DateField value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('dd/mm/aaaa') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '1' } });
    expect(input.value).toBe('1');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '13092026' } });
    expect(input.value).toBe('13/09/2026');
    expect(onChange).toHaveBeenCalledWith('2026-09-13');
  });

  it('não reporta uma data impossível e reverte a exibição ao perder o foco', () => {
    const onChange = vi.fn();
    render(<DateField value="2026-01-01" onChange={onChange} />);
    const input = screen.getByPlaceholderText('dd/mm/aaaa') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '31022026' } }); // 31 de fevereiro não existe
    expect(input.value).toBe('31/02/2026');
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(input.value).toBe('01/01/2026');
  });

  it('abre o calendário, respeita min/max e seleciona um dia', () => {
    const onChange = vi.fn();
    render(<DateField value="2026-09-10" min="2026-09-05" max="2026-09-20" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    expect(screen.getByRole('dialog', { name: 'Selecionar data' })).toBeTruthy();

    const dayBefore = screen.getByRole('button', { name: '3' }) as HTMLButtonElement;
    expect(dayBefore.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: '15' }));
    expect(onChange).toHaveBeenCalledWith('2026-09-15');
    expect(screen.queryByRole('dialog', { name: 'Selecionar data' })).toBeNull();
  });

  it('sincroniza a exibição quando o valor externo muda (ex.: outro campo do formulário)', () => {
    const { rerender } = render(<DateField value="" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('dd/mm/aaaa') as HTMLInputElement;
    expect(input.value).toBe('');

    rerender(<DateField value="2026-12-25" onChange={vi.fn()} />);
    expect(input.value).toBe('25/12/2026');
  });
});
