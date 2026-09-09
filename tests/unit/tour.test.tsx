import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TourProvider } from '@/components/tour/TourProvider';
import { TourButton } from '@/components/tour/TourButton';

let pathname = '/professional/patients';

vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

function Harness() {
  return <TourProvider>
    <TourButton />
    <aside className="sidebar">
      <nav data-tour="sidebar-nav">menu</nav>
      <a href="/patient/profile">Perfil</a>
    </aside>
    <button type="button" data-tour="new-patient">Novo paciente</button>
    <section data-tour="patients-metrics">metrics</section>
    <div data-tour="patients-table">table</div>
    <div data-tour="patient-plan">plan</div>
    <section data-tour="patient-summary">summary</section>
    <div data-tour="patient-symptoms">symptoms</div>
  </TourProvider>;
}

function openTour() {
  fireEvent.click(screen.getByRole('button', { name: 'Tour guiado' }));
}

describe('tour guiado', () => {
  beforeEach(() => {
    pathname = '/professional/patients';
  });
  afterEach(cleanup);

  it('não inicia automaticamente ao carregar a página', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('o botão "Tour guiado" abre o tour desta página', () => {
    render(<Harness />);
    openTour();
    expect(screen.getByRole('dialog', { name: 'Bem-vindo à Julha' })).toBeTruthy();
    expect(screen.getByText('1 de 6')).toBeTruthy();
  });

  it('avança e volta entre os passos', () => {
    render(<Harness />);
    openTour();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByText('2 de 6')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByText('1 de 6')).toBeTruthy();
  });

  it('pular tour fecha o overlay', () => {
    render(<Harness />);
    openTour();
    fireEvent.click(screen.getByRole('button', { name: 'Pular tour' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('concluir o último passo fecha o overlay', () => {
    render(<Harness />);
    openTour();
    for (let i = 0; i < 5; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('esc fecha o tour', () => {
    render(<Harness />);
    openTour();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('o tour pode ser reaberto quantas vezes o usuário quiser', () => {
    render(<Harness />);
    openTour();
    fireEvent.click(screen.getByRole('button', { name: 'Pular tour' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    openTour();
    expect(screen.getByText('1 de 6')).toBeTruthy();
  });

  it('não renderiza o botão de tour em uma página sem tour cadastrado', () => {
    pathname = '/professional/patients/5';
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Tour guiado' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('cada página usa seus próprios passos', () => {
    pathname = '/patient/dashboard';
    render(<Harness />);
    openTour();
    expect(screen.getByText('Bem-vindo à Julha')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByText('Seu plano')).toBeTruthy();
  });

  it('posiciona o tooltip ao lado (não em cima) de um alvo alto e estreito como a sidebar', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    render(<Harness />);
    openTour();
    const sidebar = screen.getByText('menu');
    vi.spyOn(sidebar, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 800, left: 0, right: 280, width: 280, height: 800, x: 0, y: 0, toJSON() {} } as DOMRect);

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByText('Menu de navegação')).toBeTruthy();

    await waitFor(() => {
      const tooltip = document.querySelector('.tour-tooltip') as HTMLElement;
      // Anchored just to the right of the sidebar's own right edge (280px),
      // not centered over it (which is what put the card on top of the
      // sidebar before this fix).
      expect(tooltip.style.left).toBe('296px');
    });
  });

  it('nunca bloqueia a coluna da sidebar (ex.: o link Perfil) enquanto a tour está aberta', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    render(<Harness />);
    openTour();
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    vi.spyOn(sidebar, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 800, left: 0, right: 280, width: 280, height: 800, x: 0, y: 0, toJSON() {} } as DOMRect);
    fireEvent(window, new Event('resize'));

    await waitFor(() => {
      const guards = Array.from(document.querySelectorAll('.tour-click-guard')) as HTMLElement[];
      expect(guards.length).toBeGreaterThan(0);
      guards.forEach((guard) => expect(parseFloat(guard.style.left)).toBeGreaterThanOrEqual(280));
    });

    expect(screen.getByRole('link', { name: 'Perfil' })).toBeTruthy();
  });
});
