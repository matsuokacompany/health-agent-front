import { describe, expect, it } from 'vitest';
import { RED_FLAG_CATEGORIES, redFlagCategoryLabel } from '@/lib/redFlagCategories';

// Mirrors app/services/red_flag_symptoms.py's RED_FLAG_ALL_CATEGORIES in
// healthy-agent-back -- 5 absolute + 9 contextual. This file's own comment
// already says to keep it in sync; this test is what actually catches it
// drifting (a missing key silently falls back to showing the raw key
// instead of a label -- see redFlagCategoryLabel's fallback).
const EXPECTED_KEYS = [
  'cardiorrespiratorio',
  'neurologico',
  'consciencia',
  'sangramento_trauma_intoxicacao',
  'sinais_de_sepse',
  'falta_de_ar_leve',
  'dor_abdominal',
  'febre',
  'inchaco_ou_dor_em_uma_perna',
  'palpitacao',
  'mal_estar_confusao_leve',
  'sinais_de_descompensacao_cardiaca',
  'sangramento_leve',
  'dor_de_cabeca_com_alteracao_visual',
];

describe('RED_FLAG_CATEGORIES', () => {
  it('has every category the backend defines, no more and no less', () => {
    expect(Object.keys(RED_FLAG_CATEGORIES).sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it('has exactly 5 absolute and 9 contextual categories', () => {
    const tiers = Object.values(RED_FLAG_CATEGORIES).map((c) => c.tier);
    expect(tiers.filter((t) => t === 'absoluto')).toHaveLength(5);
    expect(tiers.filter((t) => t === 'contextual')).toHaveLength(9);
  });

  it('returns the human label for a known key', () => {
    expect(redFlagCategoryLabel('sinais_de_sepse')).toBe('Possível infecção com sinais de gravidade');
  });

  it('falls back to the raw key for an unknown one', () => {
    expect(redFlagCategoryLabel('categoria_desconhecida')).toBe('categoria_desconhecida');
  });
});
