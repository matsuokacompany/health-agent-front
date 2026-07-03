import { Card } from '@/components/ui/design';
import { EmptyState, LoadingState } from '@/components/ui/states';

export function ReadOnlyAnamnese({ info, loading }: { info: string; loading: boolean }) {
  return <Card><div className="readonly-section-header"><span className="badge">🔒 Somente leitura</span><p className="muted">A anamnese original é imutável para o paciente e fica disponível apenas para consulta.</p></div>{loading ? <LoadingState message="Carregando anamnese..." /> : info ? <pre className="readonly-clinical-text">{info}</pre> : <EmptyState description="Nenhuma anamnese encontrada." />}</Card>;
}
