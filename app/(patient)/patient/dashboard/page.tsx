'use client';

import { useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button, Card, PageHeader } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { AlertsCard } from '@/components/patient/dashboard/AlertsCard';
import { AnamnesisSummaryCard } from '@/components/patient/dashboard/AnamnesisSummaryCard';
import { CheckInSummaryCard } from '@/components/patient/dashboard/CheckInSummaryCard';
import { CheckInsTable } from '@/components/patient/dashboard/CheckInsTable';
import { HistoryTable } from '@/components/patient/dashboard/HistoryTable';
import { PatientCalendar } from '@/components/patient/dashboard/PatientCalendar';
import { ProfessionalsCard } from '@/components/patient/dashboard/ProfessionalsCard';
import { StatisticsPanel } from '@/components/patient/dashboard/StatisticsPanel';
import { SummaryCards } from '@/components/patient/dashboard/SummaryCards';
import { usePatientDashboardOverview } from '@/hooks/usePatientDashboard';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function WelcomeCard({ name, loading }: { name?: string; loading?: boolean }) {
  return <Card className="patient-welcome-card patient-dashboard-hero patient-dashboard-section">
    <span className="eyebrow patient-card-eyebrow">Acompanhamento do paciente</span>
    <h2>{loading ? <SkeletonBlock className="sk-title" /> : `${getGreeting()}, ${name ?? 'paciente'}`}</h2>
    {loading ? <SkeletonBlock /> : <p>Seu dashboard carrega primeiro o resumo essencial e atualiza calendário, histórico, estatísticas e check-ins de forma independente.</p>}
  </Card>;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = usePatientDashboardOverview();
  const patientName = useMemo(() => data?.patient?.name ?? user?.name, [data?.patient?.name, user?.name]);

  return <>
    <PageHeader eyebrow="Portal do paciente" title="Dashboard" description="Informações essenciais do seu acompanhamento em um só lugar." action={<Button href="/patient/monitoring">Responder check-in</Button>} />
    <section className="patient-dashboard-layout patient-dashboard-smooth">
      <WelcomeCard name={patientName} loading={isLoading} />
      <SummaryCards plan={data?.activePlan} statistics={data?.statistics} loading={isLoading} />
      <ProfessionalsCard professionals={data?.professionals} loading={isLoading} />
      <AnamnesisSummaryCard summary={data?.anamnesisSummary} loading={isLoading} />
      <CheckInSummaryCard todayCheckIn={data?.todayCheckIn} nextCheckIn={data?.nextCheckIn} loading={isLoading} />
      <AlertsCard alerts={data?.alerts} loading={isLoading} />
      <PatientCalendar plan={data?.activePlan} />
      <StatisticsPanel />
      <HistoryTable />
      <CheckInsTable />
    </section>
  </>;
}
