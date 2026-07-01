'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/components/i18n/I18nProvider';

const icons: Record<string, string> = {
  Dashboard: '📊',
  Perfil: '👤',
  Anamnese: '📝',
  Anamnesis: '📝',
  Monitoramento: '📡',
  Monitoring: '📡',
  Monitoreo: '📡',
  Relatórios: '📄',
  Insights: '✨',
  Pacientes: '🧑‍🤝‍🧑',
  'Novo paciente': '➕',
  Profissionais: '⚕️',
  WhatsApp: '💬',
  'Área do paciente': '🏠',
  Paciente: '🏠',
  Resumo: '📌',
  Configurações: '⚙️',
};

type AppSidebarProps = {
  title: string;
  marker: string;
  links: string[][];
  profileHref: string;
  footerHref: string;
  footerLabel: string;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
};

export function AppSidebar({ title, marker, links, profileHref, footerHref, footerLabel, collapsed = false, mobileOpen = false, onToggleCollapsed, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();
  const { t } = useI18n();
  const [showProfile, setShowProfile] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  return <aside className={`sidebar app-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`.trim()} aria-label={t('nav.mainMenu')}>
    <div className="brand-mark sidebar-brand">
      <span className="brand-icon">{marker}</span>
      <span className="sidebar-label">{title}</span>
      {onToggleCollapsed ? <button className="sidebar-collapse-button" type="button" onClick={onToggleCollapsed} aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} aria-pressed={collapsed}>{collapsed ? '→' : '←'}</button> : null}
    </div>
    <nav className="menu" aria-label={t('nav.mainMenu')}>
      {links.map(([href,label]) => <Link className={pathname === href ? 'is-current' : ''} key={href} href={href as never} onClick={onNavigate} title={label}><span aria-hidden="true">{icons[label] ?? '•'}</span><span className="sidebar-label">{label}</span></Link>)}
    </nav>
    <div className="sidebar-actions">
      <button className="nav-action" type="button" onClick={() => setShowProfile(true)} title={t('nav.profile')}><span aria-hidden="true">👤</span><span className="sidebar-label">{t('nav.profile')}</span></button>
      {isSuperAdmin ? <Link className="nav-action" href="/choose-context" onClick={onNavigate} title={t('nav.switchEnvironment')}><span aria-hidden="true">🔁</span><span className="sidebar-label">{t('nav.switchEnvironment')}</span></Link> : null}
      <button className="nav-action" type="button" onClick={() => setShowLogout(true)} title={footerLabel}><span aria-hidden="true">🚪</span><span className="sidebar-label">{footerLabel}</span></button>
    </div>
    <Modal open={showProfile} title="Perfil e conta" onClose={() => setShowProfile(false)}><div className="stack"><p className="muted">Acesse rapidamente suas configurações sem perder o contexto atual.</p><Link className="button" href={profileHref as never} onClick={onNavigate}>👤 Abrir perfil completo</Link><Link className="button secondary" href="/change-password" onClick={onNavigate}>🔐 Alterar senha</Link></div></Modal>
    <Modal open={showLogout} title="Confirmar saída" onClose={() => setShowLogout(false)}><p className="muted">Confirme para encerrar a sessão neste dispositivo.</p><div className="page-actions"><button className="button secondary" type="button" onClick={() => setShowLogout(false)}>Cancelar</button><Link className="button" href={footerHref as never} onClick={onNavigate}>🚪 Sair com segurança</Link></div></Modal>
  </aside>;
}
