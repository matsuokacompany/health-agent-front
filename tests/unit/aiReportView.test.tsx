import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiReportResult } from '@/components/professional/AiReportsJourney';
import type { AiReport } from '@/services/aiReports';

function report(overrides: Partial<AiReport> = {}): AiReport { return { report_id: 1, patient_id: 2, requested_by_user_id: 3, start_date: '2026-01-01', end_date: '2026-07-31', modo: 'avaliacao_clinica', status: 'COMPLETED', requested_at: '2026-07-31T10:00:00Z', processing_started_at: null, generated_at: '2026-07-31T10:01:00Z', next_generation_at: null, clinical_summary: 'Resumo seguro', ai: { avaliacao_clinica: { hipotese_principal: 'Possibilidade A', possiveis_doencas: ['Hipótese B'], nivel_de_suspeicao: 'baixo', justificativa: ['Sinal observado'] }, especialista_recomendado: 'Clínico', exames_prioritarios: ['Exame para consideração'], urgencia: 'baixa', alerta_legal: 'Apoio apenas' }, input_tokens: null, output_tokens: null, estimated_cost: null, actual_cost: null, model_name: null, failure_code: null, ...overrides }; }

describe('detalhe clínico', () => {
  it('renderiza detalhe clínico sem JSON bruto e sem afirmar diagnóstico', () => { render(<AiReportResult report={report()} />); expect(screen.getByText('Resumo seguro')).toBeTruthy(); expect(screen.getByText('Apoio apenas')).toBeTruthy(); expect(screen.getByText(/Não representa diagnóstico/i)).toBeTruthy(); expect(screen.queryByText(/"avaliacao_clinica"/)).toBeNull(); });
  it('renderiza falha de geração', () => { render(<AiReportResult report={report({ status: 'FAILED', failure_code: 'MODEL_ERROR', ai: null })} />); expect(screen.getByText('Relatório solicitado')).toBeTruthy(); expect(screen.getByText('Falha na geração')).toBeTruthy(); });
  it('renderiza geração em andamento', () => { render(<AiReportResult report={report({ status: 'PROCESSING', ai: null })} />); expect(screen.getByText('Gerando relatório')).toBeTruthy(); expect(screen.getByText(/organizando os dados/i)).toBeTruthy(); });
});
