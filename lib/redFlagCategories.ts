// Mirrors the backend's single source of truth -- see
// app/services/red_flag_symptoms.py's RED_FLAG_ALL_CATEGORIES in
// healthy-agent-back. Keep this list in sync with that one.
export const RED_FLAG_CATEGORIES: Record<string, { label: string; tier: 'absoluto' | 'contextual' }> = {
  cardiorrespiratorio: { label: 'Sinais cardiorrespiratórios', tier: 'absoluto' },
  neurologico: { label: 'Sinais neurológicos súbitos', tier: 'absoluto' },
  consciencia: { label: 'Alteração de consciência', tier: 'absoluto' },
  sangramento_trauma_intoxicacao: { label: 'Sangramento, trauma ou intoxicação', tier: 'absoluto' },
  falta_de_ar_leve: { label: 'Falta de ar leve ou moderada', tier: 'contextual' },
  dor_abdominal: { label: 'Dor abdominal', tier: 'contextual' },
  febre: { label: 'Febre', tier: 'contextual' },
  inchaco_ou_dor_em_uma_perna: { label: 'Inchaço ou dor em uma perna', tier: 'contextual' },
  palpitacao: { label: 'Palpitação', tier: 'contextual' },
  mal_estar_confusao_leve: { label: 'Mal-estar, fraqueza, suor ou tremor súbitos', tier: 'contextual' },
  sinais_de_descompensacao_cardiaca: { label: 'Piora ao deitar, inchaço ou ganho rápido de peso', tier: 'contextual' },
  sangramento_leve: { label: 'Sangramento leve', tier: 'contextual' },
  dor_de_cabeca_com_alteracao_visual: { label: 'Dor de cabeça com alteração visual', tier: 'contextual' },
};

export function redFlagCategoryLabel(key: string): string {
  return RED_FLAG_CATEGORIES[key]?.label ?? key;
}
