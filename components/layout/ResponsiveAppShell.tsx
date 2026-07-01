'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';

type ResponsiveAppShellProps = {
  children: React.ReactNode;
  title: string;
  sidebarTitle: string;
  marker: string;
  links: string[][];
  profileHref: string;
  footerHref: string;
  footerLabel: string;
  className?: string;
  notice?: React.ReactNode;
  footer?: React.ReactNode;
};

const SIDEBAR_STATE_KEY = 'julha-sidebar-collapsed';

export function ResponsiveAppShell({ children, title, sidebarTitle, marker, links, profileHref, footerHref, footerLabel, className = '', notice, footer }: ResponsiveAppShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setIsSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STATE_KEY) === 'true');
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('has-open-drawer', isSidebarOpen);
    return () => document.body.classList.remove('has-open-drawer');
  }, [isSidebarOpen]);

  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed((current) => {
      const nextValue = !current;
      window.localStorage.setItem(SIDEBAR_STATE_KEY, String(nextValue));
      return nextValue;
    });
  }, []);

  return (
    <main className={`app-shell responsive-app-shell ${isSidebarCollapsed ? 'is-sidebar-collapsed' : ''} ${className}`.trim()}>
      <button className={`drawer-backdrop ${isSidebarOpen ? 'is-visible' : ''}`} type="button" aria-label="Fechar menu de navegação" onClick={() => setIsSidebarOpen(false)} />
      <AppSidebar
        title={sidebarTitle}
        marker={marker}
        links={links}
        profileHref={profileHref}
        footerHref={footerHref}
        footerLabel={footerLabel}
        collapsed={isSidebarCollapsed}
        mobileOpen={isSidebarOpen}
        onToggleCollapsed={toggleSidebarCollapsed}
        onNavigate={() => setIsSidebarOpen(false)}
      />
      <section className="content-shell responsive-content-shell">
        <AppHeader title={title} onMenuClick={() => setIsSidebarOpen(true)} />
        {notice}
        <div className="page-outlet responsive-page-outlet">{children}</div>
        {footer}
      </section>
    </main>
  );
}
