import { Card } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';

export type ProfessionalObservation = {
  id: string | number;
  professionalName: string;
  date: string;
  text: string;
};

export function ProfessionalObservations({ observations }: { observations: ProfessionalObservation[] }) {
  return <Card><div className="readonly-section-header"><span className="badge">🩺 Equipe clínica</span><h2>Observações dos profissionais</h2><p className="muted">Apenas profissionais podem adicionar observações ao histórico clínico.</p></div>{observations.length ? observations.map((item) => <article className="note-card" key={item.id}><strong>{item.professionalName}</strong><span className="muted">{item.date}</span><p>{item.text}</p></article>) : <EmptyState description="Nenhuma observação profissional registrada." />}</Card>;
}
