'use client';
import { RequireRole } from '@/components/auth/guards';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';

const links = [['/patient/dashboard','Resumo'],['/patient/calendar','Calendário'],['/app/perfil','Perfil']];

export function PatientLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="patient"><main className="app-shell"><AppSidebar title="Julha" marker="+" links={links} profileHref="/app/perfil" footerHref="/logout" footerLabel="Sair" /><section className="content-shell"><AppHeader title="Portal do paciente" />{children}</section></main></RequireRole>;
}
