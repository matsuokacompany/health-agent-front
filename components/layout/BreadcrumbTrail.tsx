'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type BreadcrumbSegment = { label: string; href?: string };
type BreadcrumbTrailContextValue = { trail: BreadcrumbSegment[] | null; setTrail: (trail: BreadcrumbSegment[] | null) => void };

const BreadcrumbTrailContext = createContext<BreadcrumbTrailContextValue | null>(null);

export function BreadcrumbTrailProvider({ children }: { children: ReactNode }) {
  const [trail, setTrail] = useState<BreadcrumbSegment[] | null>(null);
  return <BreadcrumbTrailContext.Provider value={{ trail, setTrail }}>{children}</BreadcrumbTrailContext.Provider>;
}

function useBreadcrumbTrailContext() {
  const context = useContext(BreadcrumbTrailContext);
  if (!context) throw new Error('useBreadcrumbTrail must be used inside BreadcrumbTrailProvider');
  return context;
}

/** The header's generic breadcrumb only knows a page's top-level section
 * (e.g. "Pacientes") -- a nested page with a real identity of its own
 * (a specific patient's name, then which of its former tabs is open) calls
 * this to replace the header's generic trailing "Detalhes" crumb with real
 * segments. Clears itself on unmount so navigating to an unrelated page
 * never leaves a stale trail behind. */
export function useSetBreadcrumbTrail(segments: BreadcrumbSegment[] | null) {
  const { setTrail } = useBreadcrumbTrailContext();
  const key = segments ? JSON.stringify(segments) : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setTrail(key ? (JSON.parse(key) as BreadcrumbSegment[]) : null);
    return () => setTrail(null);
  }, [setTrail, key]);
}

export function useBreadcrumbTrail() {
  return useBreadcrumbTrailContext().trail;
}
