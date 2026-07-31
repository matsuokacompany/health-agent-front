import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AiReportsJourney } from '@/components/professional/AiReportsJourney';
import { aiReportsApi, type AiReport, type AiReportPreviewResponse } from '@/services/aiReports';

const metrics = { total_checkins: 30, completed_checkins: 25, pending_checkins: 5, checkins_with_symptoms: 4, checkins_without_symptoms: 21, days_with_checkins: 30, adherence_percentage: 83, symptom_rate_percentage: 16, calendar_coverage_percentage: 100 };
const preview: AiReportPreviewResponse = { modo: 'avaliacao_clinica', eligibility: { can_generate: true, reason: null, next_generation_at: null, sufficient_data: true, completed_checkins: 25, minimum_required: 10, latest_report_id: null, last_generated_at: null }, summary: { patient_id: 7, start_date: '2026-07-02', end_date: '2026-07-31', period_days: 30, aggregation: 'weekly', minimum_completed_checkins: 10, sufficient_data: true, metrics, symptom_trend: 'stable', longest_gap_days: 1, symptoms: [], timeline: [] }, preview_token: 'secret-preview-token', preview_expires_at: '2026-07-31T12:00:00Z' };
const pending: AiReport = { report_id: 11, patient_id: 7, requested_by_user_id: 2, start_date: '2026-07-02', end_date: '2026-07-31', modo: 'avaliacao_clinica', status: 'PENDING', requested_at: '2026-07-31T10:00:00Z', processing_started_at: null, generated_at: null, next_generation_at: null, clinical_summary: null, ai: null, input_tokens: null, output_tokens: null, estimated_cost: null, actual_cost: null, model_name: null, failure_code: null };
const emptyHistory = { items: [], pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 } };

describe('jornada de relatórios com IA', () => {
  beforeEach(() => { vi.spyOn(aiReportsApi, 'history').mockResolvedValue(emptyHistory); vi.spyOn(aiReportsApi, 'preview').mockResolvedValue(preview); vi.spyOn(aiReportsApi, 'generate').mockResolvedValue({ ...pending, status: 'COMPLETED', clinical_summary: 'Concluído' }); });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('mostra histórico vazio e preview elegível sem revelar token', async () => {
    render(<AiReportsJourney patientId="7" />);
    expect(await screen.findByText('Nenhum relatório encontrado')).toBeTruthy();
    fireEvent.click(screen.getByText('Analisar período'));
    expect(await screen.findByText('Dados suficientes')).toBeTruthy();
    expect(screen.getByText('Gerar interpretação com IA')).toBeTruthy();
    expect(screen.queryByText('secret-preview-token')).toBeNull();
  });

  it.each([
    ['INSUFFICIENT_DATA', 'Ainda não existem dados suficientes'],
    ['PATIENT_MONTHLY_LIMIT_REACHED', 'últimos 30 dias'],
    ['REPORT_IN_PROGRESS', 'em processamento'],
  ])('mostra bloqueio %s', async (reason, message) => {
    vi.mocked(aiReportsApi.preview).mockResolvedValue({ ...preview, preview_token: null, eligibility: { ...preview.eligibility, can_generate: false, sufficient_data: reason !== 'INSUFFICIENT_DATA', reason } });
    render(<AiReportsJourney patientId="7" />); fireEvent.click(screen.getByText('Analisar período'));
    expect(await screen.findByText(new RegExp(message))).toBeTruthy();
    expect(screen.getByText('Gerar interpretação com IA')).toHaveProperty('disabled', true);
  });

  it('confirma a geração com o texto clínico obrigatório', async () => {
    render(<AiReportsJourney patientId="7" />); fireEvent.click(screen.getByText('Analisar período')); await screen.findByText('Dados suficientes'); fireEvent.click(screen.getByText('Gerar interpretação com IA'));
    expect(screen.getByRole('dialog').textContent).toMatch(/somente em 30 dias/); expect(screen.getByRole('dialog').textContent).toMatch(/não representam diagnóstico médico/);
    fireEvent.click(screen.getByText('Confirmar e gerar')); await waitFor(() => expect(aiReportsApi.generate).toHaveBeenCalledWith('7', expect.objectContaining({ preview_token: 'secret-preview-token' })));
  });

  it('aplica filtro de status e paginação', async () => {
    vi.mocked(aiReportsApi.history).mockResolvedValue({ items: [{ ...pending, status: 'COMPLETED', generated_at: '2026-07-31T10:10:00Z' }], pagination: { page: 1, per_page: 20, total: 21, total_pages: 2 } });
    render(<AiReportsJourney patientId="7" />); expect(await screen.findByText('Ver detalhe')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Filtrar histórico por status'), { target: { value: 'COMPLETED' } }); await waitFor(() => expect(aiReportsApi.history).toHaveBeenCalledWith('7', 1, 20, 'COMPLETED'));
    fireEvent.click(screen.getByText('Próxima')); await waitFor(() => expect(aiReportsApi.history).toHaveBeenCalledWith('7', 2, 20, 'COMPLETED'));
  });

  it('faz polling e cancela timers ao desmontar', async () => {
    vi.useFakeTimers(); vi.mocked(aiReportsApi.generate).mockResolvedValue(pending); const detail = vi.spyOn(aiReportsApi, 'detail').mockResolvedValue({ ...pending, status: 'COMPLETED', generated_at: '2026-07-31T10:01:00Z' });
    const view = render(<AiReportsJourney patientId="7" />); await act(async () => { await Promise.resolve(); }); fireEvent.click(screen.getByText('Analisar período')); await act(async () => { await Promise.resolve(); }); fireEvent.click(screen.getByText('Gerar interpretação com IA')); fireEvent.click(screen.getByText('Confirmar e gerar')); await act(async () => { await Promise.resolve(); await Promise.resolve(); vi.advanceTimersByTime(2000); await Promise.resolve(); }); expect(detail).toHaveBeenCalled();
    view.unmount(); expect(vi.getTimerCount()).toBe(0);
  });
});
