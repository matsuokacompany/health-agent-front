'use client';

import { useEffect, useState } from 'react';
import { ReadOnlyAnamnese } from '@/components/patient/ReadOnlyAnamnese';
import { SelfAnamneseEditor } from '@/components/patient/SelfAnamneseEditor';
import { SupplementsList } from '@/components/patient/SupplementsList';
import { DietDocumentUpload } from '@/components/patient/DietDocumentUpload';
import { PatientHandoffButton } from '@/components/patient/PatientHandoffButton';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { anamnesesApi } from '@/services/anamnese';
import { extractRiskFactors, type AnamneseRiskFactors } from '@/lib/anamneseRiskFactors';

export default function PatientAnamnese() {
  const { plans } = usePatientData();
  const { user } = useAuth();
  const patientId = user ? Number(user.id) : undefined;
  const hasProfessional = plans.some(
    (plan) => plan.origin === 'PROFESSIONAL' && (plan.active || String(plan.status ?? '').toLowerCase() === 'active'),
  );
  const [info, setInfo] = useState('');
  const [riskFactors, setRiskFactors] = useState<AnamneseRiskFactors>({});
  const [medicationAllergies, setMedicationAllergies] = useState<string | null>(null);
  const [foodRestrictions, setFoodRestrictions] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasProfessional) {
      anamnesesApi.me()
        .then((a) => {
          setInfo(String(a.info ?? ''));
          setRiskFactors(extractRiskFactors(a));
          setMedicationAllergies(a.medication_allergies ?? null);
          setFoodRestrictions(a.food_restrictions ?? null);
        })
        .catch(() => setInfo(''))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [hasProfessional]);

  return (
    <section className="stack">
      {hasProfessional ? (
        <ReadOnlyAnamnese
          info={info}
          loading={loading}
          riskFactors={riskFactors}
          medicationAllergies={medicationAllergies}
          foodRestrictions={foodRestrictions}
        />
      ) : (
        <SelfAnamneseEditor />
      )}
      <SupplementsList />
      {hasProfessional && patientId ? (
        <>
          <DietDocumentUpload patientId={patientId} />
          <PatientHandoffButton patientId={patientId} patientName={user?.name} />
        </>
      ) : null}
    </section>
  );
}
