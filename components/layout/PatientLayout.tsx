'use client';

import { useState } from 'react';
import { RequireAccessContext } from '@/components/auth/guards';
import { PatientDataProvider } from '@/components/patient/PatientDataProvider';
import { ResponsiveAppShell } from './ResponsiveAppShell';

const links = [['/patient/dashboard','Dashboard'],['/patient/monitoring','Monitoramento'],['/patient/anamnese','Anamnese']];

export function PatientLayout({ children }: { children: React.ReactNode }) {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const notice = showPrivacyNotice ? <div className="notice patient-layout-notice"><span>🔐 Seus dados ficam protegidos durante a navegação.</span><button className="button ghost" type="button" onClick={() => setShowPrivacyNotice(false)}>Ocultar</button></div> : null;
  const footer = <footer className="app-footer">Julha Saúde • Dados protegidos • Suporte clínico via WhatsApp</footer>;

  return (
    <RequireAccessContext context="patient">
      <PatientDataProvider>
        <ResponsiveAppShell title="Portal do paciente" sidebarTitle="Julha" marker="+" links={links} profileHref="/patient/profile" footerHref="/logout" footerLabel="Sair" className="patient-shell" notice={notice} footer={footer}>
          {children}
        </ResponsiveAppShell>
      </PatientDataProvider>
    </RequireAccessContext>
  );
}
