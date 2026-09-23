import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PatientSymptomTermsCard } from '@/components/professional/PatientSymptomTermsCard';

const useProfessionalSymptomTerms = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useProfessional', () => ({ useProfessionalSymptomTerms }));

describe('ranking de sintomas mais mencionados (visão do profissional)', () => {
  afterEach(cleanup);

  it('mostra os termos ordenados com a contagem de cada um', () => {
    useProfessionalSymptomTerms.mockReturnValue({ data: { items: [{ label: 'Cefaleia', count: 5, samples: [] }, { label: 'Náusea', count: 2, samples: [] }] }, isLoading: false });
    render(<PatientSymptomTermsCard patientId="42" />);

    expect(useProfessionalSymptomTerms).toHaveBeenCalledWith('42', 6);
    expect(screen.getByText('Cefaleia')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('Náusea')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('mostra as descrições originais por trás de um termo genérico ao expandir', () => {
    useProfessionalSymptomTerms.mockReturnValue({
      data: {
        items: [
          {
            label: 'Dor',
            count: 2,
            samples: [
              { report_id: 2, report_date: '2026-01-02', description: 'Dor no joelho direito' },
              { report_id: 1, report_date: '2026-01-01', description: 'Dor de cabeça leve' },
            ],
          },
        ],
      },
      isLoading: false,
    });
    const { container } = render(<PatientSymptomTermsCard patientId="42" />);

    const details = container.querySelector('details') as HTMLDetailsElement;
    expect(details).toBeTruthy();
    expect(details.open).toBe(false);
    fireEvent.click(screen.getByText('Dor'));
    expect(details.open).toBe(true);
    expect(screen.getByText('Dor no joelho direito')).toBeTruthy();
    expect(screen.getByText('Dor de cabeça leve')).toBeTruthy();
  });

  it('mostra estado vazio quando o paciente não tem sintomas registrados', () => {
    useProfessionalSymptomTerms.mockReturnValue({ data: { items: [] }, isLoading: false });
    render(<PatientSymptomTermsCard patientId="42" />);

    expect(screen.getByText(/Nenhum sintoma registrado ainda/)).toBeTruthy();
  });

  it('mostra o skeleton enquanto carrega', () => {
    useProfessionalSymptomTerms.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<PatientSymptomTermsCard patientId="42" />);

    expect(container.querySelector('.sk-metric')).toBeTruthy();
  });
});
