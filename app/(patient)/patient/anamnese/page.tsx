'use client';

import { useEffect, useState } from 'react';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { ReadOnlyAnamnese } from '@/components/patient/ReadOnlyAnamnese';
import { SelfAnamneseEditor } from '@/components/patient/SelfAnamneseEditor';
import { SupplementsList } from '@/components/patient/SupplementsList';
import { DietDocumentUpload } from '@/components/patient/DietDocumentUpload';
import { PatientHandoffButton } from '@/components/patient/PatientHandoffButton';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { useAuth } from '@/components/auth/AuthProvider';
import { anamnesesApi } from '@/services/anamnese';
import { extractRiskFactors, type AnamneseRiskFactors } from '@/lib/anamneseRiskFactors';

function LoadingAnamnese() {
  return <section className="stack" aria-busy="true" aria-label="Carregando anamnese">
    <div className="page-header">
      <div><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-page-title" /><SkeletonBlock className="sk-page-copy" /></div>
      <SkeletonBlock className="sk-action" />
    </div>
    <div className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock className="sk-tile" /></div>
    <div className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></div>
    <div className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-title" /><SkeletonBlock /></div>
  </section>;
}

export default function PatientAnamnese() {
  const { plans, loading: plansLoading } = usePatientData();
  const { user } = useAuth();
  const patientId = user ? Number(user.id) : undefined;
  const hasProfessional = plans.some(
    (plan) => plan.origin === 'PROFESSIONAL' && (plan.active || String(plan.status ?? '').toLowerCase() === 'active'),
  );
  const [info, setInfo] = useState('');
  const [riskFactors, setRiskFactors] = useState<AnamneseRiskFactors>({});
  const [medicationAllergies, setMedicationAllergies] = useState<string | null>(null);
  const [foodRestrictions, setFoodRestrictions] = useState<string | null>(null);
  const [loadingAnamnese, setLoadingAnamnese] = useState(true);

  useEffect(() => {
    if (plansLoading) return;
    if (hasProfessional) {
      anamnesesApi.me()
        .then((a) => {
          setInfo(String(a.info ?? ''));
          setRiskFactors(extractRiskFactors(a));
          setMedicationAllergies(a.medication_allergies ?? null);
          setFoodRestrictions(a.food_restrictions ?? null);
        })
        .catch(() => setInfo(''))
        .finally(() => setLoadingAnamnese(false));
    } else {
      setLoadingAnamnese(false);
    }
  }, [hasProfessional, plansLoading]);

  // hasProfessional isn't known until plans finish loading -- rendering
  // before then would flash the wrong editor (self-service vs read-only)
  // for a professionally-monitored patient.
  if (plansLoading) return <LoadingAnamnese />;

  return (
    <section className="stack">
      {patientId ? <div className="page-actions"><PatientHandoffButton patientId={patientId} patientName={user?.name} /></div> : null}
      {hasProfessional ? (
        <ReadOnlyAnamnese
          info={info}
          loading={loadingAnamnese}
          riskFactors={riskFactors}
          medicationAllergies={medicationAllergies}
          foodRestrictions={foodRestrictions}
        />
      ) : (
        <SelfAnamneseEditor />
      )}
      <SupplementsList />
      {patientId ? <DietDocumentUpload patientId={patientId} /> : null}
    </section>
  );
}
