export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function ShellSkeleton() {
  return <main className="app-shell shell-skeleton"><aside className="sidebar"><SkeletonBlock className="sk-brand" /><div className="stack"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></div></aside><section className="content-shell"><div className="app-header"><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-search" /><SkeletonBlock className="sk-action" /></div><RouteSkeleton /></section></main>;
}

/** Generic fallback for Next's route-level loading.tsx — it stands in for
 * whichever page is being navigated to, and a single route segment (e.g.
 * /admin, /professional, /patient) can cover pages as different as a plain
 * redirect, a form, or an actual dashboard. Deliberately kept to a neutral
 * header + a couple of card blocks rather than a specific dashboard shape
 * (metrics row, tile grid) that would be wrong for most of those pages. */
export function RouteSkeleton() {
  return <section className="route-skeleton" aria-busy="true" aria-live="polite" aria-label="Carregando página">
    <div className="route-skeleton-header"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-page-title" /><SkeletonBlock className="sk-page-copy" /></div>
    <article className="card"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></article>
    <article className="card"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></article>
  </section>;
}

export function CalendarSkeleton() {
  return <section className="calendar-layout is-calendar-only"><article className="card calendar-card"><div className="calendar-header"><div><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-page-copy" /></div><div className="calendar-nav"><SkeletonBlock className="sk-icon" /><SkeletonBlock className="sk-icon" /></div></div><div className="calendar-weekdays">{Array.from({ length: 7 }, (_, index) => <SkeletonBlock key={index} />)}</div><div className="calendar">{Array.from({ length: 35 }, (_, index) => <SkeletonBlock className="sk-day" key={index} />)}</div></article></section>;
}
