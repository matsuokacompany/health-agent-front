'use client';
import type { ProfessionalCheckIn } from '@/services/professional';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/professional/StatusBadge';
import { SensitivePlaceholder } from '@/components/professional/SensitivePlaceholder';
import { redFlagCategoryLabel } from '@/lib/redFlagCategories';

const MEDICATION_ADHERENCE_LEVEL_LABELS: Record<string, string> = {
  ALL: 'Todos os medicamentos',
  PARTIAL: 'Parcialmente',
  NONE: 'Nenhum medicamento',
};

function fmt(value?: string | null) {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value)) : '—';
}

export function CheckinDetailModal({ item, onClose, revealSensitive }: { item: ProfessionalCheckIn | null; onClose: () => void; revealSensitive: boolean }) {
  return <Modal open={Boolean(item)} title={item ? `Check-in de ${fmt(item.report_date)}` : 'Check-in'} onClose={onClose}>
    {item ? <dl className="checkin-detail-grid">
      <div className="checkin-detail-row"><dt>Status</dt><dd><StatusBadge status={item.status} /></dd></div>
      <div className="checkin-detail-row"><dt>Sintomas</dt><dd>{item.had_symptoms === true ? 'Sim' : item.had_symptoms === false ? 'Não' : '—'}</dd></div>
      {item.had_symptoms ? <div className="checkin-detail-row"><dt>Descrição do sintoma</dt><dd>{revealSensitive ? (item.symptom_description ?? '—') : <SensitivePlaceholder label="Descrição oculta" />}</dd></div> : null}
      {item.red_flag_category ? <div className="checkin-detail-row"><dt>Alerta</dt><dd><span className="badge risk-alto">{redFlagCategoryLabel(item.red_flag_category)}</span></dd></div> : null}
      <div className="checkin-detail-row"><dt>Adesão à dieta</dt><dd>{item.diet_adherence === true ? 'Seguiu a dieta' : item.diet_adherence === false ? 'Não seguiu a dieta' : '—'}</dd></div>
      {item.diet_adherence === false ? <div className="checkin-detail-row"><dt>O que comeu fora da dieta</dt><dd>{revealSensitive ? (item.lifestyle_notes || 'Paciente não detalhou.') : <SensitivePlaceholder label="Relato oculto" />}</dd></div> : null}
      <div className="checkin-detail-row"><dt>Adesão ao exercício</dt><dd>{item.exercise_adherence === true ? 'Fez o exercício' : item.exercise_adherence === false ? 'Não fez o exercício' : '—'}</dd></div>
      <div className="checkin-detail-row"><dt>Adesão à medicação</dt><dd>{item.medication_adherence_level ? (MEDICATION_ADHERENCE_LEVEL_LABELS[item.medication_adherence_level] ?? item.medication_adherence_level) : item.medication_adherence === true ? 'Tomou a medicação' : item.medication_adherence === false ? 'Não tomou a medicação' : '—'}</dd></div>
    </dl> : null}
  </Modal>;
}
