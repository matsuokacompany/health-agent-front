'use client';

import { RequireAccessContext } from '@/components/auth/guards';
import { useI18n } from '@/components/i18n/I18nProvider';
import { PatientDataProvider, usePatientData } from '@/components/patient/PatientDataProvider';
import { ResponsiveAppShell } from './ResponsiveAppShell';

function PatientShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { plans } = usePatientData();
  // Anamnese is meant to be taken and reviewed by a health professional —
  // a self-service patient with no professional linked has nothing to see
  // there, so the link only shows once a PROFESSIONAL-origin plan exists.
  const hasProfessional = plans.some((plan) => plan.origin === 'PROFESSIONAL');
  const links = [
    ['/patient/dashboard', t('nav.dashboard')],
    ['/patient/monitoring', t('nav.monitoring')],
    ...(hasProfessional ? [['/patient/anamnese', t('nav.anamnesis')]] : []),
    ['/patient/assinatura', t('nav.subscription')],
  ];
  const footer = <footer className="app-footer">{t('app.footer')}</footer>;

  return <ResponsiveAppShell title={t('app.patientPortal')} sidebarTitle="Julha" marker="+" links={links} profileHref="/patient/profile" footerHref="/logout" footerLabel={t('nav.logout')} className="patient-shell" footer={footer}>{children}</ResponsiveAppShell>;
}

export function PatientLayout({ children }: { children: React.ReactNode }) {
  return <RequireAccessContext context="patient"><PatientDataProvider><PatientShell>{children}</PatientShell></PatientDataProvider></RequireAccessContext>;
}
