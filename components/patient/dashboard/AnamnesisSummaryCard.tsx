import { DashboardSection } from './DashboardSection';

export function AnamnesisSummaryCard({ summary, loading }: { summary?: string | null; loading?: boolean }) {
  return <DashboardSection title="Resumo da anamnese" eyebrow="Perfil clínico" loading={loading}>
    <p className="patient-anamnesis-summary">{summary || 'Resumo da anamnese ainda não disponível.'}</p>
  </DashboardSection>;
}
