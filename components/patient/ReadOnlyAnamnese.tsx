import { Card } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';
import { SkeletonBlock } from '@/components/ui/Skeleton';

export function ReadOnlyAnamnese({ info, loading }: { info: string; loading: boolean }) {
  const emptyDescription = 'Seu profissional ainda não registrou sua anamnese. Ela aparecerá aqui assim que ele preencher.';
  return <Card data-tour="anamnese-card"><div className="readonly-section-header"><span className="badge">🔒 Somente leitura</span><p className="muted">A anamnese original é imutável para o paciente e fica disponível apenas para consulta.</p></div>{loading ? <div className="stack" aria-busy="true" aria-label="Carregando anamnese"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock className="sk-tile" /></div> : info ? <pre className="readonly-clinical-text">{info}</pre> : <EmptyState title="Nenhuma anamnese encontrada" description={emptyDescription} />}</Card>;
}
