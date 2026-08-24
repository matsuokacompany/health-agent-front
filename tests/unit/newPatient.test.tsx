import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { NewPatientModal } from '@/components/professional/NewPatientModal';
import { formatBrazilianPhone, toBrazilianPhoneDigits } from '@/lib/phone';
import Patients from '@/app/(professional)/professional/patients/page';

const { mutateAsync, push } = vi.hoisted(() => ({ mutateAsync: vi.fn(), push: vi.fn() }));
let pending = false;
let handlers: { onSuccess?: (id: number) => void; onError?: (error: unknown) => void } = {};
let isProfessional = true;

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams() }));
vi.mock('@/hooks/useProfessional', () => ({
  useProfessionalPatients: () => ({ data: [], isLoading: false, error: null }),
  useCreateProfessionalPatient: (options: typeof handlers) => {
    handlers = options;
    return { mutateAsync, isPending: pending };
  },
}));
vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ isProfessional }) }));

function fillRequired() {
  fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: ' Maria da Silva ' } });
  fireEvent.change(screen.getByLabelText(/E-mail/), { target: { value: 'maria@example.com' } });
  fireEvent.change(screen.getByLabelText(/Título do plano/), { target: { value: ' Inicial ' } });
}

describe('cadastro profissional de pacientes', () => {
  beforeEach(() => { mutateAsync.mockReset(); push.mockReset(); pending = false; handlers = {}; isProfessional = true; });
  afterEach(cleanup);

  it('renderiza e valida os campos obrigatórios e o formato do e-mail', () => {
    render(<NewPatientModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar paciente' }));
    expect(screen.getByText('Informe o nome completo.')).toBeTruthy();
    expect(screen.getByText('Informe o e-mail.')).toBeTruthy();
    expect(screen.getByText('Informe o título do plano.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/E-mail/), { target: { value: 'inválido' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar paciente' }));
    expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('impede uma data final anterior à inicial', () => {
    render(<NewPatientModal open onClose={vi.fn()} />); fillRequired();
    fireEvent.change(screen.getByLabelText('Data inicial do plano'), { target: { value: '2026-09-13' } });
    fireEvent.change(screen.getByLabelText('Data final do plano'), { target: { value: '2026-08-13' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar paciente' }));
    expect(screen.getByText('A data final não pode ser anterior à data inicial.')).toBeTruthy();
  });

  it('envia o payload sem campos opcionais vazios nem roles', async () => {
    mutateAsync.mockResolvedValue({});
    render(<NewPatientModal open onClose={vi.fn()} />); fillRequired();
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '43999999999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar paciente' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ name: 'Maria da Silva', email: 'maria@example.com', phone: '5543999999999', plan_title: 'Inicial' }));
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('roles');
  });

  it('mantém o foco no campo durante a digitação e aplica máscara de telefone', () => {
    render(<NewPatientModal open onClose={vi.fn()} />);
    const phone = screen.getByLabelText('Telefone');
    phone.focus();
    fireEvent.change(phone, { target: { value: '11999999999' } });

    expect(document.activeElement).toBe(phone);
    expect((phone as HTMLInputElement).value).toBe('+55 (11) 99999-9999');
  });

  it.each([
    ['11987654321', '+55 (11) 98765-4321'],
    ['+5511987654321', '+55 (11) 98765-4321'],
    ['1133334444', '+55 (11) 3333-4444'],
  ])('formata o telefone %s', (input, expected) => {
    expect(formatBrazilianPhone(input)).toBe(expected);
  });

  it('envia o telefone somente com dígitos, incluindo o código do país', () => {
    expect(toBrazilianPhoneDigits('+55 (43) 99999-9999')).toBe('5543999999999');
  });

  it('desabilita a submissão durante o loading', () => {
    pending = true;
    render(<NewPatientModal open onClose={vi.fn()} />);
    expect((screen.getByRole('button', { name: 'Cadastrando...' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('fecha e navega com o id retornado após o sucesso', async () => {
    const close = vi.fn();
    mutateAsync.mockResolvedValue({ patient: { id: 123 } });
    render(<NewPatientModal open onClose={close} />); fillRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar paciente' }));
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(push).toHaveBeenCalledWith('/professional/patients/123?created=1');
  });

  it.each([
    [403, {}, 'É necessário possuir um perfil profissional ativo'],
    [409, { detail: 'E-mail já cadastrado' }, 'E-mail já cadastrado'],
  ])('trata a resposta %s sem apagar valores', (status, payload, message) => {
    render(<NewPatientModal open onClose={vi.fn()} />); fillRequired();
    act(() => handlers.onError?.(new ApiError('erro', status, payload)));
    expect(screen.getByText(new RegExp(message))).toBeTruthy();
    expect((screen.getByLabelText(/Nome completo/) as HTMLInputElement).value).toBe(' Maria da Silva ');
  });

  it('mapeia erros 422 para o campo correspondente', () => {
    render(<NewPatientModal open onClose={vi.fn()} />);
    act(() => handlers.onError?.(new ApiError('erro', 422, { detail: [{ loc: ['body', 'cpf'], msg: 'CPF inválido' }] })));
    expect(screen.getByText('CPF inválido')).toBeTruthy();
    expect(document.querySelector('input[name="cpf"]')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('não mostra Novo paciente para usuários sem o papel professional', () => {
    isProfessional = false;
    render(<Patients />);
    expect(screen.queryByRole('button', { name: 'Novo paciente' })).toBeNull();
  });
});
