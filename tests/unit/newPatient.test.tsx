import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { NewPatientModal } from '@/components/professional/NewPatientModal';
import { formatBrazilianPhone, toBrazilianPhoneDigits } from '@/lib/phone';
import Patients from '@/app/(professional)/professional/patients/page';

const { mutateAsync, push, createPatientAnamnese } = vi.hoisted(() => ({ mutateAsync: vi.fn(), push: vi.fn(), createPatientAnamnese: vi.fn() }));
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
vi.mock('@/services/professional', async (original) => ({
  ...(await original<typeof import('@/services/professional')>()),
  createPatientAnamnese,
}));

// The Modal portals its content straight to document.body, not into RTL's
// render() container, so the form has to be looked up from there.
function submitForm() {
  fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

function goToStep(label: string) {
  fireEvent.click(screen.getByRole('button', { name: label }));
}

/** Fills the required fields, which live on the wizard's first two steps
 * (Dados, Plano) -- jumps to Plano via the wizard nav (clicking a step is
 * always allowed, not gated behind completing earlier ones) after filling
 * Dados, and leaves the modal on the Plano step. */
function fillRequired() {
  fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: ' Maria da Silva ' } });
  fireEvent.change(screen.getByLabelText(/E-mail/), { target: { value: 'maria@example.com' } });
  goToStep('Plano');
  fireEvent.change(screen.getByLabelText(/Finalidade do acompanhamento/), { target: { value: ' Inicial ' } });
}

describe('cadastro profissional de pacientes', () => {
  beforeEach(() => { mutateAsync.mockReset(); push.mockReset(); createPatientAnamnese.mockReset(); pending = false; handlers = {}; isProfessional = true; });
  afterEach(cleanup);

  it('renderiza e valida os campos obrigatórios e o formato do e-mail, indo para a primeira etapa com erro', () => {
    render(<NewPatientModal open onClose={vi.fn()} />);
    submitForm();
    // Both Dados and Plano fields are invalid -- the wizard jumps to the
    // first step with an error (Dados) rather than showing every step's
    // errors at once, so Plano's own error only appears once you visit it.
    expect(screen.getByText('Informe o nome completo.')).toBeTruthy();
    expect(screen.getByText('Informe o e-mail.')).toBeTruthy();
    goToStep('Plano');
    expect(screen.getByText('Informe a finalidade do acompanhamento.')).toBeTruthy();
    goToStep('Dados');
    fireEvent.change(screen.getByLabelText(/E-mail/), { target: { value: 'inválido' } });
    submitForm();
    expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('impede uma data final anterior à inicial', () => {
    render(<NewPatientModal open onClose={vi.fn()} />); fillRequired();
    // DateField's input is a masked dd/mm/aaaa text field, not a native
    // <input type="date"> -- feed it digits the way a user typing would.
    fireEvent.change(screen.getByLabelText(/Data do 1º check-in/), { target: { value: '13092026' } });
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '13082026' } });
    submitForm();
    expect(screen.getByText('A data final não pode ser anterior à data inicial.')).toBeTruthy();
  });

  it('impede escolher hoje (ou uma data passada) como 1º check-in, já que o envio das 8h já passou', () => {
    render(<NewPatientModal open onClose={vi.fn()} />); fillRequired();
    const today = new Date();
    const todayDigits = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`;
    const startInput = screen.getByLabelText(/Data do 1º check-in/);
    fireEvent.change(startInput, { target: { value: todayDigits } });
    submitForm();
    expect(screen.getByText(/Escolha uma data a partir de amanhã/)).toBeTruthy();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('envia o payload sem campos opcionais vazios nem roles', async () => {
    mutateAsync.mockResolvedValue({});
    render(<NewPatientModal open onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Nome completo/), { target: { value: ' Maria da Silva ' } });
    fireEvent.change(screen.getByLabelText(/E-mail/), { target: { value: 'maria@example.com' } });
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '43999999999' } });
    goToStep('Plano');
    fireEvent.change(screen.getByLabelText(/Finalidade do acompanhamento/), { target: { value: ' Inicial ' } });
    submitForm();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ name: 'Maria da Silva', email: 'maria@example.com', phone: '5543999999999', plan_title: 'Inicial', supplements: [], allergies: [] }));
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('roles');
  });

  it('apresenta o contexto clínico com contador, aviso e associação acessível', () => {
    render(<NewPatientModal open onClose={vi.fn()} />);
    goToStep('Plano');
    const context = screen.getByLabelText(/Contexto clínico e pontos a acompanhar/);
    fireEvent.change(context, { target: { value: 'Acompanhar dor e inchaço.' } });
    expect(screen.getByText('25/2000')).toBeTruthy();
    expect(context.getAttribute('aria-describedby')).toContain('plan-description-help');
    expect(screen.getByText(/As informações deste plano organizam/)).toBeTruthy();
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
    goToStep('Anamnese');
    expect((screen.getByRole('button', { name: 'Cadastrando...' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('fecha e navega com o id retornado após o sucesso', async () => {
    const close = vi.fn();
    mutateAsync.mockResolvedValue({ patient: { id: 123 } });
    render(<NewPatientModal open onClose={close} />); fillRequired();
    submitForm();
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
    goToStep('Dados');
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

  it('só mostra o botão Cadastrar paciente na última etapa do assistente', () => {
    render(<NewPatientModal open onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Cadastrar paciente' })).toBeNull();
    goToStep('Anamnese');
    expect(screen.getByRole('button', { name: 'Cadastrar paciente' })).toBeTruthy();
  });

  it('permite adicionar uma alergia e envia no payload de cadastro', async () => {
    mutateAsync.mockResolvedValue({});
    render(<NewPatientModal open onClose={vi.fn()} />);
    fillRequired();
    goToStep('Alergias');
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar alergia' }));
    fireEvent.change(screen.getByPlaceholderText('Ex.: Frutos do mar'), { target: { value: 'Frutos do mar' } });
    fireEvent.change(screen.getByDisplayValue('Moderada'), { target: { value: 'RISCO_DE_MORTE' } });
    submitForm();
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0][0].allergies).toEqual([{ allergen: 'Frutos do mar', severity: 'RISCO_DE_MORTE' }]);
  });

  it('permite marcar fatores de risco e envia junto com a anamnese', async () => {
    mutateAsync.mockResolvedValue({ patient: { id: 55 } });
    createPatientAnamnese.mockResolvedValue({});
    render(<NewPatientModal open onClose={vi.fn()} />);
    fillRequired();
    goToStep('Anamnese');
    fireEvent.click(screen.getByLabelText('Diabetes'));
    submitForm();
    await waitFor(() => expect(createPatientAnamnese).toHaveBeenCalledWith(55, expect.objectContaining({ risk_diabetes: true })));
  });
});
