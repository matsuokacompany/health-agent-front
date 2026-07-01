'use client';

import { useEffect, useState } from 'react';
import { accessContextLabels, useAuth } from '@/components/auth/AuthProvider';

function getInitialIsDark() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.theme === 'dark';
}

type HeaderProps = {
  title?: string;
  onMenuClick?: () => void;
};

type SharedHeaderProps = HeaderProps & {
  isDark: boolean;
  toggleTheme: () => void;
};

function DesktopTabletHeader({ title = 'Julha Saúde', isDark, toggleTheme }: SharedHeaderProps) {
  const { activeAccessContext, isSuperAdmin, user } = useAuth();

  return (
    <div className="header-desktop-tablet">
      <div className="header-title-group">
        <strong>🔎 {title}</strong>
      </div>
      <form className="platform-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="platform-search">Buscar na plataforma</label>
        <input id="platform-search" name="search" type="search" placeholder="🔎 Buscar pacientes, relatórios, planos..." />
      </form>
      <div className="header-actions">
        {isSuperAdmin && activeAccessContext ? <span className="user-chip context-chip">Modo atual: {accessContextLabels[activeAccessContext]}</span> : null}
        <span className="user-chip user-name-chip">{user?.name ?? 'Usuário'}</span>
        <button className="button secondary theme-toggle" type="button" onClick={toggleTheme} aria-pressed={isDark} aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
    </div>
  );
}

function MobileHeader({ title = 'Julha Saúde', onMenuClick, isDark, toggleTheme }: SharedHeaderProps) {
  const { activeAccessContext, isSuperAdmin, user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`header-mobile ${isSearchOpen ? 'is-search-open' : ''}`.trim()}>
      <div className="mobile-header-row">
        <div className="header-title-group">
          {onMenuClick ? <button className="mobile-menu-button" type="button" onClick={onMenuClick} aria-label="Abrir menu de navegação"><span aria-hidden="true">☰</span></button> : null}
          <strong>{title}</strong>
        </div>
        <div className="mobile-header-actions">
          <button className="icon-button mobile-search-button" type="button" aria-expanded={isSearchOpen} aria-controls="platform-search-mobile" aria-label={isSearchOpen ? 'Fechar busca' : 'Abrir busca'} onClick={() => setIsSearchOpen((current) => !current)}>🔍</button>
          <button className="avatar-menu-button" type="button" aria-expanded={isUserMenuOpen} aria-label="Abrir menu do usuário" onClick={() => setIsUserMenuOpen((current) => !current)}>{(user?.name ?? 'U').charAt(0).toUpperCase()}</button>
        </div>
      </div>
      <form className="platform-search mobile-platform-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="platform-search-mobile">Buscar na plataforma</label>
        <input id="platform-search-mobile" name="search" type="search" placeholder="Buscar..." />
      </form>
      <div className={`header-actions mobile-user-menu ${isUserMenuOpen ? 'is-open' : ''}`.trim()}>
        {isSuperAdmin && activeAccessContext ? <span className="user-chip context-chip">Modo atual: {accessContextLabels[activeAccessContext]}</span> : null}
        <span className="user-chip user-name-chip">{user?.name ?? 'Usuário'}</span>
        <button className="button secondary theme-toggle" type="button" onClick={toggleTheme} aria-pressed={isDark} aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
    </div>
  );
}

export function AppHeader({ title = 'Julha Saúde', onMenuClick }: HeaderProps) {
  const [isDark, setIsDark] = useState(getInitialIsDark);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = stored ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = nextTheme;
    setIsDark(nextTheme === 'dark');
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function toggleTheme() {
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('theme', nextTheme);
    setIsDark(!isDark);
  }

  return (
    <header className="app-header responsive-app-header">
      <DesktopTabletHeader title={title} isDark={isDark} toggleTheme={toggleTheme} />
      <MobileHeader title={title} onMenuClick={onMenuClick} isDark={isDark} toggleTheme={toggleTheme} />
    </header>
  );
}
