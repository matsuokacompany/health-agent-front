import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PatientSymptomTermsCard } from '@/components/professional/PatientSymptomTermsCard';

const useProfessionalSymptomTerms = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useProfessional', () => ({ useProfessionalSymptomTerms }));

describe('ranking de sintomas mais mencionados (visão do profissional)', () => {
  afterEach(cleanup);

  it('mostra os termos ordenados com a contagem de cada um', () => {
    useProfessionalSymptomTerms.mockReturnValue({ data: { items: [{ label: 'Cefaleia', count: 5 }, { label: 'Náusea', count: 2 }] }, isLoading: false });
    render(<PatientSymptomTermsCard patientId="42" />);

    expect(useProfessionalSymptomTerms).toHaveBeenCalledWith('42', 6);
    expect(screen.getByText('Cefaleia')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('Náusea')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
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
