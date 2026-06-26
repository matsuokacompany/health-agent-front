export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function ShellSkeleton() {
  return <main className="app-shell shell-skeleton"><aside className="sidebar"><SkeletonBlock className="sk-brand" /><div className="stack"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></div></aside><section className="content-shell"><div className="app-header"><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-search" /><SkeletonBlock className="sk-action" /></div><section className="grid priority-grid"><article className="card"><SkeletonBlock /><SkeletonBlock className="sk-metric" /></article><article className="card"><SkeletonBlock /><SkeletonBlock className="sk-metric" /></article><article className="card"><SkeletonBlock /><SkeletonBlock className="sk-metric" /></article></section></section></main>;
}

export function CalendarSkeleton() {
  return <section className="calendar-layout"><article className="card calendar-card"><div className="calendar">{Array.from({ length: 28 }, (_, index) => <SkeletonBlock className="sk-day" key={index} />)}</div></article><article className="card"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></article></section>;
}
