'use client';

import { use } from 'react';
import { RequireRole } from '@/components/auth/guards';

export default function PatientDetail({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);

  return (
    <RequireRole role="professional">
      <main>
        <div className="nav"><a href="/professional/patients">← Pacientes</a><span className="badge">Prontuário vinculado</span></div>
        <h1>Paciente local #{patientId}</h1>
        <p className="muted">Todas as regras de negócio e vínculos clínicos permanecem no FastAPI.</p>
      </main>
    </RequireRole>
  );
}
