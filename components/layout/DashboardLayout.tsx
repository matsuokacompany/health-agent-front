'use client';

import { RequireAuth } from '@/components/auth/guards';
import { ResponsiveAppShell } from './ResponsiveAppShell';

const links = [
  ['/dashboard', 'Dashboard'],
  ['/patients', 'Pacientes'],
  ['/settings', 'Configurações'],
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <ResponsiveAppShell title="Dashboard" sidebarTitle="Julha" marker="+" links={links} profileHref="/settings" footerHref="/logout" footerLabel="Sair">
        {children}
      </ResponsiveAppShell>
    </RequireAuth>
  );
}
