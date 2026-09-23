'use client';
import { use, useState } from 'react';

import { useProfessionalCheckIns } from '@/hooks/useProfessional';
import type { ProfessionalCheckIn } from '@/services/professional';
import { PatientMonitoringCalendar } from '@/components/professional/PatientMonitoringCalendar';
import { PatientSymptomTermsCard } from '@/components/professional/PatientSymptomTermsCard';
import { CheckinDetailModal } from '@/components/professional/CheckinDetailModal';
import { StatusBadge } from '@/components/professional/StatusBadge';
import { SensitivePlaceholder } from '@/components/professional/SensitivePlaceholder';
import { EmptyState } from '@/components/ui/states';
import { TableSkeleton } from '@/components/ui/Loading';
import { redFlagCategoryLabel } from '@/lib/redFlagCategories';
import { truncate } from '@/lib/text';

function fmt(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.includes('T') ? 'short' : undefined }).format(new Date(value)) : '—'; }

export default function PatientCheckins({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [hadSymptoms, setHadSymptoms] = useState<'' | boolean>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const checkins = useProfessionalCheckIns(patientId, { page, per_page: 10, status, had_symptoms: hadSymptoms, order });
  const [showSymptomDescriptions, setShowSymptomDescriptions] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState<ProfessionalCheckIn | null>(null);

  return (
    <div className="professional-tab-content">
      <PatientMonitoringCalendar patientId={patientId} revealSensitive={showSymptomDescriptions} />
      <PatientSymptomTermsCard patientId={patientId} />
      <section id="patient-checkins" className="card patient-table-section professional-detail-section">
        <div className="professional-section-heading">
          <div>
            <h2>Check-ins</h2>
            <p className="muted compact">Filtre o histórico, clique num dia para ver o detalhe completo e controle a exibição das informações sensíveis.</p>
          </div>
          <button className="button secondary" type="button" onClick={() => setShowSymptomDescriptions((current) => !current)}>
            {showSymptomDescriptions ? 'Ocultar informações sensíveis' : 'Exibir informações sensíveis'}
          </button>
        </div>
        <div className="patient-filter-grid compact">
          <label>
            Status
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="AWAITING_SYMPTOM_DESCRIPTION">Aguardando sintomas</option>
              <option value="AWAITING_CAUSE">Aguardando causa (legado)</option>
              <option value="COMPLETED">Concluído</option>
              <option value="EXPIRED">Expirado</option>
            </select>
          </label>
          <label>
            Sintomas
            <select value={String(hadSymptoms)} onChange={(event) => { setHadSymptoms(event.target.value === '' ? '' : event.target.value === 'true'); setPage(1); }}>
              <option value="">Todos</option>
              <option value="true">Com sintomas</option>
              <option value="false">Sem sintomas</option>
            </select>
          </label>
          <label>
            Ordem
            <select value={order} onChange={(event) => setOrder(event.target.value as 'asc' | 'desc')}>
              <option value="desc">Mais recentes</option>
              <option value="asc">Mais antigos</option>
            </select>
          </label>
        </div>
        {checkins.isLoading ? <TableSkeleton rows={6} columns={4} /> : checkins.data?.items.length ? (
          <>
            <div className="table-wrap">
              <table className="checkins-table">
                <thead>
                  <tr><th>Data</th><th>Status</th><th>Sintomas</th><th>Descrição dos sintomas</th><th>Alerta</th></tr>
                </thead>
                <tbody>
                  {checkins.data.items.map((item) => (
                    <tr key={item.id} role="button" tabIndex={0} onClick={() => setSelectedCheckin(item)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedCheckin(item); } }}>
                      <td>{fmt(item.report_date)}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>{item.had_symptoms === true ? 'Sim' : item.had_symptoms === false ? 'Não' : '—'}</td>
                      <td>{showSymptomDescriptions ? (item.symptom_description ? <span className="cell-truncate" title={item.symptom_description}>{truncate(item.symptom_description)}</span> : '—') : <SensitivePlaceholder label="Descrição oculta" />}</td>
                      <td>{item.red_flag_category ? <span className="badge risk-alto">{redFlagCategoryLabel(item.red_flag_category)}</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="patient-pagination">
              <button className="button secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</button>
              <span>Página {checkins.data.pagination.page} de {checkins.data.pagination.total_pages}</span>
              <button className="button secondary" disabled={page >= checkins.data.pagination.total_pages} onClick={() => setPage((current) => current + 1)}>Próxima</button>
            </div>
          </>
        ) : <EmptyState description="Nenhum check-in encontrado." />}
      </section>
      <CheckinDetailModal item={selectedCheckin} onClose={() => setSelectedCheckin(null)} revealSensitive={showSymptomDescriptions} />
    </div>
  );
}
