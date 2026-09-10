import { Card } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { ANAMNESE_RISK_FACTORS, type AnamneseRiskFactors } from '@/lib/anamneseRiskFactors';

export function ReadOnlyAnamnese({
  info,
  loading,
  riskFactors,
}: {
  info: string;
  loading: boolean;
  riskFactors?: AnamneseRiskFactors;
}) {
  const emptyDescription = 'Seu profissional ainda não registrou sua anamnese. Ela aparecerá aqui assim que ele preencher.';
  const markedRiskFactors = ANAMNESE_RISK_FACTORS.filter(({ field }) => riskFactors?.[field as keyof AnamneseRiskFactors]);
  return <Card data-tour="anamnese-card"><div className="readonly-section-header"><span className="badge">🔒 Somente leitura</span><p className="muted">A anamnese original é imutável para o paciente e fica disponível apenas para consulta.</p></div>{loading ? <div className="stack" aria-busy="true" aria-label="Carregando anamnese"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock className="sk-tile" /></div> : info ? <pre className="readonly-clinical-text">{info}</pre> : <EmptyState title="Nenhuma anamnese encontrada" description={emptyDescription} />}
    {!loading && markedRiskFactors.length > 0 ? (
      <div className="risk-factor-checklist">
        <strong>Fatores de risco registrados</strong>
        <ul>{markedRiskFactors.map(({ field, label }) => <li key={field}>{label}</li>)}</ul>
      </div>
    ) : null}
  </Card>;
}
