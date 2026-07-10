const parameters = [
  { label: 'Meta de margem bruta', value: '62%', description: 'Margem mínima esperada para contratos recorrentes.' },
  { label: 'SLA de resposta clínica', value: '4h úteis', description: 'Tempo máximo para triagem de alertas importantes.' },
  { label: 'Limite de relatórios IA por paciente', value: '1 semanal', description: 'Evita custos duplicados e mantém previsibilidade financeira.' },
  { label: 'Janela de reengajamento', value: '48h', description: 'Tempo para contato ativo após ausência de check-ins.' },
];

const implementationSteps = [
  'Persistir parâmetros em uma tabela versionada no backend.',
  'Exigir justificativa e registrar auditoria a cada alteração.',
  'Aplicar validação de permissões super_admin antes de salvar mudanças.',
  'Expor parâmetros em endpoints consumidos por operação, cobrança e produto clínico.',
];

export default function Page() {
  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Configuração empresarial</span>
          <h1>Parâmetros empresariais</h1>
          <p className="muted">Centralize regras que impactam custos, operação, SLA, cobrança e limites de uso da plataforma.</p>
        </div>
      </div>

      <section className="grid">
        {parameters.map((parameter) => (
          <article className="card stack" key={parameter.label}>
            <span className="metric-label">{parameter.label}</span>
            <strong className="small-metric">{parameter.value}</strong>
            <p className="muted compact">{parameter.description}</p>
          </article>
        ))}
      </section>

      <section className="split">
        <article className="card stack">
          <h2>Checklist técnico</h2>
          <ul className="admin-check-list">{implementationSteps.map((step) => <li key={step}>{step}</li>)}</ul>
        </article>
        <article className="card stack">
          <h2>Campos sugeridos para o backend</h2>
          <p className="muted compact"><strong>Chaves:</strong> nome, valor, tipo, escopo, descrição, ativo, versão, alterado_por e alterado_em.</p>
          <p className="muted compact"><strong>Validações:</strong> intervalo permitido, impacto financeiro e necessidade de aprovação dupla.</p>
        </article>
      </section>
    </>
  );
}
