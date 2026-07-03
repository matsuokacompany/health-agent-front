'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  return <aside className={`sidebar app-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`.trim()} aria-label={t('nav.mainMenu')}>
    <div className="brand-mark sidebar-brand">
      <div className="sidebar-brand-main">
        <span className="brand-icon sidebar-logo-slot" aria-label="Espaço para logo da Julha">{marker}</span>
        <span className="sidebar-label">{title}</span>
      </div>
      {onToggleCollapsed ? <button className="sidebar-collapse-button" type="button" onClick={onToggleCollapsed} aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} aria-pressed={collapsed}>{collapsed ? '→' : '←'}</button> : null}
    </div>
    <nav className="menu" aria-label={t('nav.mainMenu')}>
      {links.map(([href,label]) => <Link className={pathname === href ? 'is-current' : ''} key={href} href={href as never} onClick={onNavigate} title={label}><span aria-hidden="true">{icons[label] ?? '•'}</span><span className="sidebar-label">{label}</span></Link>)}
    </nav>
    <div className="sidebar-actions">
      <Link className="nav-action" href={profileHref as never} onClick={onNavigate} title={t('nav.profile')}><span aria-hidden="true">👤</span><span className="sidebar-label">{t('nav.profile')}</span></Link>
      {isSuperAdmin ? <Link className="nav-action" href="/choose-context" onClick={onNavigate} title={t('nav.switchEnvironment')}><span aria-hidden="true">🔁</span><span className="sidebar-label">{t('nav.switchEnvironment')}</span></Link> : null}
      <Link className="nav-action" href={footerHref as never} onClick={onNavigate} title={footerLabel}><span aria-hidden="true">🚪</span><span className="sidebar-label">{footerLabel}</span></Link>
    </div>
  </aside>;
}
