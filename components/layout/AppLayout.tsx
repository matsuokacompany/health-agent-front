'use client';
import { RequireAuth } from '@/components/auth/guards';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';
const links = [['/app','Dashboard'],['/app/anamnese','Anamnese'],['/app/monitoramento','Monitoramento']];
export function AppLayout({ children }: { children: React.ReactNode }) { return <RequireAuth><main className="app-shell"><AppSidebar title="Julha Saúde" marker="+" links={links} profileHref="/app/perfil" footerHref="/logout" footerLabel="Sair" /><section className="content-shell"><AppHeader title="Área do paciente" />{children}</section></main></RequireAuth>; }
