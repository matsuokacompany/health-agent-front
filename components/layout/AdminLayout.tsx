'use client';

import { RequireAccessContext } from '@/components/auth/guards';
import { ResponsiveAppShell } from './ResponsiveAppShell';

const links = [
  ['/admin', 'Dashboard'],
  ['/admin/usuarios', 'Usuários'],
  ['/admin/pacientes', 'Pacientes'],
  ['/admin/pacientes/novo', 'Novo paciente'],
  ['/admin/custos', 'Custos'],
  ['/admin/whatsapp', 'WhatsApp'],
  ['/patient', 'Paciente'],
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAccessContext context="admin">
      <ResponsiveAppShell title="Administração" sidebarTitle="Admin" marker="A" links={links} profileHref="/admin" footerHref="/logout" footerLabel="Sair">
        {children}
      </ResponsiveAppShell>
    </RequireAccessContext>
  );
}
