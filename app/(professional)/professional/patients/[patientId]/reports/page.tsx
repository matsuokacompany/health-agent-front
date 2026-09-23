'use client';
import { use } from 'react';

import { useProfessionalDashboard } from '@/hooks/useProfessional';
import { AiReportsJourney } from '@/components/professional/AiReportsJourney';
import { ErrorState } from '@/components/ui/states';
import { SkeletonBlock } from '@/components/ui/Skeleton';

export default function PatientReports({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const dashboard = useProfessionalDashboard(patientId);

  if (dashboard.error) return <ErrorState message={dashboard.error.message} />;
  if (dashboard.isLoading) return <section className="card ai-reports-section" aria-busy="true" aria-label="Carregando relatórios">
    <SkeletonBlock className="sk-title" /><SkeletonBlock /><SkeletonBlock className="sk-action" />
  </section>;

  const displayName = dashboard.data?.user?.name ?? 'Prontuário do paciente';

  return <AiReportsJourney patientId={patientId} monitoringStart={dashboard.data?.monitoring?.start_date} patientName={displayName} />;
}
