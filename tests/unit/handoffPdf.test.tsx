import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PatientHandoffSummary } from '@/lib/types';
import { buildHandoffPdfBlocks, createHandoffPdf, downloadHandoffPdf } from '@/lib/handoffPdf';
import { PatientHandoffButton } from '@/components/patient/PatientHandoffButton';

const summary = (overrides: Partial<PatientHandoffSummary> = {}): PatientHandoffSummary => ({
  patient_id: 12,
  generated_at: '2026-01-30T12:00:00Z',
  anamnese_info: 'Histórico de hipertensão.',
  risk_factors: ['Diabetes'],
  medication_allergies: 'Penicilina',
  food_restrictions: 'Lactose',
  supplements: [{ id: 1, name: 'Losartana', dosage_times: 1, dosage_period: 'DAY', started_at: '2026-01-01', duration_days: null, created_at: '2026-01-01T00:00:00Z' }],
  diet_document: { id: 1, patient_id: 12, uploaded_by_user_id: 12, original_filename: 'dieta.pdf', byte_size: 1000, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
  monitoring_summary: {
    sufficient_data: true,
    start_date: '2026-01-01',
    end_date: '2026-01-30',
    metrics: { adherence_percentage: 90, symptom_rate_percentage: 20 },
    adherence: { diet_percentage: 80, exercise_percentage: null, medication_percentage: 100 },
    symptoms: [{ description: 'Dor abdominal', occurrences: 3 }],
  },
  ...overrides,
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('documento PDF do resumo para o médico', () => {
  it('inclui anamnese, alergias, suplementos, plano alimentar e resumo do automonitoramento', () => {
    const text = buildHandoffPdfBlocks({ summary: summary(), patientName: 'Maria' }).map((b) => b.text).join('\n');
    expect(text).toContain('Paciente: Maria');
    expect(text).toContain('Histórico de hipertensão.');
    expect(text).toContain('Diabetes');
    expect(text).toContain('Penicilina');
    expect(text).toContain('Lactose');
    expect(text).toContain('Losartana');
    expect(text).toContain('dieta.pdf');
    expect(text).toContain('90%');
    expect(text).toContain('Dor abdominal (3x)');
  });

  it('mostra mensagens de "não informado" quando os campos estão vazios', () => {
    const text = buildHandoffPdfBlocks({
      summary: summary({ anamnese_info: null, risk_factors: [], medication_allergies: null, food_restrictions: null, supplements: [], diet_document: null }),
    }).map((b) => b.text).join('\n');
    expect(text).toContain('Anamnese não registrada.');
    expect(text).toContain('Nenhum fator de risco registrado.');
    expect(text).toContain('Nenhuma alergia a medicamento registrada.');
    expect(text).toContain('Nenhuma restrição alimentar registrada.');
    expect(text).toContain('Nenhum suplemento ou medicação registrada.');
    expect(text).toContain('Nenhum plano alimentar em PDF anexado.');
  });

  it('trata dados de automonitoramento insuficientes', () => {
    const text = buildHandoffPdfBlocks({ summary: summary({ monitoring_summary: { sufficient_data: false } }) }).map((b) => b.text).join('\n');
    expect(text).toContain('Dados de automonitoramento insuficientes');
  });

  it('gera um blob PDF e usa o nome de arquivo esperado', () => {
    vi.useFakeTimers();
    const blob = createHandoffPdf({ summary: summary() });
    expect(blob.type).toBe('application/pdf');
    const anchor = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:pdf'), revokeObjectURL: vi.fn() });
    downloadHandoffPdf(blob, 12);
    expect(anchor.download).toBe('resumo-clinico-paciente-12.pdf');
    expect(anchor.click).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:pdf');
  });
});

const api = vi.hoisted(() => ({ me: vi.fn(), forPatient: vi.fn() }));
vi.mock('@/services/patientHandoff', () => ({ patientHandoffApi: { me: api.me, forPatient: api.forPatient } }));

describe('botão de download do resumo para o médico', () => {
  beforeEach(() => {
    api.me.mockReset();
    api.forPatient.mockReset();
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:pdf'), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('busca o resumo próprio por padrão', async () => {
    api.me.mockResolvedValue(summary());
    render(<PatientHandoffButton patientId={12} />);
    fireEvent.click(screen.getByRole('button', { name: 'Baixar resumo para o médico' }));
    await waitFor(() => expect(api.me).toHaveBeenCalledOnce());
    expect(api.forPatient).not.toHaveBeenCalled();
  });

  it('busca o resumo do paciente pela rota do profissional quando forProfessional', async () => {
    api.forPatient.mockResolvedValue(summary());
    render(<PatientHandoffButton patientId={12} forProfessional />);
    fireEvent.click(screen.getByRole('button', { name: 'Baixar resumo para o médico' }));
    await waitFor(() => expect(api.forPatient).toHaveBeenCalledWith(12));
    expect(api.me).not.toHaveBeenCalled();
  });

  it('mostra mensagem amigável quando a geração falha', async () => {
    api.me.mockRejectedValue(new Error('falha'));
    render(<PatientHandoffButton patientId={12} />);
    fireEvent.click(screen.getByRole('button', { name: 'Baixar resumo para o médico' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível gerar o resumo');
  });
});
