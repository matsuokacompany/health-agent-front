import { Card } from '@/components/ui/design';
import { EmptyState, LoadingState } from '@/components/ui/states';

export function ReadOnlyAnamnese({ info, loading, hasProfessional }: { info: string; loading: boolean; hasProfessional?: boolean }) {
  const emptyDescription = hasProfessional
    ? 'Seu profissional ainda não registrou sua anamnese. Ela aparecerá aqui assim que ele preencher.'
    : 'A anamnese é preenchida por um profissional de saúde durante o acompanhamento clínico. Ao vincular-se a um profissional na Julha, ela passará a aparecer aqui.';
  return <Card><div className="readonly-section-header"><span className="badge">🔒 Somente leitura</span><p className="muted">A anamnese original é imutável para o paciente e fica disponível apenas para consulta.</p></div>{loading ? <LoadingState message="Carregando anamnese..." /> : info ? <pre className="readonly-clinical-text">{info}</pre> : <EmptyState title="Nenhuma anamnese encontrada" description={emptyDescription} />}</Card>;
}
