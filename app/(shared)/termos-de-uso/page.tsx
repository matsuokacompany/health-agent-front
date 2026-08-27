import type { Metadata } from 'next';
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage';

export const metadata: Metadata = { title: 'Termos de Uso — Julha Saúde' };

export default function TermosDeUso() {
  return <LegalDocumentPage slug="termos-de-uso" title="Termos de Uso" />;
}
