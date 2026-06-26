'use client';

import { useEffect, useState } from 'react';
import { ReadOnlyAnamnese } from '@/components/patient/ReadOnlyAnamnese';
import { ProfessionalObservations } from '@/components/patient/ProfessionalObservations';
import { PageHeader } from '@/components/ui/design';
import { anamnesesApi } from '@/services/anamnese';
import { getMockProfessionalObservations } from '@/services/patientAnamnese';

export default function PatientAnamnese() {
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const observations = getMockProfessionalObservations();

  useEffect(() => { anamnesesApi.me().then((a) => setInfo(String(a.info ?? ''))).catch(() => setInfo('')).finally(() => setLoading(false)); }, []);

  return <><PageHeader eyebrow="Anamnese" title="Histórico clínico" description="A anamnese original é imutável para o paciente. Use esta tela apenas para consulta." />
    <section className="stack"><ReadOnlyAnamnese info={info} loading={loading} /><ProfessionalObservations observations={observations} /></section>
  </>;
}
