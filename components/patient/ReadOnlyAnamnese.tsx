import { Lock } from '@phosphor-icons/react/ssr';
import { Card } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { ANAMNESE_RISK_FACTORS, type AnamneseRiskFactors } from '@/lib/anamneseRiskFactors';

export function ReadOnlyAnamnese({
  info,
  loading,
  riskFactors,
  medicationAllergies,
  foodRestrictions,
}: {
  info: string;
  loading: boolean;
  riskFactors?: AnamneseRiskFactors;
  medicationAllergies?: string | null;
  foodRestrictions?: string | null;
}) {
  const emptyDescription = 'Seu profissional ainda não registrou sua anamnese. Ela aparecerá aqui assim que ele preencher.';
  const markedRiskFactors = ANAMNESE_RISK_FACTORS.filter(({ field }) => riskFactors?.[field as keyof AnamneseRiskFactors]);
  return <Card data-tour="anamnese-card"><div className="readonly-section-header"><span className="badge"><Lock aria-hidden="true" weight="duotone" /> Somente leitura</span><p className="muted">A anamnese original é imutável para o paciente e fica disponível apenas para consulta.</p></div>{loading ? <div className="stack" aria-busy="true" aria-label="Carregando anamnese"><SkeletonBlock /><SkeletonBlock /><SkeletonBlock className="sk-tile" /></div> : info ? <pre className="readonly-clinical-text">{info}</pre> : <EmptyState title="Nenhuma anamnese encontrada" description={emptyDescription} />}
    {!loading && markedRiskFactors.length > 0 ? (
      <div className="risk-factor-checklist">
        <strong>Fatores de risco registrados</strong>
        <ul>{markedRiskFactors.map(({ field, label }) => <li key={field}>{label}</li>)}</ul>
      </div>
    ) : null}
    {!loading && (medicationAllergies || foodRestrictions) ? (
      <div className="risk-factor-checklist">
        <strong>Alergias e restrições</strong>
        {medicationAllergies ? <p className="muted compact">Medicamentos: {medicationAllergies}</p> : null}
        {foodRestrictions ? <p className="muted compact">Alimentos: {foodRestrictions}</p> : null}
      </div>
    ) : null}
  </Card>;
}
