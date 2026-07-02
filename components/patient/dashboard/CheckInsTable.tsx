'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';
import { usePatientDashboardCheckIns } from '@/hooks/usePatientDashboard';
import type { DashboardStatus } from '@/services/patientDashboard';
import { DashboardSection } from './DashboardSection';
import { formatDashboardDate, getCheckInStatusLabel } from './dashboardUtils';

export function CheckInsTable() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [status, setStatus] = useState<DashboardStatus>('all');
  const params = useMemo(() => ({ page, perPage, status }), [page, perPage, status]);
  const { data, isLoading, isFetching } = usePatientDashboardCheckIns(params);
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil((data?.total ?? 0) / perPage));
  return <DashboardSection title="Check-ins" eyebrow="Lista completa" loading={isLoading} className={`patient-table-section ${isFetching && !isLoading ? 'is-updating' : ''}`} skeletonLines={5}>
    <div className="patient-filter-grid compact"><label>Status<select value={status} onChange={(event) => { setStatus(event.target.value as DashboardStatus); setPage(1); }}><option value="all">Todos</option><option value="completed">Respondidos</option><option value="pending">Pendentes</option><option value="expired">Expirados</option></select></label><label>Por página<select value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setPage(1); }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select></label></div>
    {data?.items?.length ? <div className="table-wrap"><table><thead><tr><th>Data</th><th>Status</th><th>Sintomas</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td>{formatDashboardDate(item.date)}</td><td>{getCheckInStatusLabel(item.status)}</td><td>{item.had_symptoms === true ? 'Sim' : item.had_symptoms === false ? 'Não' : '—'}</td></tr>)}</tbody></table></div> : <EmptyState description="Nenhum check-in encontrado." />}
    <div className="patient-pagination"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button><span>Página {page} de {totalPages}</span><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div>
  </DashboardSection>;
}
