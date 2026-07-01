'use client';

import { useState } from 'react';
import { RequireAccessContext } from '@/components/auth/guards';
import { useI18n } from '@/components/i18n/I18nProvider';
import { PatientDataProvider } from '@/components/patient/PatientDataProvider';
import { ResponsiveAppShell } from './ResponsiveAppShell';

export function PatientLayout({ children }: { children: React.ReactNode }) {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const { t } = useI18n();
  const links = [['/patient/dashboard', t('nav.dashboard')], ['/patient/monitoring', t('nav.monitoring')], ['/patient/anamnese', t('nav.anamnesis')]];
  const notice = showPrivacyNotice ? <div className="notice patient-layout-notice"><span>🔐 {t('app.protectedData')}</span><button className="button ghost" type="button" onClick={() => setShowPrivacyNotice(false)}>{t('app.hide')}</button></div> : null;
  const footer = <footer className="app-footer">{t('app.footer')}</footer>;

  return <RequireAccessContext context="patient"><PatientDataProvider><ResponsiveAppShell title={t('app.patientPortal')} sidebarTitle="Julha" marker="+" links={links} profileHref="/patient/profile" footerHref="/logout" footerLabel={t('nav.logout')} className="patient-shell" notice={notice} footer={footer}>{children}</ResponsiveAppShell></PatientDataProvider></RequireAccessContext>;
}
