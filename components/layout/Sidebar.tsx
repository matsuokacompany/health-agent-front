'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/components/auth/AuthProvider';

const icons: Record<string, string> = {
  Dashboard: '📊',
  Perfil: '👤',
  Anamnese: '📝',
  Monitoramento: '📡',
  Relatórios: '📄',
  Insights: '✨',
  Pacientes: '🧑‍🤝‍🧑',
  'Novo paciente': '➕',
  Profissionais: '⚕️',
  WhatsApp: '💬',
  'Área do paciente': '🏠',
  Resumo: '📌',
  Configurações: '⚙️',
};

export function AppSidebar({ title, marker, links, profileHref, footerHref, footerLabel }: { title: string; marker: string; links: string[][]; profileHref: string; footerHref: string; footerLabel: string }) {
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  return <aside className="sidebar"><div className="brand-mark"><span className="brand-icon">{marker}</span><span>{title}</span></div><nav className="menu" aria-label="Navegação principal">{links.map(([href,label]) => <a className={pathname === href ? 'is-current' : ''} key={href} href={href}><span aria-hidden="true">{icons[label] ?? '•'}</span>{label}</a>)}</nav><div className="sidebar-actions"><button className="nav-action" type="button" onClick={() => setShowProfile(true)}>👤 Perfil</button>{isSuperAdmin ? <a className="nav-action" href="/choose-context">🔁 Trocar ambiente</a> : null}<button className="nav-action" type="button" onClick={() => setShowLogout(true)}>🚪 {footerLabel}</button></div><Modal open={showProfile} title="Perfil e conta" onClose={() => setShowProfile(false)}><div className="stack"><p className="muted">Acesse rapidamente suas configurações sem perder o contexto atual.</p><a className="button" href={profileHref}>👤 Abrir perfil completo</a><a className="button secondary" href="/change-password">🔐 Alterar senha</a></div></Modal><Modal open={showLogout} title="Confirmar saída" onClose={() => setShowLogout(false)}><p className="muted">Confirme para encerrar a sessão neste dispositivo.</p><div className="page-actions"><button className="button secondary" type="button" onClick={() => setShowLogout(false)}>Cancelar</button><a className="button" href={footerHref}>🚪 Sair com segurança</a></div></Modal></aside>;
}
