'use client';
import { RequireAdmin } from '@/components/auth/guards';
const links = [['/admin','Dashboard'],['/admin/pacientes','Pacientes'],['/admin/pacientes/novo','Novo paciente'],['/admin/profissionais','Profissionais'],['/admin/whatsapp','WhatsApp'],['/app','Área do paciente']];
export function AdminLayout({ children }: { children: React.ReactNode }) { return <RequireAdmin><main className="app-shell"><aside className="sidebar"><div className="brand-mark"><span className="brand-icon">A</span><span>Admin</span></div><nav className="menu">{links.map(([href,label]) => <a key={href} href={href}>{label}</a>)}<a href="/logout">Sair</a></nav></aside><section>{children}</section></main></RequireAdmin>; }
