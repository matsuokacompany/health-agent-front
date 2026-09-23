'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { List, MagnifyingGlass } from '@phosphor-icons/react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { LanguageSwitcher } from './switchers/LanguageSwitcher';
import { NotificationBell } from './switchers/NotificationBell';
import { ThemeSwitcher } from './switchers/ThemeSwitcher';
import { SupportButton } from '@/components/support/SupportButton';
import { useBreadcrumbTrail } from './BreadcrumbTrail';

function getInitialIsDark() { if (typeof document === 'undefined') return false; return document.documentElement.dataset.theme === 'dark'; }
type HeaderProps = { title?: string; onMenuClick?: () => void; links?: string[][] };
type SharedHeaderProps = HeaderProps & { isDark: boolean; toggleTheme: () => void; showSearch: boolean };
function HeaderControls({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) { return <div className="header-icon-actions"><SupportButton /><NotificationBell /><ThemeSwitcher isDark={isDark} onToggle={toggleTheme} /><LanguageSwitcher /></div>; }

/** The section a nav link's href matches (longest-prefix wins), plus
 * whether the current path is exactly that link (the section's own index)
 * or a page nested under it -- a nested page gets a generic trailing
 * crumb since there's no per-page title to show here. */
function useBreadcrumb(links: string[][]) {
  const pathname = usePathname();
  const sorted = [...links].sort((a, b) => b[0].length - a[0].length);
  const match = sorted.find(([href]) => pathname === href || pathname.startsWith(`${href}/`));
  if (!match) return null;
  const [href, label] = match;
  return { href, label, isLeaf: pathname === href };
}

function Breadcrumbs({ links }: { links: string[][] }) {
  const { t } = useI18n();
  const crumb = useBreadcrumb(links);
  const trail = useBreadcrumbTrail();
  if (!crumb) return null;
  if (crumb.isLeaf) {
    return <nav className="breadcrumbs header-breadcrumbs" aria-label="Breadcrumb"><span aria-current="page">{crumb.label}</span></nav>;
  }
  // A nested page with real identity of its own (e.g. a specific patient,
  // then which former tab is open) registers a richer trail via
  // useSetBreadcrumbTrail; otherwise fall back to a generic "Detalhes" leaf.
  const segments = trail?.length ? trail : [{ label: t('nav.details') }];
  return <nav className="breadcrumbs header-breadcrumbs" aria-label="Breadcrumb">
    <Link href={crumb.href as never}>{crumb.label}</Link>
    {segments.map((segment, index) => (
      <span className="breadcrumb-segment" key={`${segment.label}-${index}`}>
        <span aria-hidden="true">/</span>
        {segment.href && index < segments.length - 1 ? <Link href={segment.href as never}>{segment.label}</Link> : <span aria-current="page">{segment.label}</span>}
      </span>
    ))}
  </nav>;
}

function PlatformSearch({ mobile = false }: { mobile?: boolean }) {
  const { t } = useI18n(); const pathname = usePathname(); const router = useRouter(); const [query, setQuery] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const value = query.trim(); if (!value) return; const destination = pathname.startsWith('/professional') ? '/professional/patients' : '/admin/pacientes'; router.push(`${destination}?query=${encodeURIComponent(value)}` as never); }
  const id = mobile ? 'platform-search-mobile' : 'platform-search';
  return <form className={`platform-search ${mobile ? 'mobile-platform-search' : ''}`.trim()} role="search" onSubmit={submit}><label className="sr-only" htmlFor={id}>{t('header.searchLabel')}</label>{mobile ? <MagnifyingGlass className="platform-search-icon" aria-hidden="true" weight="duotone" /> : null}<input id={id} name="search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mobile ? t('header.mobileSearchPlaceholder') : t('header.searchPlaceholder')} /><button className="platform-search-submit" type="submit">Buscar</button></form>;
}
function DesktopTabletHeader({ isDark, toggleTheme, showSearch, links }: SharedHeaderProps) { return <div className="header-desktop-tablet">{links ? <Breadcrumbs links={links} /> : null}{showSearch ? <PlatformSearch /> : null}<div className="header-actions"><HeaderControls isDark={isDark} toggleTheme={toggleTheme} /></div></div>; }
function MobileHeader({ onMenuClick, isDark, toggleTheme, showSearch }: SharedHeaderProps) { const { t } = useI18n(); const [isSearchOpen, setIsSearchOpen] = useState(false); useEffect(() => { function handleKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') setIsSearchOpen(false); } window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []); return <div className={`header-mobile ${isSearchOpen ? 'is-search-open' : ''}`.trim()}><div className="mobile-header-row"><div className="header-title-group">{onMenuClick ? <button className="mobile-menu-button" type="button" onClick={onMenuClick} aria-label={t('nav.openMenu')}><List aria-hidden="true" size={20} weight="duotone" /></button> : null}</div><div className="mobile-header-actions"><HeaderControls isDark={isDark} toggleTheme={toggleTheme} />{showSearch ? <button className="icon-button mobile-search-button" type="button" aria-expanded={isSearchOpen} aria-controls="platform-search-mobile" aria-label={isSearchOpen ? t('header.closeSearch') : t('header.openSearch')} onClick={() => setIsSearchOpen((current) => !current)}><MagnifyingGlass aria-hidden="true" size={18} weight="duotone" /></button> : null}</div></div>{showSearch ? <PlatformSearch mobile /> : null}</div>; }
export function AppHeader({ title, onMenuClick, links }: HeaderProps) {
  const pathname = usePathname();
  // Patients have nothing to search from here -- the search box only ever
  // routes to a professional/admin patient list, so it's hidden entirely
  // outside those two portals rather than submitting somewhere unrelated.
  const showSearch = pathname.startsWith('/professional') || pathname.startsWith('/admin');
  const [isDark, setIsDark] = useState(getInitialIsDark);
  useEffect(() => { const stored = window.localStorage.getItem('theme'); const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; const nextTheme = stored ?? (prefersDark ? 'dark' : 'light'); document.documentElement.dataset.theme = nextTheme; setIsDark(nextTheme === 'dark'); }, []);
  function toggleTheme() { const nextTheme = isDark ? 'light' : 'dark'; document.documentElement.dataset.theme = nextTheme; window.localStorage.setItem('theme', nextTheme); setIsDark(!isDark); }
  return <header className="app-header responsive-app-header"><DesktopTabletHeader title={title} links={links} isDark={isDark} toggleTheme={toggleTheme} showSearch={showSearch} /><MobileHeader title={title} onMenuClick={onMenuClick} isDark={isDark} toggleTheme={toggleTheme} showSearch={showSearch} /></header>;
}
