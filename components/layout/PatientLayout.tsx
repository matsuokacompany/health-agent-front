'use client';

import { useState } from 'react';
import { RequireRole } from '@/components/auth/guards';
import { PatientDataProvider } from '@/components/patient/PatientDataProvider';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './Sidebar';

const links = [['/patient/dashboard','Dashboard'],['/patient/calendar','Calendário'],['/patient/monitoring','Monitoramento'],['/patient/anamnese','Anamnese']];

export function PatientLayout({ children }: { children: React.ReactNode }) {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);

  return (
    <RequireRole role="patient">
      <PatientDataProvider>
        <main className="app-shell patient-shell">
          <AppSidebar title="Julha" marker="+" links={links} profileHref="/patient/profile" footerHref="/logout" footerLabel="Sair" />
          <section className="content-shell patient-content-shell">
            <AppHeader title="Portal do paciente" />
            {showPrivacyNotice ? <div className="notice patient-layout-notice"><span>🔐 Seus dados ficam protegidos durante a navegação.</span><button className="button ghost" type="button" onClick={() => setShowPrivacyNotice(false)}>Ocultar</button></div> : null}
            <div className="page-outlet">{children}</div>
            <footer className="app-footer">Julha Saúde • Dados protegidos • Suporte clínico via WhatsApp</footer>
          </section>
        </main>
      </PatientDataProvider>
    </RequireRole>
  );
}
