import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { TourProvider } from '@/components/tour/TourProvider';
import { AppSidebar } from '@/components/layout/Sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/patient/dashboard' }));

const auth = vi.hoisted(() => ({ user: null as { name: string } | null }));
vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: auth.user }) }));

function renderSidebar() {
  return render(
    <TourProvider>
      <I18nProvider>
        <AppSidebar
          title="Julha"
          marker="+"
          links={[['/patient/dashboard', 'Dashboard']]}
          profileHref="/patient/profile"
          footerHref="/logout"
          footerLabel="Sair"
        />
      </I18nProvider>
    </TourProvider>,
  );
}

describe('rótulo do botão de perfil na sidebar', () => {
  afterEach(cleanup);

  it('mostra o primeiro nome do usuário em vez do rótulo "Perfil"', () => {
    auth.user = { name: 'Maria Aparecida Souza' };
    renderSidebar();
    const trigger = screen.getByRole('button', { name: 'Maria' });
    expect(trigger.getAttribute('title')).toBe('Perfil');
  });

  it('usa "Perfil" como retorno quando ainda não há nome carregado', () => {
    auth.user = null;
    renderSidebar();
    expect(screen.getByRole('button', { name: 'Perfil' })).toBeTruthy();
  });

  it('abre um menu com "Ver informações" e "Sair" ao clicar', () => {
    auth.user = { name: 'Maria Aparecida Souza' };
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'Maria' }));

    const viewInfo = screen.getByRole('menuitem', { name: 'Ver informações' }) as HTMLAnchorElement;
    const logout = screen.getByRole('menuitem', { name: 'Sair' }) as HTMLAnchorElement;
    expect(viewInfo.getAttribute('href')).toBe('/patient/profile');
    expect(logout.getAttribute('href')).toBe('/logout');
  });
});
