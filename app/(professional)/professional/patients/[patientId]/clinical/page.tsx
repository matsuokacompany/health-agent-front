'use client';
import { use } from 'react';

import { PatientAnamneseEditor } from '@/components/professional/PatientAnamneseEditor';
import { PatientSupplementsEditor } from '@/components/professional/PatientSupplementsEditor';
import { PatientAllergiesEditor } from '@/components/professional/PatientAllergiesEditor';

export default function PatientClinical({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);

  return (
    <div className="professional-tab-content">
      <PatientAnamneseEditor patientId={patientId} />
      <div className="patient-anamnese-grid">
        <PatientSupplementsEditor patientId={patientId} />
        <PatientAllergiesEditor patientId={patientId} />
      </div>
    </div>
  );
}
