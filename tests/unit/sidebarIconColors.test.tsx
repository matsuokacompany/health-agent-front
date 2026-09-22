import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { TourProvider } from '@/components/tour/TourProvider';
import { AppSidebar } from '@/components/layout/Sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/professional/patients' }));
vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: null }) }));

function renderSidebar() {
  return render(
    <TourProvider>
      <I18nProvider>
        <AppSidebar
          title="Julha"
          marker="+"
          links={[
            ['/professional/patients', 'Pacientes'],
            ['/professional/patients/new', 'Novo paciente'],
            ['/professional/configuracoes', 'Configurações'],
          ]}
          profileHref="/professional/profile"
          footerHref="/logout"
          footerLabel="Sair"
        />
      </I18nProvider>
    </TourProvider>,
  );
}

describe('cores dos ícones da sidebar', () => {
  afterEach(cleanup);

  it('dá uma cor de destaque própria para cada módulo, mesmo no item ativo', () => {
    // Regression: every sidebar icon rendered flat gray/brand -- one same
    // color for everything -- which read as "sem personalidade". Each
    // module now keeps its own identity color on the icon itself,
    // independent of the row's active-state background/text color.
    renderSidebar();
    const pacientes = screen.getByRole('link', { name: 'Pacientes' });
    expect(pacientes.className).toContain('is-current');
    expect(pacientes.querySelector('svg.icon-green')).toBeTruthy();

    const novoPaciente = screen.getByRole('link', { name: 'Novo paciente' });
    expect(novoPaciente.querySelector('svg.icon-orange')).toBeTruthy();
  });

  it('mantém os itens utilitários neutros (sem classe de cor)', () => {
    renderSidebar();
    const configuracoes = screen.getByRole('link', { name: 'Configurações' });
    const svg = configuracoes.querySelector('svg');
    expect(svg?.getAttribute('class')).toBeFalsy();
  });
});
