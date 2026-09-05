'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useProfessionalPatients } from '@/hooks/useProfessional';
import { ErrorState, EmptyState } from '@/components/ui/states';
import { NewPatientModal } from '@/components/professional/NewPatientModal';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { TableSkeleton } from '@/components/ui/Loading';
import { useAuth } from '@/components/auth/AuthProvider';

function LoadingPatients() {
  return <div aria-busy="true" aria-label="Carregando pacientes monitorados">
    <section className="grid">
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-metric" /></article>
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock className="sk-metric" /></article>
      <article className="card"><SkeletonBlock className="sk-eyebrow" /><SkeletonBlock /></article>
    </section>
    <TableSkeleton rows={6} columns={5} />
  </div>;
}

const DAILY_REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  AWAITING_SYMPTOM_DESCRIPTION: 'Aguardando sintomas',
  AWAITING_CAUSE: 'Aguardando causa (legado)',
  COMPLETED: 'Concluído',
  EXPIRED: 'Expirado',
};

function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—'; }
function statusLabel(status?: string | null) { return status ? DAILY_REPORT_STATUS_LABELS[status] ?? status.replace(/_/g, ' ') : 'Sem check-in'; }

export default function Patients() {
  const { isProfessional } = useAuth();
  const searchParams = useSearchParams();
  const { data, isLoading, error } = useProfessionalPatients();
  const [query, setQuery] = useState(() => searchParams.get('query') ?? '');
  useEffect(() => { setQuery(searchParams.get('query') ?? ''); }, [searchParams]);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const patients = useMemo(() => (data ?? []).filter((patient) => `${patient.name} ${patient.email ?? ''}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  const activeCount = (data ?? []).filter((patient) => patient.active).length;
  const symptomCount = (data ?? []).reduce((sum, patient) => sum + (patient.symptom_reports_count ?? 0), 0);

  if (isLoading) return <LoadingPatients />;
  if (error) return <ErrorState message={error.message} />;

  return <>
    {isProfessional ? <div className="page-actions professional-patients-actions"><button type="button" data-tour="new-patient" onClick={() => setNewPatientOpen(true)}>Novo paciente</button></div> : null}
    <section className="grid" data-tour="patients-metrics"><article className="card"><span className="metric-label">Pacientes ativos</span><div className="metric">{activeCount}</div></article><article className="card"><span className="metric-label">Relatos de sintomas</span><div className="metric">{symptomCount}</div></article><article className="card"><label>Buscar paciente<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou e-mail" /></label></article></section>
    {patients.length ? <div className="table-wrap" data-tour="patients-table"><table><thead><tr><th>Paciente</th><th>Plano</th><th>Último check-in</th><th>Sintomas</th><th>Ações</th></tr></thead><tbody>{patients.map((patient) => <tr key={patient.patient_id}><td><strong>{patient.name}</strong><br /><span className="muted">{patient.email ?? patient.phone ?? 'Sem contato'}</span></td><td><span className={patient.active ? 'badge success' : 'badge'}>{patient.active ? 'Ativo' : 'Inativo'}</span>{patient.has_own_subscription ? <span className="badge" title="Este paciente já paga sua própria assinatura do assistente de IA — não conta na sua cota de pacientes.">Já assina</span> : null}<br />{patient.plan_title ?? `Plano #${patient.monitoring_plan_id}`}</td><td>{formatDate(patient.last_checkin_at)}<br /><span className="muted">{statusLabel(patient.last_status)}</span></td><td>{patient.symptom_reports_count}</td><td><Link className="button" href={`/professional/patients/${patient.patient_id}`}>Ver prontuário</Link></td></tr>)}</tbody></table></div> : <EmptyState description="Nenhum paciente monitorado encontrado." />}
    {isProfessional ? <NewPatientModal open={newPatientOpen} onClose={() => setNewPatientOpen(false)} /> : null}
  </>;
}
