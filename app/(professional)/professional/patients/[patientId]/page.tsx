'use client';
import Link from 'next/link';
import { use, useState } from 'react';

import { generateProfessionalAiReport, useProfessionalAnamnese, useProfessionalCheckIns, useProfessionalDashboard } from '@/hooks/useProfessional';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/states';
import type { ProfessionalAiReportResponse } from '@/services/professional';

function fmt(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.includes('T') ? 'short' : undefined }).format(new Date(value)) : '—'; }
function jsonText(value: unknown) { return JSON.stringify(value, null, 2); }

export default function PatientDetail({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const dashboard = useProfessionalDashboard(patientId);
  const anamnese = useProfessionalAnamnese(patientId);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [hadSymptoms, setHadSymptoms] = useState<'' | boolean>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const checkins = useProfessionalCheckIns(patientId, { page, per_page: 10, status, had_symptoms: hadSymptoms, order });
  const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensal'>('semanal');
  const [modo, setModo] = useState<'preventivo' | 'avaliacao_clinica'>('avaliacao_clinica');
  const [aiReport, setAiReport] = useState<ProfessionalAiReportResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true); setAiError(null);
    try { setAiReport(await generateProfessionalAiReport(patientId, { periodo, modo })); }
    catch (error) { setAiError(error instanceof Error ? error.message : 'Falha ao gerar relatório com IA.'); }
    finally { setIsGenerating(false); }
  }

  if (dashboard.isLoading) return <LoadingState message="Carregando prontuário profissional..." />;
  if (dashboard.error) return <ErrorState message={dashboard.error.message} />;
  const data = dashboard.data;
  const stats = data?.statistics;

  return <>
    <div className="topbar"><span className="badge">Prontuário vinculado</span><Link href="/professional/patients">← Pacientes</Link></div>
    <header className="page-header"><div><span className="eyebrow">Visão 360°</span><h1>{data?.user?.name ?? 'Prontuário do paciente'}</h1><p className="muted">Dashboard profissional com check-ins, anamnese e relatório clínico por IA.</p></div></header>
    <section className="grid"><article className="card"><span className={data?.monitoring?.active ? 'badge success' : 'badge'}>{data?.monitoring?.active ? 'Plano ativo' : 'Plano inativo'}</span><h2>{data?.monitoring?.title ?? 'Plano de acompanhamento'}</h2><p className="muted">Início: {fmt(data?.monitoring?.start_date)} · Fim: {fmt(data?.monitoring?.end_date)}</p></article><article className="card"><span className="metric-label">Aderência</span><div className="metric">{stats?.adherence ?? 0}%</div><p className="muted">{stats?.answered ?? 0} respondidos de {stats?.total ?? 0}</p></article><article className="card"><span className="metric-label">Sintomas</span><div className="metric">{stats?.with_symptoms ?? 0}</div><p className="muted">{stats?.missed ?? 0} check-ins perdidos</p></article></section>
    <section className="split"><article className="card"><span className="badge">Check-in de hoje</span><h2>{data?.today?.status ?? 'Sem status'}</h2><p className="muted">Respondido: {data?.today?.completed ? 'Sim' : 'Não'} · Próximo: {fmt(data?.next_checkin?.scheduled_at)}</p></article><article className="card"><span className="badge">Anamnese</span><h2>Resumo clínico</h2><p>{Array.isArray(data?.anamnesis_summary?.preview) ? data?.anamnesis_summary?.preview.join(', ') : data?.anamnesis_summary?.preview || 'Resumo não disponível.'}</p></article></section>
    <section className="card patient-table-section"><h2>Check-ins</h2><div className="patient-filter-grid compact"><label>Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Todos</option><option value="PENDING">Pendente</option><option value="AWAITING_SYMPTOM_DESCRIPTION">Aguardando sintomas</option><option value="AWAITING_CAUSE">Aguardando causa</option><option value="COMPLETED">Concluído</option><option value="EXPIRED">Expirado</option></select></label><label>Sintomas<select value={String(hadSymptoms)} onChange={(event) => { setHadSymptoms(event.target.value === '' ? '' : event.target.value === 'true'); setPage(1); }}><option value="">Todos</option><option value="true">Com sintomas</option><option value="false">Sem sintomas</option></select></label><label>Ordem<select value={order} onChange={(event) => setOrder(event.target.value as 'asc' | 'desc')}><option value="desc">Mais recentes</option><option value="asc">Mais antigos</option></select></label></div>{checkins.isLoading ? <p className="muted">Carregando check-ins...</p> : checkins.data?.items.length ? <><div className="table-wrap"><table><thead><tr><th>Data</th><th>Status</th><th>Sintomas</th><th>Descrição</th></tr></thead><tbody>{checkins.data.items.map((item) => <tr key={item.id}><td>{fmt(item.report_date)}</td><td>{item.status ?? '—'}</td><td>{item.had_symptoms === true ? 'Sim' : item.had_symptoms === false ? 'Não' : '—'}</td><td>{item.symptom_description ?? item.suspected_cause ?? '—'}</td></tr>)}</tbody></table></div><div className="patient-pagination"><button className="button secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span>Página {checkins.data.pagination.page} de {checkins.data.pagination.total_pages}</span><button className="button secondary" disabled={page >= checkins.data.pagination.total_pages} onClick={() => setPage((current) => current + 1)}>Próxima</button></div></> : <EmptyState description="Nenhum check-in encontrado." />}</section>
    <section className="split"><article className="card"><h2>Anamnese completa</h2>{anamnese.isLoading ? <p className="muted">Carregando anamnese...</p> : anamnese.error ? <p className="muted">Anamnese não encontrada.</p> : <pre className="readonly-clinical-text">{String(anamnese.data?.info ?? '')}</pre>}</article><article className="card"><h2>Relatório IA</h2><div className="patient-filter-grid compact"><label>Período<select value={periodo} onChange={(event) => setPeriodo(event.target.value as typeof periodo)}><option value="diario">Diário</option><option value="semanal">Semanal</option><option value="mensal">Mensal</option></select></label><label>Modo<select value={modo} onChange={(event) => setModo(event.target.value as typeof modo)}><option value="avaliacao_clinica">Avaliação clínica</option><option value="preventivo">Preventivo</option></select></label></div><button onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? 'Gerando...' : 'Gerar relatório'}</button>{aiError ? <p className="danger">{aiError}</p> : null}{aiReport ? <><h3>Resumo clínico enviado</h3><pre className="readonly-clinical-text">{aiReport.clinical_summary}</pre><h3>Resposta da IA</h3><pre className="readonly-clinical-text">{jsonText(aiReport.ai)}</pre></> : null}</article></section>
  </>;
}
