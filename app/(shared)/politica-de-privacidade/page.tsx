import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';

export const metadata: Metadata = { title: 'Política de Privacidade — Julha Saúde' };

export default function PoliticaDePrivacidade() {
  return <LegalDocumentPage slug="politica-de-privacidade" title="Política de Privacidade" />;
}
