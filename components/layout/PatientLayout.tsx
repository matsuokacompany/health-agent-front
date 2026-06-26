'use client';
import { RequireRole } from '@/components/auth/guards';
import { AppSidebar } from './Sidebar';

const links = [['/patient/dashboard','Resumo'],['/patient/calendar','Calendário'],['/app/perfil','Perfil']];

export function PatientLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="patient"><main className="app-shell"><AppSidebar title="Julha" marker="+" links={links} footerHref="/logout" footerLabel="Sair" /><section>{children}</section></main></RequireRole>;
}
