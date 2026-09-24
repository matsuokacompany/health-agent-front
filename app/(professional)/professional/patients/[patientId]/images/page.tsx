'use client';
import { use } from 'react';

import { ClinicalImagesSection } from '@/components/clinical-images/ClinicalImagesSection';
import { ErrorState } from '@/components/ui/states';

export default function PatientImages({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const selectedPatientId = Number(patientId);
  const isValidPatientId = Number.isSafeInteger(selectedPatientId) && selectedPatientId > 0;

  return (
    <div className="professional-tab-content">
      {isValidPatientId ? <ClinicalImagesSection patientId={selectedPatientId} /> : <ErrorState message="Paciente inválido." />}
    </div>
  );
}
