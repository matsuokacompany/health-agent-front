import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Julha Saúde', description: 'Plataforma clínica com autenticação mock temporária e dados seguros' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="pt-BR"><body>{children}</body></html>; }
