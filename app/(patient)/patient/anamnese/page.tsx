'use client';

import { useEffect, useState } from 'react';
import { ReadOnlyAnamnese } from '@/components/patient/ReadOnlyAnamnese';
import { SupplementsList } from '@/components/patient/SupplementsList';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { anamnesesApi } from '@/services/anamnese';

export default function PatientAnamnese() {
  const { plans } = usePatientData();
  const hasProfessional = plans.some((plan) => plan.origin === 'PROFESSIONAL');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { anamnesesApi.me().then((a) => setInfo(String(a.info ?? ''))).catch(() => setInfo('')).finally(() => setLoading(false)); }, []);

  return (
    <section className="stack" data-tour="anamnese-card">
      <ReadOnlyAnamnese info={info} loading={loading} hasProfessional={hasProfessional} />
      <SupplementsList />
    </section>
  );
}
