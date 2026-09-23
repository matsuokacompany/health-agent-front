'use client';

import { RequireAccessContext } from '@/components/auth/guards';
import { LegalLinks } from './LegalLinks';
import { ResponsiveAppShell } from './ResponsiveAppShell';

const links = [
  ['/professional/dashboard', 'Dashboard'],
  ['/professional/patients', 'Pacientes'],
  ['/professional/assinatura', 'Assinatura'],
];

export function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAccessContext context="professional">
      <ResponsiveAppShell title="Painel médico" sidebarTitle="Profissional" marker="⚕" links={links} profileHref="/professional/profile" footerHref="/logout" footerLabel="Sair" footer={<footer className="app-footer"><LegalLinks /></footer>}>
        {children}
      </ResponsiveAppShell>
    </RequireAccessContext>
  );
}
