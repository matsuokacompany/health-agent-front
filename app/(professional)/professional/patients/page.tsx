'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useProfessionalPatients } from '@/hooks/useProfessional';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/states';

function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—'; }
function statusLabel(status?: string | null) { return status ? status.replace(/_/g, ' ') : 'Sem check-in'; }

export default function Patients() {
  const { data, isLoading, error } = useProfessionalPatients();
  const [query, setQuery] = useState('');
  const patients = useMemo(() => (data ?? []).filter((patient) => `${patient.name} ${patient.email ?? ''}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  const activeCount = (data ?? []).filter((patient) => patient.active).length;
  const symptomCount = (data ?? []).reduce((sum, patient) => sum + (patient.symptom_reports_count ?? 0), 0);

  if (isLoading) return <LoadingState message="Carregando pacientes monitorados..." />;
  if (error) return <ErrorState message={error.message} />;

  return <>
    <div className="topbar"><span className="badge">⚕️ Painel médico</span><span className="muted">{patients.length} paciente(s)</span></div>
    <header className="page-header"><div><span className="eyebrow">Acompanhamento</span><h1>Pacientes em acompanhamento</h1><p className="muted">Acompanhe pacientes vinculados aos seus planos ativos e acesse dashboard, anamnese, check-ins e relatório com IA.</p></div></header>
    <section className="grid"><article className="card"><span className="metric-label">Pacientes ativos</span><div className="metric">{activeCount}</div></article><article className="card"><span className="metric-label">Relatos de sintomas</span><div className="metric">{symptomCount}</div></article><article className="card"><label>Buscar paciente<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou e-mail" /></label></article></section>
    {patients.length ? <div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Plano</th><th>Último check-in</th><th>Sintomas</th><th>Ações</th></tr></thead><tbody>{patients.map((patient) => <tr key={patient.patient_id}><td><strong>{patient.name}</strong><br /><span className="muted">{patient.email ?? patient.phone ?? 'Sem contato'}</span></td><td><span className={patient.active ? 'badge success' : 'badge'}>{patient.active ? 'Ativo' : 'Inativo'}</span><br />{patient.plan_title ?? `Plano #${patient.monitoring_plan_id}`}</td><td>{formatDate(patient.last_checkin_at)}<br /><span className="muted">{statusLabel(patient.last_status)}</span></td><td>{patient.symptom_reports_count}</td><td><Link className="button" href={`/professional/patients/${patient.patient_id}`}>Ver prontuário</Link></td></tr>)}</tbody></table></div> : <EmptyState description="Nenhum paciente monitorado encontrado." />}
  </>;
}
