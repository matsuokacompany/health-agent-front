'use client';
import Link from 'next/link';
import { use, useState } from 'react';

import { useProfessionalCheckIns, useProfessionalDashboard } from '@/hooks/useProfessional';
import { AiReportsJourney } from '@/components/professional/AiReportsJourney';
import { PatientAnamneseEditor } from '@/components/professional/PatientAnamneseEditor';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/states';
import { ClinicalImagesSection } from '@/components/clinical-images/ClinicalImagesSection';

type PatientDetailTab = 'overview' | 'checkins' | 'clinical' | 'reports';

const patientDetailTabs: Array<{ id: PatientDetailTab; label: string; description: string }> = [
  { id: 'overview', label: 'Visão geral', description: 'Plano, adesão e situação de hoje' },
  { id: 'checkins', label: 'Check-ins', description: 'Histórico e sintomas' },
  { id: 'clinical', label: 'Dados clínicos', description: 'Anamnese e imagens' },
  { id: 'reports', label: 'Relatórios IA', description: 'Análises de apoio clínico' },
];

function fmt(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.includes('T') ? 'short' : undefined }).format(new Date(value)) : '—'; }
function SensitivePlaceholder({ label = 'Informação sensível oculta' }: { label?: string }) { return <span className="sensitive-placeholder">🔒 {label}</span>; }
export default function PatientDetail({ params, searchParams }: { params: Promise<{ patientId: string }>; searchParams: Promise<{ created?: string; anamneseError?: string }> }) {
  const { patientId } = use(params);
  const selectedPatientId = Number(patientId);
  const { created, anamneseError } = use(searchParams);
  const dashboard = useProfessionalDashboard(patientId);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [hadSymptoms, setHadSymptoms] = useState<'' | boolean>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const checkins = useProfessionalCheckIns(patientId, { page, per_page: 10, status, had_symptoms: hadSymptoms, order });
  const [showSymptomDescriptions, setShowSymptomDescriptions] = useState(true);
  const [activeTab, setActiveTab] = useState<PatientDetailTab>('overview');

  if (dashboard.isLoading) return <LoadingState message="Carregando prontuário profissional..." />;
  if (dashboard.error) return <ErrorState message={dashboard.error.message} />;
  const data = dashboard.data;
  const stats = data?.statistics;

  const displayName = data?.user?.name ?? 'Prontuário do paciente';

  return <div className="professional-patient-detail">
    {created === '1' ? <p className="notice success" role="status">Paciente cadastrado. O acesso à conta será vinculado pelo fluxo de autenticação/convite da plataforma.</p> : null}
    {anamneseError === '1' ? <p className="notice danger" role="alert">Paciente cadastrado com sucesso, mas não foi possível salvar a anamnese. Você poderá adicioná-la posteriormente na edição do paciente.</p> : null}
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/professional">Profissional</Link><span>/</span><Link href="/professional/patients">Pacientes</Link><span>/</span><span>{displayName ?? 'Prontuário'}</span></nav>
    <nav className="professional-patient-tabs" aria-label="Seções do prontuário" role="tablist">
      {patientDetailTabs.map((tab) => <button id={`patient-tab-${tab.id}`} className={activeTab === tab.id ? 'active' : ''} key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`patient-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)}><span>{tab.label}</span><small>{tab.description}</small></button>)}
    </nav>
    <div id={`patient-panel-${activeTab}`} className="professional-tab-panel" role="tabpanel" aria-labelledby={`patient-tab-${activeTab}`}>
      {activeTab === 'overview' ? <div className="professional-tab-content"><section className="grid professional-detail-section"><article className="card"><span className={data?.monitoring?.active ? 'badge success' : 'badge'}>{data?.monitoring?.active ? 'Plano ativo' : 'Plano inativo'}</span><h2>{data?.monitoring?.title ?? 'Plano de acompanhamento'}</h2><p className="muted">Início: {fmt(data?.monitoring?.start_date)} · Fim: {fmt(data?.monitoring?.end_date)}</p></article><article className="card"><span className="metric-label">Aderência</span><div className="metric">{stats?.adherence ?? 0}%</div><p className="muted">{stats?.answered ?? 0} respondidos de {stats?.total ?? 0}</p></article><article className="card"><span className="metric-label">Sintomas</span><div className="metric">{stats?.with_symptoms ?? 0}</div><p className="muted">{stats?.missed ?? 0} check-ins perdidos</p></article></section><section className="split professional-detail-section"><article className="card"><span className="badge">Check-in de hoje</span><h2>{data?.today?.status ?? 'Sem status'}</h2><p className="muted">Respondido: {data?.today?.completed ? 'Sim' : 'Não'} · Próximo: {fmt(data?.next_checkin?.scheduled_at)}</p></article><article className="card"><span className="badge">Anamnese</span><h2>Resumo clínico</h2><p>{Array.isArray(data?.anamnesis_summary?.preview) ? data?.anamnesis_summary?.preview.join(', ') : data?.anamnesis_summary?.preview || 'Resumo não disponível.'}</p></article></section></div> : null}
      {activeTab === 'checkins' ? <section id="patient-checkins" className="card patient-table-section professional-detail-section"><div className="professional-section-heading"><div><h2>Check-ins</h2><p className="muted compact">Filtre o histórico e controle a exibição das informações sensíveis.</p></div><button className="button secondary" type="button" onClick={() => setShowSymptomDescriptions((current) => !current)}>{showSymptomDescriptions ? 'Ocultar sintomas' : 'Exibir sintomas'}</button></div><div className="patient-filter-grid compact"><label>Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Todos</option><option value="PENDING">Pendente</option><option value="AWAITING_SYMPTOM_DESCRIPTION">Aguardando sintomas</option><option value="AWAITING_CAUSE">Aguardando causa (legado)</option><option value="COMPLETED">Concluído</option><option value="EXPIRED">Expirado</option></select></label><label>Sintomas<select value={String(hadSymptoms)} onChange={(event) => { setHadSymptoms(event.target.value === '' ? '' : event.target.value === 'true'); setPage(1); }}><option value="">Todos</option><option value="true">Com sintomas</option><option value="false">Sem sintomas</option></select></label><label>Ordem<select value={order} onChange={(event) => setOrder(event.target.value as 'asc' | 'desc')}><option value="desc">Mais recentes</option><option value="asc">Mais antigos</option></select></label></div>{checkins.isLoading ? <p className="muted">Carregando check-ins...</p> : checkins.data?.items.length ? <><div className="table-wrap"><table><thead><tr><th>Data</th><th>Status</th><th>Sintomas</th><th>Descrição dos sintomas</th></tr></thead><tbody>{checkins.data.items.map((item) => <tr key={item.id}><td>{fmt(item.report_date)}</td><td>{item.status ?? '—'}</td><td>{item.had_symptoms === true ? 'Sim' : item.had_symptoms === false ? 'Não' : '—'}</td><td>{showSymptomDescriptions ? item.symptom_description ?? '—' : <SensitivePlaceholder label="Descrição oculta" />}</td></tr>)}</tbody></table></div><div className="patient-pagination"><button className="button secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span>Página {checkins.data.pagination.page} de {checkins.data.pagination.total_pages}</span><button className="button secondary" disabled={page >= checkins.data.pagination.total_pages} onClick={() => setPage((current) => current + 1)}>Próxima</button></div></> : <EmptyState description="Nenhum check-in encontrado." />}</section> : null}
      {activeTab === 'clinical' ? <div className="professional-tab-content">{Number.isSafeInteger(selectedPatientId) && selectedPatientId > 0 ? <ClinicalImagesSection patientId={selectedPatientId} /> : <ErrorState message="Paciente inválido." />}<PatientAnamneseEditor patientId={patientId} /></div> : null}
      {activeTab === 'reports' ? <AiReportsJourney patientId={patientId} monitoringStart={data?.monitoring?.start_date} patientName={displayName} /> : null}
    </div>
  </div>;
}
