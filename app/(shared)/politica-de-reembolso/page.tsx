import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';

export const metadata: Metadata = { title: 'Política de Reembolso — Julha Saúde' };

export default function PoliticaDeReembolso() {
  return <LegalDocumentPage slug="politica-de-reembolso" title="Política de Reembolso" />;
}
