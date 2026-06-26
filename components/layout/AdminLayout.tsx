'use client';
import { RequireAdmin } from '@/components/auth/guards';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';
const links = [['/admin','Dashboard'],['/admin/pacientes','Pacientes'],['/admin/pacientes/novo','Novo paciente'],['/admin/profissionais','Profissionais'],['/admin/whatsapp','WhatsApp'],['/app','Área do paciente']];
export function AdminLayout({ children }: { children: React.ReactNode }) { return <RequireAdmin><main className="app-shell"><AppSidebar title="Admin" marker="A" links={links} profileHref="/app/perfil" footerHref="/logout" footerLabel="Sair" /><section className="content-shell"><AppHeader title="Administração" />{children}</section></main></RequireAdmin>; }
