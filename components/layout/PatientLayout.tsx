'use client';

import { RequireAccessContext } from '@/components/auth/guards';
import { useI18n } from '@/components/i18n/I18nProvider';
import { PatientDataProvider, usePatientData } from '@/components/patient/PatientDataProvider';
import { LegalLinks } from './LegalLinks';
import { ResponsiveAppShell } from './ResponsiveAppShell';

function PatientShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  // Self-monitoring evolution/reports are billed and gated server-side by
  // the patient's own subscription record — every patient gets one lazily
  // created on first access, regardless of whether they're also linked to
  // a professional's monitoring plan — so the reports link must always be
  // reachable, not conditioned on plan origin. The dashboard now folds in
  // what used to be the separate "Automonitoramento" page.
  const links = [
    ['/patient/dashboard', t('nav.dashboard')],
    ['/patient/monitoring', t('nav.monitoring')],
    ['/patient/anamnese', t('nav.anamnesis')],
    ['/patient/relatorios', t('nav.reports')],
    ['/patient/assinatura', t('nav.subscription')],
  ];
  const footer = <footer className="app-footer">{t('app.footer')}<LegalLinks /></footer>;

  return <ResponsiveAppShell title={t('app.patientPortal')} sidebarTitle="Julha" marker="+" links={links} profileHref="/patient/profile" footerHref="/logout" footerLabel={t('nav.logout')} footer={footer}>{children}</ResponsiveAppShell>;
}

export function PatientLayout({ children }: { children: React.ReactNode }) {
  return <RequireAccessContext context="patient"><PatientDataProvider><PatientShell>{children}</PatientShell></PatientDataProvider></RequireAccessContext>;
}
