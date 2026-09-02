import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TourProvider } from '@/components/tour/TourProvider';
import { TourButton } from '@/components/tour/TourButton';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
let pathname = '/professional/patients';
let authUser: { id: string | number } | null = { id: 1 };
let isProfessional = true;
let isPatient = false;
let isSuperAdmin = false;

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => pathname }));
vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: authUser, isProfessional, isPatient, isSuperAdmin }) }));

function Harness() {
  return <TourProvider>
    <TourButton />
    <nav data-tour="sidebar-nav">menu</nav>
    <button type="button" data-tour="new-patient">Novo paciente</button>
    <section data-tour="patients-metrics">metrics</section>
    <div data-tour="patients-table">table</div>
  </TourProvider>;
}

describe('tour guiado', () => {
  beforeEach(() => {
    push.mockReset();
    pathname = '/professional/patients';
    authUser = { id: 1 };
    isProfessional = true;
    isPatient = false;
    isSuperAdmin = false;
    window.localStorage.clear();
  });
  afterEach(cleanup);

  it('inicia automaticamente na primeira visita e mostra o passo de boas-vindas', () => {
    render(<Harness />);
    expect(screen.getByRole('dialog', { name: 'Bem-vindo à Julha' })).toBeTruthy();
    expect(screen.getByText('1 de 6')).toBeTruthy();
  });

  it('não inicia de novo depois que o usuário já viu o tour', () => {
    window.localStorage.setItem('julha_tour_seen_v1_professional_1', '1');
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('avança e volta entre os passos', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByText('2 de 6')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByText('1 de 6')).toBeTruthy();
  });

  it('pular tour fecha o overlay e marca como visto', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Pular tour' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(window.localStorage.getItem('julha_tour_seen_v1_professional_1')).toBe('1');
  });

  it('concluir o último passo fecha o overlay e marca como visto', () => {
    render(<Harness />);
    for (let i = 0; i < 5; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(window.localStorage.getItem('julha_tour_seen_v1_professional_1')).toBe('1');
  });

  it('esc fecha o tour e marca como visto', () => {
    render(<Harness />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(window.localStorage.getItem('julha_tour_seen_v1_professional_1')).toBe('1');
  });

  it('o botão de ajuda reabre o tour do início mesmo depois de visto', () => {
    window.localStorage.setItem('julha_tour_seen_v1_professional_1', '1');
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ajuda' }));
    expect(screen.getByText('1 de 6')).toBeTruthy();
  });

  it('o botão de ajuda navega para a home do papel antes de iniciar quando em outra página', () => {
    pathname = '/professional/assinatura';
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajuda' }));
    expect(push).toHaveBeenCalledWith('/professional/patients');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('não renderiza o botão de ajuda para quem não tem papel com tour', () => {
    isProfessional = false;
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Ajuda' })).toBeNull();
  });

  it('usa os passos do paciente quando o usuário é paciente', () => {
    isProfessional = false;
    isPatient = true;
    pathname = '/patient/dashboard';
    render(<Harness />);
    expect(screen.getByText('Bem-vindo à Julha')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByText('Seu plano')).toBeTruthy();
  });

  it('não quebra quando localStorage não está disponível', () => {
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => { throw new Error('blocked'); };
    expect(() => act(() => { render(<Harness />); })).not.toThrow();
    window.localStorage.getItem = original;
  });
});
