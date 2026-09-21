import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planos e Preços — Julha Saúde',
  description:
    'Conheça os planos da Julha para pacientes e profissionais de saúde: check-ins diários pelo WhatsApp, relatórios de IA sem limite de uso e cancelamento sem multa.',
};

export default function PrecosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
