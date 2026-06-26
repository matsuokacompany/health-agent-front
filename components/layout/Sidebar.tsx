'use client';
import { usePathname } from 'next/navigation';

export function AppSidebar({ title, marker, links, footerHref, footerLabel }: { title: string; marker: string; links: string[][]; footerHref: string; footerLabel: string }) {
  const pathname = usePathname();
  return <aside className="sidebar"><div className="brand-mark"><span className="brand-icon">{marker}</span><span>{title}</span></div><nav className="menu" aria-label="Navegação principal">{links.map(([href,label]) => <a className={pathname === href ? 'is-current' : ''} key={href} href={href}>{label}</a>)}<a href={footerHref}>{footerLabel}</a></nav></aside>;
}
