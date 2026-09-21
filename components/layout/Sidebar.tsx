'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartBar, Users, User, ClipboardText, Broadcast, FileText, Sparkle, UsersThree, UserPlus,
  Stethoscope, WhatsappLogo, House, PushPin, GearSix, CreditCard, Heartbeat, SignOut, Circle,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import { TourButton } from '@/components/tour/TourButton';

// Brazilian convention: address people by their first name, not a full name
// or a generic "Perfil" label -- the button still links to the same profile
// page, this only changes what's shown.
function firstName(fullName: string | undefined | null): string | null {
  const trimmed = fullName?.trim();
  return trimmed ? trimmed.split(/\s+/)[0] : null;
}

const icons: Record<string, PhosphorIcon> = {
  Dashboard: ChartBar,
  Usuários: Users,
  Perfil: User,
  Anamnese: ClipboardText,
  Anamnesis: ClipboardText,
  Monitoramento: Broadcast,
  Monitoring: Broadcast,
  Monitoreo: Broadcast,
  Relatórios: FileText,
  Reports: FileText,
  Insights: Sparkle,
  Pacientes: UsersThree,
  'Novo paciente': UserPlus,
  Profissionais: Stethoscope,
  WhatsApp: WhatsappLogo,
  'Área do paciente': House,
  Paciente: House,
  Resumo: PushPin,
  Configurações: GearSix,
  Assinatura: CreditCard,
  Subscription: CreditCard,
  Suscripción: CreditCard,
  Informes: FileText,
  Automonitoramento: Heartbeat,
  'Self-monitoring': Heartbeat,
  Automonitoreo: Heartbeat,
};

type AppSidebarProps = {
  title: string;
  marker: string;
  links: string[][];
  profileHref: string;
  footerHref: string;
  footerLabel: string;
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export function AppSidebar({ title, marker, links, profileHref, footerHref, footerLabel, mobileOpen = false, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { user } = useAuth();
  const profileLabel = firstName(user?.name) ?? t('nav.profile');
  return <aside className={`sidebar app-sidebar ${mobileOpen ? 'is-open' : ''}`.trim()} aria-label={t('nav.mainMenu')}>
    <div className="brand-mark sidebar-brand">
      <div className="sidebar-brand-main">
        <span className="sidebar-logo-slot">
          <img className="brand-logo-light" src="/brand/julha-logo-light.png" alt="Julha" />
          <img className="brand-logo-dark" src="/brand/julha-logo-dark.png" alt="Julha" />
        </span>
        <span className="sidebar-label">{title}</span>
      </div>
    </div>
    <nav className="menu" aria-label={t('nav.mainMenu')} data-tour="sidebar-nav">
      {links.map(([href,label]) => { const Icon = icons[label] ?? Circle; return <Link className={pathname === href ? 'is-current' : ''} key={href} href={href as never} onClick={onNavigate} title={label}><Icon aria-hidden="true" size={20} weight="bold" /><span className="sidebar-label">{label}</span></Link>; })}
    </nav>
    <div className="sidebar-actions">
      <TourButton />
      <Link className="nav-action" href={profileHref as never} onClick={onNavigate} title={t('nav.profile')}><User aria-hidden="true" size={20} weight="bold" /><span className="sidebar-label">{profileLabel}</span></Link>
      <Link className="nav-action" href={footerHref as never} onClick={onNavigate} title={footerLabel}><SignOut aria-hidden="true" size={20} weight="bold" /><span className="sidebar-label">{footerLabel}</span></Link>
    </div>
  </aside>;
}
