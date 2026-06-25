'use client';
import { RequireAuth } from '@/components/auth/guards';
const links = [['/app','Dashboard'],['/app/perfil','Perfil'],['/app/anamnese','Anamnese'],['/app/monitoramento','Monitoramento'],['/app/relatorios','Relatórios'],['/app/insights','Insights']];
export function AppLayout({ children }: { children: React.ReactNode }) { return <RequireAuth><main className="app-shell"><aside className="sidebar"><div className="brand-mark"><span className="brand-icon">+</span><span>Julha Saúde</span></div><nav className="menu">{links.map(([href,label]) => <a key={href} href={href}>{label}</a>)}<a href="/logout">Sair</a></nav></aside><section>{children}</section></main></RequireAuth>; }
