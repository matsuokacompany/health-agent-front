import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExceptionalReportRelease } from '@/components/admin/ExceptionalReportRelease';
import { ApiError, clearCsrfToken } from '@/infrastructure/http/ApiClient';
import { adminAiReportsApi } from '@/services/adminAiReports';

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: authMock }));

const props = { patientId: 123, patientName: 'Ana Souza', patientEmail: 'ana@example.com', nextGenerationAt: '2026-08-29T00:00:00Z' };
const success = { patient_id: 123, report_id: 456, modo: 'avaliacao_clinica' as const, released_by_user_id: 1, previous_next_generation_at: props.nextGenerationAt, released_at: '2026-08-10T12:00:00Z' };

describe('ExceptionalReportRelease', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); clearCsrfToken(); });

  it.each([false, undefined])('is hidden unless the user is a super admin (%s)', (isSuperAdmin) => {
    authMock.mockReturnValue({ isSuperAdmin });
    render(<ExceptionalReportRelease {...props} />);
    expect(screen.queryByText('Liberação excepcional de relatório')).toBeNull();
  });

  it('shows patient details and warning in the confirmation modal', () => {
    authMock.mockReturnValue({ isSuperAdmin: true });
    render(<ExceptionalReportRelease {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Liberar Apoio à avaliação clínica' }));
    expect(screen.getByRole('dialog', { name: 'Liberar relatório' })).toBeTruthy();
    expect(screen.getByText('Ana Souza')).toBeTruthy();
    expect(screen.getByText('ana@example.com')).toBeTruthy();
    expect(screen.getByText(/Esta ação permitirá que o paciente gere imediatamente/)).toBeTruthy();
    expect(screen.getByText(/29 de agosto de 2026/)).toBeTruthy();
  });

  it('uses the internal patient id, blocks duplicate clicks, refreshes and disables after success', async () => {
    authMock.mockReturnValue({ isSuperAdmin: true });
    let resolve!: (value: typeof success) => void;
    const pending = new Promise<typeof success>((done) => { resolve = done; });
    const release = vi.spyOn(adminAiReportsApi, 'releaseClinicalCooldown').mockReturnValue(pending);
    const refreshed = vi.fn();
    render(<ExceptionalReportRelease {...props} onReleased={refreshed} />);
    fireEvent.click(screen.getByText('Liberar Apoio à avaliação clínica'));
    const confirm = screen.getByRole('button', { name: 'Liberar relatório' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Liberando...')).toBeTruthy();
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith(123);
    resolve(success);
    await waitFor(() => expect(screen.getByText(/liberado com sucesso/)).toBeTruthy());
    expect(refreshed).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('button', { name: 'Relatório liberado' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it.each([
    [403, {}, 'Apenas um super administrador pode liberar este relatório.'],
    [404, { detail: 'Patient not found' }, 'Paciente não encontrado.'],
    [404, { detail: 'Completed AI report not found for this patient and mode' }, 'Não existe um relatório concluído de Apoio à avaliação clínica para liberar.'],
    [409, { detail: 'AI report already in progress' }, 'Já existe um relatório em geração para este paciente.'],
    [409, { detail: 'AI report cooldown is not active' }, 'O relatório já está liberado ou o período de espera já terminou.'],
  ])('maps HTTP %s errors', async (status, payload, message) => {
    authMock.mockReturnValue({ isSuperAdmin: true });
    vi.spyOn(adminAiReportsApi, 'releaseClinicalCooldown').mockRejectedValue(new ApiError('failed', status as number, payload));
    render(<ExceptionalReportRelease {...props} />);
    fireEvent.click(screen.getByText('Liberar Apoio à avaliação clínica'));
    fireEvent.click(screen.getByRole('button', { name: 'Liberar relatório' }));
    await waitFor(() => expect(screen.getByText(message as string)).toBeTruthy());
  });
});

describe('adminAiReportsApi', () => {
  afterEach(() => { clearCsrfToken(); vi.unstubAllGlobals(); });

  it('gets fresh CSRF and posts the required mode with cookies', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith('/api/auth/csrf')) return new Response(JSON.stringify({ csrf_token: 'fresh-token' }), { status: 200 });
      return new Response(JSON.stringify(success), { status: 200 });
    });
    await adminAiReportsApi.releaseClinicalCooldown(123);
    expect(calls[0].url).toBe('http://localhost/api/auth/csrf');
    expect(calls[0].init?.credentials).toBe('include');
    expect(calls[1].url).toBe('http://localhost/api/admin/patients/123/ai-reports/release-cooldown');
    expect(calls[1].init?.credentials).toBe('include');
    expect((calls[1].init?.headers as Headers).get('X-CSRF-Token')).toBe('fresh-token');
    expect(calls[1].init?.body).toBe(JSON.stringify({ modo: 'avaliacao_clinica' }));
  });
});
