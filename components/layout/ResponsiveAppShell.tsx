'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';
import { TourProvider } from '@/components/tour/TourProvider';

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

const SIDEBAR_COLLAPSED_KEY = 'julha.sidebarCollapsed';

export function ResponsiveAppShell({ children, title, sidebarTitle, marker, links, profileHref, footerHref, footerLabel, className = '', notice, footer }: ResponsiveAppShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
  }, []);

  function toggleCollapsed() {
    setIsCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  }

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle('has-open-drawer', isSidebarOpen);

    if (!isSidebarOpen) {
      return () => document.body.classList.remove('has-open-drawer');
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('has-open-drawer');
    };
  }, [isSidebarOpen]);

  return (
    <TourProvider>
      <main className={`app-shell responsive-app-shell ${isCollapsed ? 'is-sidebar-collapsed' : ''} ${className}`.trim()}>
        <button className={`drawer-backdrop ${isSidebarOpen ? 'is-visible' : ''}`} type="button" aria-label="Fechar menu de navegação" onClick={() => setIsSidebarOpen(false)} />
        <AppSidebar
          title={sidebarTitle}
          marker={marker}
          links={links}
          profileHref={profileHref}
          footerHref={footerHref}
          footerLabel={footerLabel}
          mobileOpen={isSidebarOpen}
          onNavigate={() => setIsSidebarOpen(false)}
          collapsed={isCollapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <section className="content-shell responsive-content-shell">
          <AppHeader title={title} links={links} onMenuClick={() => setIsSidebarOpen(true)} />
          {notice}
          <div className="page-outlet responsive-page-outlet">{children}</div>
          {footer}
        </section>
      </main>
    </TourProvider>
  );
}
