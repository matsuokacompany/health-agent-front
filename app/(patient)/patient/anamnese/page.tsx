'use client';

import { useEffect, useState } from 'react';
import { ReadOnlyAnamnese } from '@/components/patient/ReadOnlyAnamnese';
import { SelfAnamneseEditor } from '@/components/patient/SelfAnamneseEditor';
import { SupplementsList } from '@/components/patient/SupplementsList';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { anamnesesApi } from '@/services/anamnese';
import { extractRiskFactors, type AnamneseRiskFactors } from '@/lib/anamneseRiskFactors';

export default function PatientAnamnese() {
  const { plans } = usePatientData();
  const hasProfessional = plans.some(
    (plan) => plan.origin === 'PROFESSIONAL' && (plan.active || String(plan.status ?? '').toLowerCase() === 'active'),
  );
  const [info, setInfo] = useState('');
  const [riskFactors, setRiskFactors] = useState<AnamneseRiskFactors>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasProfessional) {
      anamnesesApi.me()
        .then((a) => { setInfo(String(a.info ?? '')); setRiskFactors(extractRiskFactors(a)); })
        .catch(() => setInfo(''))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [hasProfessional]);

  return (
    <section className="stack">
      {hasProfessional ? (
        <ReadOnlyAnamnese info={info} loading={loading} riskFactors={riskFactors} />
      ) : (
        <SelfAnamneseEditor />
      )}
      <SupplementsList />
    </section>
  );
}
