'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export function AppHeader({ title = 'Julha Saúde' }: { title?: string }) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = stored ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = nextTheme;
    setIsDark(nextTheme === 'dark');
  }, []);

  function toggleTheme() {
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('theme', nextTheme);
    setIsDark(!isDark);
  }

  return (
    <header className="app-header">
      <div>
        <span className="eyebrow">Workspace</span>
        <strong>{title}</strong>
      </div>
      <form className="platform-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="platform-search">Buscar na plataforma</label>
        <input id="platform-search" name="search" type="search" placeholder="Buscar pacientes, relatórios, planos..." />
      </form>
      <div className="header-actions">
        <span className="user-chip">{user?.name ?? 'Usuário'}</span>
        <button className="button secondary theme-toggle" type="button" onClick={toggleTheme} aria-pressed={isDark}>
          {isDark ? 'Tema light' : 'Tema dark'}
        </button>
      </div>
    </header>
  );
}
