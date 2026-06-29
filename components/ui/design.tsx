import Link from 'next/link';
import type { ReactNode } from 'react';

type ButtonProps = { children: ReactNode; href?: string; variant?: 'primary' | 'secondary' | 'ghost'; type?: 'button' | 'submit'; disabled?: boolean };

export function Button({ children, href, variant = 'primary', type = 'button', disabled }: ButtonProps) {
  const className = `button ${variant === 'primary' ? '' : variant}`.trim();
  if (href) return <Link className={className} href={href as never}>{children}</Link>;
  return <button className={className} type={type} disabled={disabled}>{children}</button>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-header"><div><span className="eyebrow">{eyebrow ?? 'Julha Saúde'}</span><h1>{title}</h1>{description ? <p className="muted">{description}</p> : null}</div>{action ? <div className="page-actions">{action}</div> : null}</header>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <article className={`card ${className}`.trim()}>{children}</article>;
}

export function MetricCard({ label, value, description }: { label: string; value: ReactNode; description?: string }) {
  return <Card><span className="metric-label">{label}</span><div className="metric">{value}</div>{description ? <p className="muted compact">{description}</p> : null}</Card>;
}
