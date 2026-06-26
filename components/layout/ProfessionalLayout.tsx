'use client';
import { RequireRole } from '@/components/auth/guards';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';

const links = [['/professional/patients','Pacientes'],['/app/perfil','Perfil']];

export function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="professional"><main className="app-shell"><AppSidebar title="Profissional" marker="⚕" links={links} profileHref="/app/perfil" footerHref="/logout" footerLabel="Sair" /><section className="content-shell"><AppHeader title="Painel médico" />{children}</section></main></RequireRole>;
}
