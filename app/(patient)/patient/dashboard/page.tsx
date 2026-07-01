'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { Button, Card, PageHeader } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/states';
import { createPatientDashboardSummary } from '@/services/patientDashboard';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function DashboardCard({ title, children, className = '', eyebrow }: { title: string; children: ReactNode; className?: string; eyebrow?: string }) {
  return <Card className={`patient-dashboard-card ${className}`.trim()}>{eyebrow ? <span className="eyebrow patient-card-eyebrow">{eyebrow}</span> : null}<h2>{title}</h2>{children}</Card>;
}

function LoadingDashboard() {
  return <section className="patient-dashboard-layout" aria-label="Carregando dashboard do paciente">
    <Card className="patient-welcome-card"><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>
    <Card><SkeletonBlock className="sk-title" /><div className="patient-info-list"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></div></Card>
    <Card><SkeletonBlock className="sk-title" /><SkeletonBlock className="sk-metric" /></Card>
    <Card><SkeletonBlock className="sk-title" /><div className="patient-checkin-list">{Array.from({ length: 7 }, (_, index) => <SkeletonBlock key={index} />)}</div></Card>
    <Card><SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock /></Card>
    <Card><SkeletonBlock className="sk-title" /><SkeletonBlock /></Card>
  </section>;
}

function SymptomIndicator({ status }: { status: 'none' | 'reported' | 'missing' }) {
  const labels = { none: '🟢 Sem sintomas', reported: '🟡 Sintomas informados', missing: '⚪ Não respondeu' };
  return <span className={`patient-symptom-indicator ${status}`}>{labels[status]}</span>;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { reports, plans, loading } = usePatientData();
  const dashboard = useMemo(() => createPatientDashboardSummary(reports, plans), [plans, reports]);
  const professionalPhoto = dashboard.professional?.photo_url || dashboard.professional?.avatar_url;

  return <>
    <PageHeader eyebrow="Portal do paciente" title="Dashboard" description="Informações essenciais do seu acompanhamento em um só lugar." action={<Button href="/patient/monitoring">Responder check-in</Button>} />
    {loading ? <LoadingDashboard /> : <section className="patient-dashboard-layout">
      <Card className="patient-welcome-card patient-dashboard-hero">
        <span className="eyebrow patient-card-eyebrow">Acompanhamento do paciente</span>
        <h2>{getGreeting()}, {user?.name ?? 'paciente'}</h2>
        <p>{dashboard.monitoringStatus === 'active' ? 'Seu acompanhamento está ativo. Continue respondendo seus check-ins para que sua equipe possa acompanhar sua evolução.' : 'Seu acompanhamento está encerrado. Seu histórico continua disponível para consulta com tranquilidade.'}</p>
      </Card>

      <DashboardCard title="Status do monitoramento" eyebrow="Monitoramento">
        <div className="patient-status-line"><span className={`patient-status-dot ${dashboard.monitoringStatus}`} />{dashboard.monitoringStatus === 'active' ? 'Monitoramento ativo' : 'Monitoramento encerrado'}</div>
        <dl className="patient-info-list">
          <div><dt>Plano</dt><dd>{dashboard.planName}</dd></div>
          <div><dt>Início</dt><dd>{dashboard.startDateLabel}</dd></div>
          <div><dt>Dias em acompanhamento</dt><dd>{dashboard.daysInCare}</dd></div>
          <div><dt>Último check-in</dt><dd>{dashboard.lastCheckInLabel}</dd></div>
        </dl>
      </DashboardCard>

      <DashboardCard title="Pendências" className={dashboard.hasPendingCheckIn ? 'patient-pending-card' : 'patient-ok-card'}>
        <p>{dashboard.hasPendingCheckIn ? 'Você possui um acompanhamento aguardando resposta.' : 'Você está em dia com seu acompanhamento.'}</p>
        {dashboard.hasPendingCheckIn ? <Button href="/patient/monitoring">Responder agora</Button> : null}
      </DashboardCard>

      <DashboardCard title="Histórico resumido" eyebrow="Últimos 7 check-ins" className="patient-history-card">
        {dashboard.recentCheckIns.length ? <div className="patient-checkin-list">{dashboard.recentCheckIns.map((checkIn) => <div className="patient-checkin-row" key={checkIn.id}><strong>{checkIn.dateLabel}</strong><span>{checkIn.answered ? 'Respondido' : 'Pendente'}</span><SymptomIndicator status={checkIn.symptomStatus} /></div>)}</div> : <EmptyState description="Seu histórico aparecerá aqui após os primeiros check-ins." />}
      </DashboardCard>

      <DashboardCard title="Minha equipe" eyebrow="Cuidado responsável">
        {dashboard.professional ? <div className="patient-team-card"><div className="patient-avatar">{professionalPhoto ? <img src={String(professionalPhoto)} alt={`Foto de ${dashboard.professional.name ?? 'profissional responsável'}`} /> : <span>{(dashboard.professional.name ?? 'Equipe').slice(0, 1)}</span>}</div><div><strong>{dashboard.professional.name ?? 'Profissional responsável'}</strong><p className="muted compact">{dashboard.professional.specialty ?? 'Especialidade não informada'}</p></div></div> : <EmptyState description="Sua equipe responsável aparecerá aqui quando o plano for definido." />}
      </DashboardCard>

      <DashboardCard title="Próximo acompanhamento" eyebrow="Próximo check-in">
        <p className="patient-next-checkin">{dashboard.nextCheckInLabel}</p>
      </DashboardCard>

      <DashboardCard title="Meu resumo" eyebrow="Indicadores simples" className="patient-summary-card">
        <div className="patient-summary-grid">
          <div><strong>{dashboard.daysInCare}</strong><span>Dias em acompanhamento</span></div>
          <div><strong>{dashboard.answeredCheckIns}</strong><span>Check-ins respondidos</span></div>
          <div><strong>{dashboard.adherenceRate}%</strong><span>Adesão</span></div>
          <div><strong>{dashboard.daysWithoutSymptoms}</strong><span>Dias sem sintomas</span></div>
          <div><strong>{dashboard.daysWithSymptoms}</strong><span>Dias com sintomas</span></div>
        </div>
      </DashboardCard>
    </section>}
  </>;
}
