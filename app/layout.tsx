import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';
import { I18nProvider } from '@/components/i18n/I18nProvider';

export const metadata: Metadata = { title: 'Julha Saúde', description: 'Plataforma clínica para acompanhamento de saúde' };

const themeScript = `
(function() {
  try {
    var stored = window.localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = stored || (prefersDark ? 'dark' : 'light');
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body><I18nProvider><AuthProvider>{children}</AuthProvider></I18nProvider></body>
    </html>
  );
}
