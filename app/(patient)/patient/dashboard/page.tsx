'use client';

import { Button, Card, PageHeader } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { usePatientDashboard } from '@/hooks/usePatientDashboard';
import type { PatientDashboardAggregate, PatientDashboardTimelineDay } from '@/services/patientDashboard';

function formatDate(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function statusLabel(status?: string | null) {
  const normalized = String(status ?? '').toLowerCase();
  if (['active', 'em_andamento', 'ongoing'].includes(normalized)) return '🟢 Em andamento';
  if (['paused', 'pausado'].includes(normalized)) return '🟡 Pausado';
  if (['finished', 'completed', 'encerrado'].includes(normalized)) return '⚪ Encerrado';
  return status ? `🟢 ${status}` : 'Não informado';
}

function truncate(text?: string | null) {
  if (!text) return 'Nenhum resumo disponível.';
  return text.length > 150 ? `${text.slice(0, 147).trim()}...` : text;
}

function LoadingDashboard() {
  return <section className="patient-dashboard-v2"><Card className="patient-dashboard-main-card"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></Card></section>;
}

function EmptyDashboard() {
  return <Card className="patient-dashboard-empty"><span className="patient-empty-icon">🌱</span><h2>Nenhum acompanhamento ativo por enquanto</h2><p className="muted">Assim que um profissional iniciar seu acompanhamento, você verá aqui o objetivo, a evolução, os registros recentes e a próxima mensagem automática.</p><Button href="/patient/monitoring" variant="secondary">Ver área de acompanhamento</Button></Card>;
}

function ProgressCard({ data }: { data: PatientDashboardAggregate }) {
  return <Card className="patient-dashboard-progress-card"><div className="patient-card-heading"><span className="eyebrow">Progresso</span><strong>{data.progress}%</strong></div><div className="patient-progress-track" aria-label={`Progresso de ${data.progress}%`}><span style={{ width: `${data.progress}%` }} /></div><p className="muted compact">{data.daysElapsed} de {data.daysTotal} dias de acompanhamento.</p></Card>;
}

function SummaryCards({ data }: { data: PatientDashboardAggregate }) {
  const lastDate = data.lastResponse?.date ? formatDate(data.lastResponse.date) : 'Ainda não enviada';
  return <section className="patient-dashboard-summary-grid" aria-label="Resumo do acompanhamento">
    <Card><span className="metric-label">Dias acompanhados</span><div className="metric">{data.daysElapsed}</div></Card>
    <Card><span className="metric-label">Mensagens respondidas</span><div className="metric">{data.responses.answered}</div><p className="muted compact">de {data.responses.expected} esperadas</p></Card>
    <Card><span className="metric-label">Taxa de resposta</span><div className="metric">{data.responses.rate}%</div></Card>
    <Card><span className="metric-label">Última resposta enviada</span><div className="metric small-metric">{lastDate}</div></Card>
  </section>;
}

function SymptomsChart({ data }: { data: PatientDashboardAggregate }) {
  const total = data.symptoms.total || data.responses.answered || 0;
  const withoutPct = total ? Math.round((data.symptoms.withoutSymptoms / total) * 100) : 0;
  const withPct = total ? 100 - withoutPct : 0;
  return <Card className="patient-dashboard-chart-card"><span className="eyebrow">Evolução</span><h2>Dias com e sem sintomas</h2><div className="patient-donut-wrap"><div className="patient-donut" style={{ background: `conic-gradient(var(--ok) 0 ${withoutPct}%, var(--warn) ${withoutPct}% 100%)` }}><span>{total}<small>respostas</small></span></div><div className="patient-donut-list"><p><i className="ok" />Sem sintomas: <strong>{data.symptoms.withoutSymptoms} dias</strong></p><p><i className="warn" />Com sintomas: <strong>{data.symptoms.withSymptoms + data.symptoms.mildSymptoms} dias</strong></p><p className="muted compact">Percentuais calculados apenas sobre mensagens respondidas ({withPct}% com sintomas).</p></div></div></Card>;
}

const timelineMeta: Record<PatientDashboardTimelineDay['status'], { icon: string; label: string; className: string }> = { without_symptoms: { icon: '🟢', label: 'respondeu sem sintomas', className: 'ok' }, mild_symptoms: { icon: '🟡', label: 'respondeu com sintomas leves', className: 'mild' }, with_symptoms: { icon: '🔴', label: 'respondeu com sintomas', className: 'alert' }, no_response: { icon: '⚪', label: 'não respondeu', className: 'empty' } };
function Timeline({ days }: { days: PatientDashboardTimelineDay[] }) {
  return <Card className="patient-dashboard-timeline-card"><span className="eyebrow">Últimos 30 dias</span><h2>Linha do tempo</h2><div className="patient-timeline-grid">{days.map((day) => { const meta = timelineMeta[day.status] ?? timelineMeta.no_response; return <span key={day.date} className={meta.className} title={`${formatDate(day.date)}: ${day.label ?? meta.label}`} aria-label={`${formatDate(day.date)}: ${meta.label}`}>{meta.icon}<small>{new Date(`${day.date}T00:00:00`).getDate()}</small></span>; })}</div><div className="patient-timeline-legend"><span>🟢 sem sintomas</span><span>🟡 leves</span><span>🔴 com sintomas</span><span>⚪ não respondeu</span></div></Card>;
}

function NextPrompt({ data }: { data: PatientDashboardAggregate }) {
  const scheduled = formatDateTime(data.nextPrompt?.scheduled_at) ?? (data.nextPrompt?.date ? `${formatDate(data.nextPrompt.date)}${data.nextPrompt.time ? ` às ${data.nextPrompt.time}` : ''}` : null);
  return <Card className="patient-dashboard-next-card"><span className="eyebrow">Próxima mensagem</span><h2>{scheduled ?? 'Nenhuma próxima mensagem agendada'}</h2><p className="muted compact">{scheduled ? 'Envio automático previsto para o próximo contato.' : 'Quando houver um novo envio automático, ele aparecerá aqui.'}</p></Card>;
}

export default function PatientDashboard() {
  const { data, isLoading } = usePatientDashboard();
  if (isLoading) return <><PageHeader eyebrow="Portal do paciente" title="Dashboard" description="Resumo do seu acompanhamento." /><LoadingDashboard /></>;
  if (!data?.hasActiveMonitoring) return <><PageHeader eyebrow="Portal do paciente" title="Dashboard" description="Resumo do seu acompanhamento." /><EmptyDashboard /></>;
  return <><PageHeader eyebrow="Portal do paciente" title="Dashboard" description="Entenda seu objetivo, sua evolução e o próximo contato em poucos segundos." action={<Button href="/patient/monitoring">Responder mensagem</Button>} />
    <section className="patient-dashboard-v2">
      <Card className="patient-dashboard-main-card"><span className="eyebrow">Acompanhamento</span><h2>{data.goal ?? 'Objetivo não informado'}</h2><dl className="patient-objective-list"><div><dt>Objetivo</dt><dd>{data.goal ?? 'Não informado'}</dd></div><div><dt>Início</dt><dd>{formatDate(data.startDate)}</dd></div><div><dt>Término</dt><dd>{formatDate(data.endDate)}</dd></div><div><dt>Status</dt><dd>{statusLabel(data.status)}</dd></div></dl></Card>
      <ProgressCard data={data} />
      <SummaryCards data={data} />
      <SymptomsChart data={data} />
      <Timeline days={data.timeline} />
      <Card className="patient-dashboard-last-card"><span className="eyebrow">Último registro</span><h2>{data.lastResponse?.date ? formatDate(data.lastResponse.date) : 'Sem resposta registrada'}</h2>{data.lastResponse?.time ? <strong>{data.lastResponse.time}</strong> : null}<p>{truncate(data.lastResponse?.summary)}</p></Card>
      <NextPrompt data={data} />
    </section>
  </>;
}
