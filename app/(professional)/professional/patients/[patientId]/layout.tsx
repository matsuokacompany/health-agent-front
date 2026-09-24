'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { use, useEffect, useRef } from 'react';
import { useProfessionalDashboard } from '@/hooks/useProfessional';
import { useSetBreadcrumbTrail } from '@/components/layout/BreadcrumbTrail';
import { ErrorState } from '@/components/ui/states';
import { ClipboardText, ChatCircleText, Stethoscope, Sparkle, Images } from '@phosphor-icons/react';

type PatientSection = { href: string; label: string; icon: React.ReactNode };

function sections(patientId: string): PatientSection[] {
  const base = `/professional/patients/${patientId}`;
  return [
    { href: base, label: 'Visão geral', icon: <ClipboardText aria-hidden="true" weight="duotone" /> },
    { href: `${base}/checkins`, label: 'Check-ins', icon: <ChatCircleText aria-hidden="true" weight="duotone" /> },
    { href: `${base}/clinical`, label: 'Dados clínicos', icon: <Stethoscope aria-hidden="true" weight="duotone" /> },
    { href: `${base}/images`, label: 'Imagens', icon: <Images aria-hidden="true" weight="duotone" /> },
    { href: `${base}/reports`, label: 'Relatórios IA', icon: <Sparkle aria-hidden="true" weight="duotone" /> },
  ];
}

export default function PatientDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const pathname = usePathname();
  const dashboard = useProfessionalDashboard(patientId);
  const displayName = dashboard.data?.user?.name ?? 'Prontuário do paciente';
  const items = sections(patientId);
  const current = [...items].reverse().find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const activeSectionLinkRef = useRef<HTMLAnchorElement>(null);

  // The switcher scrolls horizontally on mobile -- without this, opening a
  // section straight from the patients table (e.g. Check-ins) can land
  // with the switcher scrolled so the active pill isn't visible, with no
  // on-screen indication of which section is open.
  useEffect(() => {
    activeSectionLinkRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [current?.href]);

  useSetBreadcrumbTrail(
    dashboard.isLoading
      ? null
      : [{ label: displayName, href: `/professional/patients/${patientId}` }, ...(current && current.href !== `/professional/patients/${patientId}` ? [{ label: current.label }] : [])],
  );

  if (dashboard.error) return <ErrorState message={dashboard.error.message} />;

  return (
    <div className="professional-patient-detail">
      <nav className="patient-section-switch" aria-label="Seções do prontuário">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href as never}
            ref={current?.href === item.href ? activeSectionLinkRef : undefined}
            className={current?.href === item.href ? 'active' : ''}
            aria-current={current?.href === item.href ? 'page' : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
