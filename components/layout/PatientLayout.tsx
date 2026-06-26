'use client';
import { RequireRole } from '@/components/auth/guards';
import { PatientDataProvider } from '@/components/patient/PatientDataProvider';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';

const links = [['/patient/dashboard','Dashboard'],['/patient/calendar','Calendário'],['/patient/monitoring','Monitoramento'],['/patient/anamnese','Anamnese']];

export function PatientLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="patient"><PatientDataProvider><main className="app-shell"><AppSidebar title="Julha" marker="+" links={links} profileHref="/patient/profile" footerHref="/logout" footerLabel="Sair" /><section className="content-shell"><AppHeader title="Portal do paciente" />{children}<footer className="app-footer">Julha Saúde • Dados protegidos • Suporte clínico via WhatsApp</footer></section></main></PatientDataProvider></RequireRole>;
}
