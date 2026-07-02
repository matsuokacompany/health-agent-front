import type { ReactNode } from 'react';
import { Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';

export function DashboardSection({ title, eyebrow, loading, children, className = '', skeletonLines = 3 }: { title: string; eyebrow?: string; loading?: boolean; children: ReactNode; className?: string; skeletonLines?: number }) {
  return <Card className={`patient-dashboard-card patient-dashboard-section ${className}`.trim()}>{eyebrow ? <span className="eyebrow patient-card-eyebrow">{eyebrow}</span> : null}<h2>{title}</h2>{loading ? <div className="patient-local-skeleton">{Array.from({ length: skeletonLines }, (_, index) => <SkeletonBlock key={index} className={index === 0 ? 'sk-title' : ''} />)}</div> : children}</Card>;
}
