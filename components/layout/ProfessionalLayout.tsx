'use client';

import { RequireAccessContext } from '@/components/auth/guards';
import { ResponsiveAppShell } from './ResponsiveAppShell';

const links = [['/professional/patients', 'Pacientes']];

export function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAccessContext context="professional">
      <ResponsiveAppShell title="Painel médico" sidebarTitle="Profissional" marker="⚕" links={links} profileHref="/professional" footerHref="/logout" footerLabel="Sair">
        {children}
      </ResponsiveAppShell>
    </RequireAccessContext>
  );
}
