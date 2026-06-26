import { Card } from '@/components/ui/design';
import { EmptyState, LoadingState } from '@/components/ui/states';

export function ReadOnlyAnamnese({ info, loading }: { info: string; loading: boolean }) {
  return <Card><div className="readonly-section-header"><span className="badge">🔒 Somente leitura</span><h2>Anamnese original</h2><p className="muted">Este registro foi criado pelo primeiro profissional responsável e não pode ser editado ou excluído pelo paciente.</p></div>{loading ? <LoadingState message="Carregando anamnese..." /> : info ? <pre className="readonly-clinical-text">{info}</pre> : <EmptyState description="Nenhuma anamnese encontrada." />}</Card>;
}
