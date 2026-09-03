'use client';

import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';
import { LanguageSwitcher } from './switchers/LanguageSwitcher';
import { NotificationBell } from './switchers/NotificationBell';
import { ThemeSwitcher } from './switchers/ThemeSwitcher';
import { TourButton } from '@/components/tour/TourButton';
import { SupportButton } from '@/components/support/SupportButton';

function getInitialIsDark() { if (typeof document === 'undefined') return false; return document.documentElement.dataset.theme === 'dark'; }
type HeaderProps = { title?: string; onMenuClick?: () => void };
type SharedHeaderProps = HeaderProps & { isDark: boolean; toggleTheme: () => void };
function HeaderControls({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) { return <div className="header-icon-actions"><TourButton /><SupportButton /><NotificationBell /><ThemeSwitcher isDark={isDark} onToggle={toggleTheme} /><LanguageSwitcher /></div>; }

function PlatformSearch({ mobile = false }: { mobile?: boolean }) {
  const { t } = useI18n(); const pathname = usePathname(); const router = useRouter(); const [query, setQuery] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const value = query.trim(); if (!value) return; const destination = pathname.startsWith('/professional') ? '/professional/patients' : pathname.startsWith('/admin') ? '/admin/pacientes' : '/patients'; router.push(`${destination}?query=${encodeURIComponent(value)}` as never); }
  const id = mobile ? 'platform-search-mobile' : 'platform-search';
  return <form className={`platform-search ${mobile ? 'mobile-platform-search' : ''}`.trim()} role="search" onSubmit={submit}><label className="sr-only" htmlFor={id}>{t('header.searchLabel')}</label><input id={id} name="search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mobile ? t('header.mobileSearchPlaceholder') : t('header.searchPlaceholder')} /><button className="platform-search-submit" type="submit">Buscar</button></form>;
}
function DesktopTabletHeader({ isDark, toggleTheme }: SharedHeaderProps) { return <div className="header-desktop-tablet"><PlatformSearch /><div className="header-actions"><HeaderControls isDark={isDark} toggleTheme={toggleTheme} /></div></div>; }
function MobileHeader({ onMenuClick, isDark, toggleTheme }: SharedHeaderProps) { const { t } = useI18n(); const [isSearchOpen, setIsSearchOpen] = useState(false); useEffect(() => { function handleKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') setIsSearchOpen(false); } window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []); return <div className={`header-mobile ${isSearchOpen ? 'is-search-open' : ''}`.trim()}><div className="mobile-header-row"><div className="header-title-group">{onMenuClick ? <button className="mobile-menu-button" type="button" onClick={onMenuClick} aria-label={t('nav.openMenu')}><span aria-hidden="true">☰</span></button> : null}</div><div className="mobile-header-actions"><HeaderControls isDark={isDark} toggleTheme={toggleTheme} /><button className="icon-button mobile-search-button" type="button" aria-expanded={isSearchOpen} aria-controls="platform-search-mobile" aria-label={isSearchOpen ? t('header.closeSearch') : t('header.openSearch')} onClick={() => setIsSearchOpen((current) => !current)}>🔍</button></div></div><PlatformSearch mobile /></div>; }
export function AppHeader({ title, onMenuClick }: HeaderProps) { const [isDark, setIsDark] = useState(getInitialIsDark); useEffect(() => { const stored = window.localStorage.getItem('theme'); const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; const nextTheme = stored ?? (prefersDark ? 'dark' : 'light'); document.documentElement.dataset.theme = nextTheme; setIsDark(nextTheme === 'dark'); }, []); function toggleTheme() { const nextTheme = isDark ? 'light' : 'dark'; document.documentElement.dataset.theme = nextTheme; window.localStorage.setItem('theme', nextTheme); setIsDark(!isDark); } return <header className="app-header responsive-app-header"><DesktopTabletHeader title={title} isDark={isDark} toggleTheme={toggleTheme} /><MobileHeader title={title} onMenuClick={onMenuClick} isDark={isDark} toggleTheme={toggleTheme} /></header>; }
