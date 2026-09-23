'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartBar, Users, User, ClipboardText, Broadcast, FileText, Sparkle, UsersThree, UserPlus,
  Stethoscope, WhatsappLogo, House, PushPin, GearSix, CreditCard, Circle,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { ProfileMenu } from './ProfileMenu';
import { TourButton } from '@/components/tour/TourButton';

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
};

// Each module keeps a distinct accent color on its icon (see .icon-* in
// globals.css) so the nav reads as a set of distinct places, not one flat
// gray list -- utility items (Perfil, Resumo, Configurações) stay neutral
// on purpose, color is reserved for the sections a person actually visits.
const iconColors: Record<string, string> = {
  Dashboard: 'icon-blue',
  Usuários: 'icon-cyan',
  Anamnese: 'icon-amber',
  Anamnesis: 'icon-amber',
  Monitoramento: 'icon-teal',
  Monitoring: 'icon-teal',
  Monitoreo: 'icon-teal',
  Relatórios: 'icon-indigo',
  Reports: 'icon-indigo',
  Informes: 'icon-indigo',
  Insights: 'icon-purple',
  Pacientes: 'icon-green',
  'Novo paciente': 'icon-orange',
  Profissionais: 'icon-pink',
  WhatsApp: 'icon-whatsapp',
  'Área do paciente': 'icon-sky',
  Paciente: 'icon-sky',
  Assinatura: 'icon-gold',
  Subscription: 'icon-gold',
  Suscripción: 'icon-gold',
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
      {links.map(([href,label]) => { const Icon = icons[label] ?? Circle; return <Link className={pathname === href ? 'is-current' : ''} key={href} href={href as never} onClick={onNavigate} title={label}><Icon aria-hidden="true" size={20} weight="duotone" className={iconColors[label]} /><span className="sidebar-label">{label}</span></Link>; })}
    </nav>
    <div className="sidebar-actions">
      <TourButton />
      <ProfileMenu profileHref={profileHref} footerHref={footerHref} footerLabel={footerLabel} onNavigate={onNavigate} />
    </div>
  </aside>;
}
