'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';
import { usePatientDashboardHistory } from '@/hooks/usePatientDashboard';
import type { DashboardPeriod, DashboardStatus, DashboardSymptomFilter, SortDirection } from '@/services/patientDashboard';
import { DashboardSection } from './DashboardSection';
import { formatDashboardDate, getCheckInStatusLabel } from './dashboardUtils';

export function HistoryTable() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const [status, setStatus] = useState<DashboardStatus>('all');
  const [symptoms, setSymptoms] = useState<DashboardSymptomFilter>('all');
  const [sort, setSort] = useState<SortDirection>('desc');
  const params = useMemo(() => ({ page, perPage, period, status, symptoms, sort }), [page, perPage, period, status, symptoms, sort]);
  const { data, isLoading, isFetching } = usePatientDashboardHistory(params);
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil((data?.total ?? 0) / perPage));
  return <DashboardSection title="Histórico" eyebrow="Check-ins anteriores" loading={isLoading} className={`patient-table-section ${isFetching && !isLoading ? 'is-updating' : ''}`} skeletonLines={6}>
    <div className="patient-filter-grid"><label>Período<select value={period} onChange={(event) => { setPeriod(event.target.value as DashboardPeriod); setPage(1); }}><option value="7d">7 dias</option><option value="30d">30 dias</option><option value="90d">90 dias</option><option value="1y">1 ano</option></select></label><label>Status<select value={status} onChange={(event) => { setStatus(event.target.value as DashboardStatus); setPage(1); }}><option value="all">Todos</option><option value="completed">Respondidos</option><option value="pending">Pendentes</option><option value="expired">Expirados</option></select></label><label>Sintomas<select value={symptoms} onChange={(event) => { setSymptoms(event.target.value as DashboardSymptomFilter); setPage(1); }}><option value="all">Todos</option><option value="with">Com sintomas</option><option value="without">Sem sintomas</option></select></label><label>Ordenação<select value={sort} onChange={(event) => setSort(event.target.value as SortDirection)}><option value="desc">Mais recentes</option><option value="asc">Mais antigos</option></select></label><label>Por página<select value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setPage(1); }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select></label></div>
    {data?.items?.length ? <div className="table-wrap"><table><thead><tr><th>Data</th><th>Status</th><th>Sintomas</th><th>Descrição</th></tr></thead><tbody>{data.items.map((item) => <tr key={item.id}><td>{formatDashboardDate(item.date)}</td><td>{getCheckInStatusLabel(item.status)}</td><td>{item.had_symptoms === true ? 'Sim' : item.had_symptoms === false ? 'Não' : '—'}</td><td>{item.symptom_description ?? '—'}</td></tr>)}</tbody></table></div> : <EmptyState description="Nenhum registro encontrado para os filtros selecionados." />}
    <div className="patient-pagination"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button><span>Página {page} de {totalPages}</span><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div>
  </DashboardSection>;
}
