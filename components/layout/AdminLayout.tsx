'use client';

import { RequireAccessContext } from '@/components/auth/guards';
import { LegalLinks } from './LegalLinks';
import { ResponsiveAppShell } from './ResponsiveAppShell';

const links = [
  ['/admin', 'Dashboard'],
  ['/admin/usuarios', 'Usuários'],
  ['/admin/custos', 'Custos'],
  ['/admin/whatsapp', 'WhatsApp'],
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAccessContext context="admin">
      <ResponsiveAppShell title="Administração" sidebarTitle="Admin" marker="A" links={links} profileHref="/admin/profile" footerHref="/logout" footerLabel="Sair" footer={<footer className="app-footer"><LegalLinks /></footer>}>
        {children}
      </ResponsiveAppShell>
    </RequireAccessContext>
  );
}
