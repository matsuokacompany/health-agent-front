import { EmptyState } from '@/components/ui/states';
import type { DashboardProfessional } from '@/services/patientDashboard';
import { DashboardSection } from './DashboardSection';

export function ProfessionalsCard({ professionals, loading }: { professionals?: DashboardProfessional[]; loading?: boolean }) {
  return <DashboardSection title="Minha equipe" eyebrow="Cuidado responsável" loading={loading}>
    {professionals?.length ? <div className="patient-team-list">{professionals.map((professional) => {
      const photo = professional.photo_url || professional.avatar_url;
      return <div className="patient-team-card" key={professional.id}><div className="patient-avatar">{photo ? <img src={String(photo)} alt={`Foto de ${professional.name}`} /> : <span>{professional.name.slice(0, 1)}</span>}</div><div><strong>{professional.name}</strong><p className="muted compact">{professional.specialty ?? 'Especialidade não informada'}</p></div></div>;
    })}</div> : <EmptyState description="Sua equipe responsável aparecerá aqui quando o plano for definido." />}
  </DashboardSection>;
}
