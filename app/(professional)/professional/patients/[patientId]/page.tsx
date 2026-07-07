'use client';
import Link from 'next/link';
import { use, useState } from 'react';

import { useAuth } from '@/components/auth/AuthProvider';
import { generateProfessionalAiReport, useProfessionalAnamnese, useProfessionalCheckIns, useProfessionalDashboard } from '@/hooks/useProfessional';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/states';
import type { ClinicalAiReport, PreventiveAiReport, ProfessionalAiReportResponse } from '@/services/professional';

function fmt(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: value.includes('T') ? 'short' : undefined }).format(new Date(value)) : '—'; }
function listItems(items?: string[]) { return items?.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">Nenhum item listado.</p>; }

function ClinicalAiReportView({ report }: { report: ProfessionalAiReportResponse }) {
  if (report.modo !== 'avaliacao_clinica') return null;
  const ai = report.ai as ClinicalAiReport;
  const clinical = ai.avaliacao_clinica;

  return <section className="ai-report-view">
    <h2>Relatório IA da semana</h2>
    <p className="notice">Este relatório é uma análise automatizada de apoio. Ele pode sugerir hipóteses clínicas, mas não confirma diagnóstico. A avaliação final deve ser feita por um profissional de saúde.</p>
    <p className="muted">Este relatório é reutilizado durante a semana para evitar custos adicionais.</p>
    <h3>Hipótese principal</h3><p>{clinical?.hipotese_principal || 'Não informado'}</p>
    <h3>Possíveis doenças / hipóteses clínicas</h3><p className="muted">Possíveis hipóteses clínicas, não diagnóstico confirmado.</p>{listItems(clinical?.possiveis_doencas)}
    <h3>Nível de suspeição</h3><p>{clinical?.nivel_de_suspeicao || 'Não informado'}</p>
    <h3>Justificativas</h3>{listItems(clinical?.justificativa)}
    <h3>Especialista recomendado</h3><p>{ai.especialista_recomendado || 'Não informado'}</p>
    <h3>Exames prioritários</h3>{listItems(ai.exames_prioritarios)}
    <h3>Urgência</h3><p>{ai.urgencia || 'Não informada'}</p>
    <h3>Alerta legal</h3><p>{ai.alerta_legal || 'Este relatório não substitui avaliação profissional.'}</p>
  </section>;
}

function PreventiveAiReportView({ report }: { report: ProfessionalAiReportResponse }) {
  if (report.modo !== 'preventivo') return null;
  const ai = report.ai as PreventiveAiReport;

  return <section className="ai-report-view">
    <h2>Relatório preventivo IA</h2>
    <p className="notice">Este relatório é uma análise automatizada de apoio. Ele pode sugerir hipóteses clínicas, mas não confirma diagnóstico. A avaliação final deve ser feita por um profissional de saúde.</p>
    <p className="muted">Este relatório é reutilizado durante a semana para evitar custos adicionais.</p>
    {(['otimista', 'intermediario', 'grave'] as const).map((scenario) => <div key={scenario}>
      <h3>Cenário {scenario}</h3>
      <p>{ai.cenarios?.[scenario]?.descricao || 'Não informado'}</p>
      <p>Condições: {ai.cenarios?.[scenario]?.condicoes_para_ocorrer || 'Não informado'}</p>
      <p>Probabilidade: {ai.cenarios?.[scenario]?.probabilidade || 'Não informada'}</p>
    </div>)}
    <h3>Cenário mais provável</h3><p>{ai.cenario_mais_provavel || 'Não informado'}</p>
    <h3>Especialista recomendado</h3><p>{ai.especialista_recomendado || 'Não informado'}</p>
    <h3>Exames sugeridos</h3>{listItems(ai.exames_sugeridos)}
    <h3>Alerta importante</h3><p>{ai.alerta_importante || 'Este relatório não substitui avaliação profissional.'}</p>
  </section>;
}

function AiReportDetails({ report }: { report: ProfessionalAiReportResponse }) {
  return <>
    <ClinicalAiReportView report={report} />
    <PreventiveAiReportView report={report} />
    <details>
      <summary>Ver dados enviados para IA</summary>
      <pre className="readonly-clinical-text">{report.clinical_summary}</pre>
    </details>
  </>;
}

export default function PatientDetail({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const { isProfessional, isSuperAdmin } = useAuth();
  const dashboard = useProfessionalDashboard(patientId);
  const anamnese = useProfessionalAnamnese(patientId);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [hadSymptoms, setHadSymptoms] = useState<'' | boolean>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const checkins = useProfessionalCheckIns(patientId, { page, per_page: 10, status, had_symptoms: hadSymptoms, order });
  const [aiReport, setAiReport] = useState<ProfessionalAiReportResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canGenerateAiReport = isProfessional || isSuperAdmin;

  async function handleGenerate() {
    if (isGenerating) return;
    setIsGenerating(true); setAiError(null);
    try { setAiReport(await generateProfessionalAiReport(patientId, { periodo: 'semanal', modo: 'avaliacao_clinica' })); }
    catch (error) { setAiError(error instanceof Error ? error.message : 'Erro ao gerar relatório de IA.'); }
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
    <section className="card patient-table-section"><h2>Check-ins</h2><div className="patient-filter-grid compact"><label>Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Todos</option><option value="PENDING">Pendente</option><option value="AWAITING_SYMPTOM_DESCRIPTION">Aguardando sintomas</option><option value="AWAITING_CAUSE">Aguardando causa (legado)</option><option value="COMPLETED">Concluído</option><option value="EXPIRED">Expirado</option></select></label><label>Sintomas<select value={String(hadSymptoms)} onChange={(event) => { setHadSymptoms(event.target.value === '' ? '' : event.target.value === 'true'); setPage(1); }}><option value="">Todos</option><option value="true">Com sintomas</option><option value="false">Sem sintomas</option></select></label><label>Ordem<select value={order} onChange={(event) => setOrder(event.target.value as 'asc' | 'desc')}><option value="desc">Mais recentes</option><option value="asc">Mais antigos</option></select></label></div>{checkins.isLoading ? <p className="muted">Carregando check-ins...</p> : checkins.data?.items.length ? <><div className="table-wrap"><table><thead><tr><th>Data</th><th>Status</th><th>Sintomas</th><th>Descrição dos sintomas</th></tr></thead><tbody>{checkins.data.items.map((item) => <tr key={item.id}><td>{fmt(item.report_date)}</td><td>{item.status ?? '—'}</td><td>{item.had_symptoms === true ? 'Sim' : item.had_symptoms === false ? 'Não' : '—'}</td><td>{item.symptom_description ?? '—'}</td></tr>)}</tbody></table></div><div className="patient-pagination"><button className="button secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span>Página {checkins.data.pagination.page} de {checkins.data.pagination.total_pages}</span><button className="button secondary" disabled={page >= checkins.data.pagination.total_pages} onClick={() => setPage((current) => current + 1)}>Próxima</button></div></> : <EmptyState description="Nenhum check-in encontrado." />}</section>
    <section className="split"><article className="card"><h2>Anamnese completa</h2>{anamnese.isLoading ? <p className="muted">Carregando anamnese...</p> : anamnese.error ? <p className="muted">Anamnese não encontrada.</p> : <pre className="readonly-clinical-text">{String(anamnese.data?.info ?? '')}</pre>}</article><article className="card"><h2>Relatório IA da semana</h2><p className="muted">Disponível 1 vez por semana por paciente. Novas solicitações nesta semana reutilizam o relatório já gerado.</p>{canGenerateAiReport ? <button onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? 'Gerando relatório...' : aiReport ? 'Ver relatório IA da semana' : 'Gerar relatório IA da semana'}</button> : null}{aiError ? <p className="danger">{aiError}</p> : null}{aiReport ? <AiReportDetails report={aiReport} /> : null}</article></section>
  </>;
}
