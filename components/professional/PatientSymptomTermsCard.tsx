'use client';
import { useProfessionalSymptomTerms } from '@/hooks/useProfessional';
import { Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';

export function PatientSymptomTermsCard({ patientId }: { patientId: string }) {
  const symptomTerms = useProfessionalSymptomTerms(patientId, 6);
  const terms = symptomTerms.data?.items ?? [];
  const maxCount = terms.reduce((max, term) => Math.max(max, term.count), 0);

  return <Card className="patient-symptom-terms-card">
    <span className="eyebrow">Sintomas</span>
    <h2>Mais mencionados pelo paciente</h2>
    {symptomTerms.isLoading ? <SkeletonBlock className="sk-metric" /> : terms.length ? (
      <ul className="patient-symptom-terms-list">
        {terms.map((term) => (
          <li key={term.label}>
            <span className="patient-symptom-term-label">{term.label}</span>
            <span className="patient-symptom-term-track">
              <span
                className="patient-symptom-term-bar"
                style={{ width: maxCount ? `${Math.max((term.count / maxCount) * 100, 6)}%` : '0%' }}
                title={`${term.label}: ${term.count} registro(s)`}
              />
            </span>
            <span className="patient-symptom-term-count">{term.count}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="muted compact">Nenhum sintoma registrado ainda — assim que houver check-ins com sintomas, os termos mais frequentes aparecem aqui.</p>
    )}
  </Card>;
}
