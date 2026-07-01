'use client';

import { useEffect, useState } from 'react';
import { accessContextLabels, useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/components/i18n/I18nProvider';
import { LanguageSwitcher } from './switchers/LanguageSwitcher';
import { ThemeSwitcher } from './switchers/ThemeSwitcher';

function getInitialIsDark() { if (typeof document === 'undefined') return false; return document.documentElement.dataset.theme === 'dark'; }

type HeaderProps = { title?: string; onMenuClick?: () => void };
type SharedHeaderProps = HeaderProps & { isDark: boolean; toggleTheme: () => void };

function HeaderControls({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) { return <div className="header-icon-actions"><ThemeSwitcher isDark={isDark} onToggle={toggleTheme} /><LanguageSwitcher /></div>; }

function DesktopTabletHeader({ title, isDark, toggleTheme }: SharedHeaderProps) {
  const { activeAccessContext, isSuperAdmin, user } = useAuth();
  const { t } = useI18n();
  const headerTitle = title ?? t('app.name');
  return <div className="header-desktop-tablet"><div className="header-title-group"><strong>🔎 {headerTitle}</strong></div><form className="platform-search" role="search" onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="platform-search">{t('header.searchLabel')}</label><input id="platform-search" name="search" type="search" placeholder={t('header.searchPlaceholder')} /></form><div className="header-actions">{isSuperAdmin && activeAccessContext ? <span className="user-chip context-chip">{t('nav.currentMode')}: {accessContextLabels[activeAccessContext]}</span> : null}<span className="user-chip user-name-chip">{user?.name ?? t('header.userFallback')}</span><HeaderControls isDark={isDark} toggleTheme={toggleTheme} /></div></div>;
}

function MobileHeader({ title, onMenuClick, isDark, toggleTheme }: SharedHeaderProps) {
  const { activeAccessContext, isSuperAdmin, user } = useAuth();
  const { t } = useI18n();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const headerTitle = title ?? t('app.name');
  useEffect(() => { function handleKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') { setIsSearchOpen(false); setIsUserMenuOpen(false); } } window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []);
  return <div className={`header-mobile ${isSearchOpen ? 'is-search-open' : ''}`.trim()}><div className="mobile-header-row"><div className="header-title-group">{onMenuClick ? <button className="mobile-menu-button" type="button" onClick={onMenuClick} aria-label={t('nav.openMenu')}><span aria-hidden="true">☰</span></button> : null}<strong>{headerTitle}</strong></div><div className="mobile-header-actions"><HeaderControls isDark={isDark} toggleTheme={toggleTheme} /><button className="icon-button mobile-search-button" type="button" aria-expanded={isSearchOpen} aria-controls="platform-search-mobile" aria-label={isSearchOpen ? t('header.closeSearch') : t('header.openSearch')} onClick={() => setIsSearchOpen((current) => !current)}>🔍</button><button className="avatar-menu-button" type="button" aria-expanded={isUserMenuOpen} aria-label={t('header.openUserMenu')} onClick={() => setIsUserMenuOpen((current) => !current)}>{(user?.name ?? t('header.userFallback')).charAt(0).toUpperCase()}</button></div></div><form className="platform-search mobile-platform-search" role="search" onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="platform-search-mobile">{t('header.searchLabel')}</label><input id="platform-search-mobile" name="search" type="search" placeholder={t('header.mobileSearchPlaceholder')} /></form><div className={`header-actions mobile-user-menu ${isUserMenuOpen ? 'is-open' : ''}`.trim()}>{isSuperAdmin && activeAccessContext ? <span className="user-chip context-chip">{t('nav.currentMode')}: {accessContextLabels[activeAccessContext]}</span> : null}<span className="user-chip user-name-chip">{user?.name ?? t('header.userFallback')}</span></div></div>;
}

export function AppHeader({ title, onMenuClick }: HeaderProps) {
  const [isDark, setIsDark] = useState(getInitialIsDark);
  useEffect(() => { const stored = window.localStorage.getItem('theme'); const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; const nextTheme = stored ?? (prefersDark ? 'dark' : 'light'); document.documentElement.dataset.theme = nextTheme; setIsDark(nextTheme === 'dark'); }, []);
  function toggleTheme() { const nextTheme = isDark ? 'light' : 'dark'; document.documentElement.dataset.theme = nextTheme; window.localStorage.setItem('theme', nextTheme); setIsDark(!isDark); }
  return <header className="app-header responsive-app-header"><DesktopTabletHeader title={title} isDark={isDark} toggleTheme={toggleTheme} /><MobileHeader title={title} onMenuClick={onMenuClick} isDark={isDark} toggleTheme={toggleTheme} /></header>;
}
