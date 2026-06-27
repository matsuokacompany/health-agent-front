'use client';
import { RequireAccessContext } from '@/components/auth/guards';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';

const links = [['/professional/patients','Pacientes']];

export function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return <RequireAccessContext context="professional"><main className="app-shell"><AppSidebar title="Profissional" marker="⚕" links={links} profileHref="/professional" footerHref="/logout" footerLabel="Sair" /><section className="content-shell"><AppHeader title="Painel médico" />{children}</section></main></RequireAccessContext>;
}
