import { CheckCircle, Stethoscope, Warning } from '@phosphor-icons/react/ssr';
import type { SelfMonitoringInsightResult } from '@/lib/types';

const urgencyLabel: Record<string, string> = {
  baixa: 'Pode agendar quando for conveniente',
  moderada: 'Vale agendar nas próximas semanas',
  alta: 'Vale buscar uma consulta o quanto antes',
};
const urgencyRiskClass: Record<string, string> = { baixa: 'risk-baixo', moderada: 'risk-moderado', alta: 'risk-alto' };

/** Renders one AI-generated self-monitoring summary's content — shared by
 * the "generate/latest" card on automonitoramento and the report history
 * detail page, so both show the exact same shape and disclaimer. Styled as
 * distinct highlighted sections (not a wall of plain text) so the summary
 * itself reads as something the platform actively put together, not just a
 * dump of the model's raw answer. */
export function InsightResultBody({ result }: { result: SelfMonitoringInsightResult }) {
  const hasPoints = Boolean(result.pontos_positivos?.length || result.pontos_de_atencao?.length);
  return <>
    <div className="ai-summary"><p>{result.resumo}</p></div>
    {hasPoints ? (
      <div className="insight-points">
        {result.pontos_positivos?.length ? (
          <div className="insight-points-positive">
            <h3><CheckCircle aria-hidden="true" size={18} weight="duotone" /> Pontos positivos</h3>
            <ul>{result.pontos_positivos.map((item, index) => <li key={index}>{item}</li>)}</ul>
          </div>
        ) : null}
        {result.pontos_de_atencao?.length ? (
          <div className="insight-points-attention">
            <h3><Warning aria-hidden="true" size={18} weight="duotone" /> Pontos de atenção</h3>
            <ul>{result.pontos_de_atencao.map((item, index) => <li key={index}>{item}</li>)}</ul>
          </div>
        ) : null}
      </div>
    ) : null}
    {result.especialidade_sugerida ? (
      <div className="ai-recommendations">
        <div>
          <span aria-hidden="true"><Stethoscope size={20} weight="duotone" /></span>
          <div>
            <h4>Especialidade sugerida</h4>
            <p>{result.especialidade_sugerida}</p>
            {result.urgencia_consulta ? (
              <span className={`badge ${urgencyRiskClass[result.urgencia_consulta] ?? ''}`}>
                {urgencyLabel[result.urgencia_consulta] ?? result.urgencia_consulta}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    ) : null}
    {result.sugestao ? <p className="muted">{result.sugestao}</p> : null}
    <p className="notice compact">
      Este resumo é gerado por IA a partir dos seus check-ins e da sua anamnese e tem caráter apenas informativo —
      não é um diagnóstico nem substitui uma avaliação médica. Em caso de dúvida, piora dos sintomas ou emergência,
      procure atendimento profissional imediatamente.
    </p>
  </>;
}
