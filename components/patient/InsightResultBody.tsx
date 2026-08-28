import type { SelfMonitoringInsightResult } from '@/lib/types';

/** Renders one AI-generated self-monitoring summary's content — shared by
 * the "generate/latest" card on automonitoramento and the report history
 * detail page, so both show the exact same shape and disclaimer. */
export function InsightResultBody({ result }: { result: SelfMonitoringInsightResult }) {
  return <>
    <p className="muted">{result.resumo}</p>
    {result.pontos_positivos?.length ? (
      <div>
        <h3>Pontos positivos</h3>
        <ul>{result.pontos_positivos.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>
    ) : null}
    {result.pontos_de_atencao?.length ? (
      <div>
        <h3>Pontos de atenção</h3>
        <ul>{result.pontos_de_atencao.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </div>
    ) : null}
    {result.sugestao ? <p className="muted">{result.sugestao}</p> : null}
    <p className="notice compact">
      Este resumo é gerado por IA a partir dos seus check-ins e tem caráter apenas informativo — não é um
      diagnóstico nem substitui uma avaliação médica. Em caso de dúvida ou piora dos sintomas, procure
      atendimento profissional.
    </p>
  </>;
}
