'use client';

import { useEffect, useState } from 'react';
import { Card, PageHeader } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';
import { anamnesesApi } from '@/services/anamnese';

const professionalNotes = [
  { professional: 'Dr. João Silva', date: '12/06/2026', note: 'Paciente apresentou melhora.' },
];

export default function PatientAnamnese() {
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { anamnesesApi.me().then((a) => setInfo(String(a.info ?? ''))).catch(() => setInfo('')).finally(() => setLoading(false)); }, []);
  return <><PageHeader eyebrow="Anamnese" title="Anamnese original" description="A anamnese feita pelo primeiro profissional é somente leitura para preservar o histórico clínico." />
    <Card><h2>Informações clínicas</h2>{loading ? <p className="muted">Carregando...</p> : info ? <pre>{info}</pre> : <EmptyState description="Nenhuma anamnese encontrada." />}</Card>
    <Card><h2>Observações dos profissionais</h2>{professionalNotes.map((item) => <div className="note-card" key={`${item.professional}-${item.date}`}><strong>{item.professional}</strong><span className="muted">{item.date}</span><p>{item.note}</p></div>)}</Card>
  </>;
}
