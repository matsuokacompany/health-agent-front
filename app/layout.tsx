import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { PatientDashboardQueryProvider } from '@/components/patient/dashboard/PatientDashboardQueryProvider';

export const metadata: Metadata = { title: 'Julha Saúde', description: 'Plataforma clínica para acompanhamento de saúde' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script nonce={nonce} src="/theme-init.js" />
      </head>
      <body><PatientDashboardQueryProvider><I18nProvider><AuthProvider>{children}</AuthProvider></I18nProvider></PatientDashboardQueryProvider></body>
    </html>
  );
}
