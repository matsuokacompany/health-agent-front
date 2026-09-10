'use client';

import { ANAMNESE_RISK_FACTORS, type AnamneseRiskFactors } from '@/lib/anamneseRiskFactors';

export function RiskFactorChecklist({
  values,
  onChange,
  disabled,
}: {
  values: AnamneseRiskFactors;
  onChange: (field: keyof AnamneseRiskFactors, checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="risk-factor-checklist">
      <legend>Fatores de risco relevantes</legend>
      <p className="muted compact">
        Marque as condições que se aplicam. Isso ajuda o sistema a identificar, entre os sintomas
        relatados no check-in, aqueles que merecem atenção redobrada para este histórico.
      </p>
      <div className="risk-factor-grid">
        {ANAMNESE_RISK_FACTORS.map(({ field, label }) => (
          <label key={field}>
            <input
              type="checkbox"
              checked={Boolean(values[field as keyof AnamneseRiskFactors])}
              onChange={(event) => onChange(field as keyof AnamneseRiskFactors, event.target.checked)}
              disabled={disabled}
            />
            {' '}{label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
