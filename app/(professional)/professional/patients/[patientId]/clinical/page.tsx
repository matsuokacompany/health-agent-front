'use client';
import { use } from 'react';

import { PatientAnamneseEditor } from '@/components/professional/PatientAnamneseEditor';
import { PatientSupplementsEditor } from '@/components/professional/PatientSupplementsEditor';
import { PatientAllergiesEditor } from '@/components/professional/PatientAllergiesEditor';
import { ClinicalImagesSection } from '@/components/clinical-images/ClinicalImagesSection';
import { ErrorState } from '@/components/ui/states';

export default function PatientClinical({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const selectedPatientId = Number(patientId);
  const isValidPatientId = Number.isSafeInteger(selectedPatientId) && selectedPatientId > 0;

  return (
    <div className="professional-tab-content professional-clinical-content">
      <div className="professional-clinical-main">
        <PatientAnamneseEditor patientId={patientId} />
        <div className="patient-anamnese-grid">
          <PatientSupplementsEditor patientId={patientId} />
          <PatientAllergiesEditor patientId={patientId} />
        </div>
      </div>
      {isValidPatientId ? <ClinicalImagesSection patientId={selectedPatientId} /> : <ErrorState message="Paciente inválido." />}
    </div>
  );
}
