'use client';
import { RequireAccessContext } from '@/components/auth/guards';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';
const links = [['/admin','Dashboard'],['/admin/pacientes','Pacientes'],['/admin/pacientes/novo','Novo paciente'],['/admin/profissionais','Profissionais'],['/admin/whatsapp','WhatsApp'],['/patient','Paciente']];
export function AdminLayout({ children }: { children: React.ReactNode }) { return <RequireAccessContext context="admin"><main className="app-shell"><AppSidebar title="Admin" marker="A" links={links} profileHref="/admin" footerHref="/logout" footerLabel="Sair" /><section className="content-shell"><AppHeader title="Administração" />{children}</section></main></RequireAccessContext>; }
