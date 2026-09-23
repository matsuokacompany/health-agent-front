'use client';
import { useProfessionalSymptomTerms } from '@/hooks/useProfessional';
import { Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { CaretDown } from '@phosphor-icons/react';

function fmt(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

export function PatientSymptomTermsCard({ patientId }: { patientId: string }) {
  const symptomTerms = useProfessionalSymptomTerms(patientId, 6);
  const terms = symptomTerms.data?.items ?? [];
  const maxCount = terms.reduce((max, term) => Math.max(max, term.count), 0);

  return <Card className="patient-symptom-terms-card">
    <span className="eyebrow">Sintomas</span>
    <h2>Mais mencionados pelo paciente</h2>
    {symptomTerms.isLoading ? <SkeletonBlock className="sk-metric" /> : terms.length ? (
      <ul className="patient-symptom-terms-list">
        {terms.map((term) => {
          const bar = (
            <span className="patient-symptom-term-row">
              <span className="patient-symptom-term-label">{term.label}</span>
              <span className="patient-symptom-term-track">
                <span
                  className="patient-symptom-term-bar"
                  style={{ width: maxCount ? `${Math.max((term.count / maxCount) * 100, 6)}%` : '0%' }}
                />
              </span>
              <span className="patient-symptom-term-count">{term.count}</span>
            </span>
          );
          const samples = term.samples ?? [];
          if (!samples.length) {
            return <li key={term.label} title={`${term.label}: ${term.count} registro(s)`}>{bar}</li>;
          }
          // A generic term (a bare "Dor", "Ardência" etc.) is otherwise just
          // a label and a count -- this lets the professional see what the
          // patient actually wrote behind it without leaving this card.
          return (
            <li key={term.label}>
              <details className="patient-symptom-term-details">
                <summary title={`${term.label}: ${term.count} registro(s)`}>
                  {bar}
                  <CaretDown aria-hidden="true" size={14} weight="bold" className="patient-symptom-term-caret" />
                </summary>
                <ul className="patient-symptom-term-samples">
                  {samples.map((sample) => (
                    <li key={sample.report_id}>
                      <span className="patient-symptom-term-sample-date">{fmt(sample.report_date)}</span>
                      <span>{sample.description}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    ) : (
      <p className="muted compact">Nenhum sintoma registrado ainda — assim que houver check-ins com sintomas, os termos mais frequentes aparecem aqui.</p>
    )}
  </Card>;
}
