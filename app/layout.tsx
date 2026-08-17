import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { PatientDashboardQueryProvider } from '@/components/patient/dashboard/PatientDashboardQueryProvider';

export const metadata: Metadata = { title: 'Julha Saúde', description: 'Plataforma clínica para acompanhamento de saúde' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script src="/theme-init.js" />
      </head>
      <body><PatientDashboardQueryProvider><I18nProvider><AuthProvider>{children}</AuthProvider></I18nProvider></PatientDashboardQueryProvider></body>
    </html>
  );
}
