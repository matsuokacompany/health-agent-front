import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckinDetailModal } from '@/components/professional/CheckinDetailModal';
import { StatusBadge } from '@/components/professional/StatusBadge';
import type { ProfessionalCheckIn } from '@/services/professional';

const baseItem: ProfessionalCheckIn = {
  id: 1,
  report_date: '2026-08-10',
  status: 'COMPLETED',
  completed: true,
  had_symptoms: true,
  symptom_description: 'Dor lateral direita da pelve',
  diet_adherence: false,
  lifestyle_notes: 'Comi um pedaço de bolo no aniversário de um amigo',
  exercise_adherence: true,
  medication_adherence: false,
  medication_adherence_level: 'PARTIAL',
};

describe('modal de detalhe do check-in (visão do profissional)', () => {
  afterEach(cleanup);

  it('mostra sintoma, dieta e o que o paciente comeu fora da dieta quando as informações sensíveis estão visíveis', () => {
    render(<CheckinDetailModal item={baseItem} onClose={vi.fn()} revealSensitive />);

    expect(screen.getByText('Dor lateral direita da pelve')).toBeTruthy();
    expect(screen.getByText('Não seguiu a dieta')).toBeTruthy();
    expect(screen.getByText('Comi um pedaço de bolo no aniversário de um amigo')).toBeTruthy();
    expect(screen.getByText('Fez o exercício')).toBeTruthy();
    expect(screen.getByText('Parcialmente')).toBeTruthy();
  });

  it('oculta a descrição do sintoma e o relato da dieta quando as informações sensíveis estão ocultas', () => {
    render(<CheckinDetailModal item={baseItem} onClose={vi.fn()} revealSensitive={false} />);

    expect(screen.queryByText('Dor lateral direita da pelve')).toBeNull();
    expect(screen.queryByText('Comi um pedaço de bolo no aniversário de um amigo')).toBeNull();
    expect(screen.getAllByText(/Informação sensível oculta|Descrição oculta|Relato oculto/).length).toBeGreaterThan(0);
  });

  it('não mostra a linha de "o que comeu fora da dieta" quando o paciente seguiu a dieta', () => {
    render(<CheckinDetailModal item={{ ...baseItem, diet_adherence: true, lifestyle_notes: null }} onClose={vi.fn()} revealSensitive />);

    expect(screen.queryByText('O que comeu fora da dieta')).toBeNull();
    expect(screen.getByText('Seguiu a dieta')).toBeTruthy();
  });

  it('não renderiza nada quando não há item selecionado', () => {
    const { container } = render(<CheckinDetailModal item={null} onClose={vi.fn()} revealSensitive />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe('StatusBadge', () => {
  afterEach(cleanup);

  it('usa o tom certo para cada status', () => {
    const { container: completed } = render(<StatusBadge status="COMPLETED" />);
    expect(completed.querySelector('.badge.risk-baixo')).toBeTruthy();

    const { container: expired } = render(<StatusBadge status="EXPIRED" />);
    expect(expired.querySelector('.badge.risk-alto')).toBeTruthy();

    const { container: pending } = render(<StatusBadge status="PENDING" />);
    expect(pending.querySelector('.badge.tone-muted')).toBeTruthy();
  });
});
