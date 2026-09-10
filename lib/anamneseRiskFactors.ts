// Mirrors the backend's single source of truth -- see
// app/services/red_flag_symptoms.py's ANAMNESE_RISK_FACTORS in
// healthy-agent-back. Keep this list in sync with that one.
export const ANAMNESE_RISK_FACTORS: ReadonlyArray<{ field: string; label: string }> = [
  { field: 'risk_heart_disease', label: 'Doença cardíaca' },
  { field: 'risk_prior_heart_attack', label: 'Infarto prévio' },
  { field: 'risk_prior_stroke_or_tia', label: 'AVC ou AIT (derrame) prévio' },
  { field: 'risk_asthma_or_copd', label: 'Asma ou DPOC' },
  { field: 'risk_heart_failure', label: 'Insuficiência cardíaca' },
  { field: 'risk_diabetes', label: 'Diabetes' },
  { field: 'risk_anticoagulant_use', label: 'Uso de anticoagulante' },
  { field: 'risk_immunosuppression', label: 'Imunossupressão' },
  { field: 'risk_pregnancy_or_postpartum', label: 'Gravidez ou pós-parto' },
  { field: 'risk_active_cancer', label: 'Câncer ativo' },
  { field: 'risk_prior_thrombosis_or_embolism', label: 'Histórico de trombose ou embolia' },
  { field: 'risk_recent_surgery_or_immobilization', label: 'Cirurgia recente ou imobilização prolongada' },
  { field: 'risk_epilepsy', label: 'Epilepsia' },
];

export type AnamneseRiskFactors = {
  risk_heart_disease?: boolean | null;
  risk_prior_heart_attack?: boolean | null;
  risk_prior_stroke_or_tia?: boolean | null;
  risk_asthma_or_copd?: boolean | null;
  risk_heart_failure?: boolean | null;
  risk_diabetes?: boolean | null;
  risk_anticoagulant_use?: boolean | null;
  risk_immunosuppression?: boolean | null;
  risk_pregnancy_or_postpartum?: boolean | null;
  risk_active_cancer?: boolean | null;
  risk_prior_thrombosis_or_embolism?: boolean | null;
  risk_recent_surgery_or_immobilization?: boolean | null;
  risk_epilepsy?: boolean | null;
};

export function extractRiskFactors(source: Record<string, unknown> | null | undefined): AnamneseRiskFactors {
  const result: AnamneseRiskFactors = {};
  if (!source) return result;
  for (const { field } of ANAMNESE_RISK_FACTORS) {
    if (source[field] !== undefined) (result as Record<string, unknown>)[field] = Boolean(source[field]);
  }
  return result;
}
