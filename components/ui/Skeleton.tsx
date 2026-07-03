export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function ShellSkeleton() {
  return <main className="app-shell shell-skeleton"><aside className="sidebar"><SkeletonBlock className="sk-brand" /><div className="stack"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></div></aside><section className="content-shell"><div className="app-header"><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-search" /><SkeletonBlock className="sk-action" /></div><RouteSkeleton /></section></main>;
}

export function RouteSkeleton() {
  return <section className="route-skeleton" aria-busy="true" aria-live="polite" aria-label="Carregando página"><div className="route-skeleton-header"><div><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-page-title" /><SkeletonBlock className="sk-page-copy" /></div><SkeletonBlock className="sk-action" /></div><section className="route-skeleton-metrics"><article className="card"><SkeletonBlock /><SkeletonBlock className="sk-metric" /></article><article className="card"><SkeletonBlock /><SkeletonBlock className="sk-metric" /></article><article className="card"><SkeletonBlock /><SkeletonBlock className="sk-metric" /></article></section><section className="route-skeleton-body"><article className="card route-skeleton-main"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><div className="route-skeleton-grid">{Array.from({ length: 6 }, (_, index) => <SkeletonBlock className="sk-tile" key={index} />)}</div></article><article className="card route-skeleton-side"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></article></section></section>;
}

export function CalendarSkeleton() {
  return <section className="calendar-layout is-calendar-only"><article className="card calendar-card"><div className="calendar-header"><div><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-page-copy" /></div><div className="calendar-nav"><SkeletonBlock className="sk-icon" /><SkeletonBlock className="sk-icon" /></div></div><div className="calendar-weekdays">{Array.from({ length: 7 }, (_, index) => <SkeletonBlock key={index} />)}</div><div className="calendar">{Array.from({ length: 35 }, (_, index) => <SkeletonBlock className="sk-day" key={index} />)}</div></article></section>;
}
