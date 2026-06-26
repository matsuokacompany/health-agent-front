'use client';
import { RequireAuth } from '@/components/auth/guards';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';
const links = [['/app','Dashboard'],['/app/perfil','Perfil'],['/app/anamnese','Anamnese'],['/app/monitoramento','Monitoramento'],['/app/relatorios','Relatórios'],['/app/insights','Insights']];
export function AppLayout({ children }: { children: React.ReactNode }) { return <RequireAuth><main className="app-shell"><AppSidebar title="Julha Saúde" marker="+" links={links} profileHref="/app/perfil" footerHref="/logout" footerLabel="Sair" /><section className="content-shell"><AppHeader title="Área do paciente" />{children}</section></main></RequireAuth>; }
