'use client';

import { RequireAuth } from '@/components/auth/guards';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';

const links = [
  ['/dashboard', 'Dashboard'],
  ['/patients', 'Pacientes'],
  ['/settings', 'Configurações'],
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <main className="app-shell">
        <AppSidebar title="Julha" marker="+" links={links} profileHref="/settings" footerHref="/logout" footerLabel="Sair" />
        <section className="content-shell">
          <AppHeader title="Dashboard" />
          <div className="page-outlet">{children}</div>
        </section>
      </main>
    </RequireAuth>
  );
}
