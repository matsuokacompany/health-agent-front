const costLines = [
  { name: 'IA para relatórios clínicos', current: 'R$ 2.860', forecast: 'R$ 3.420', owner: 'Produto clínico' },
  { name: 'Mensagens WhatsApp', current: 'R$ 1.280', forecast: 'R$ 1.510', owner: 'Operações' },
  { name: 'Atendimento profissional', current: 'R$ 2.950', forecast: 'R$ 3.100', owner: 'Rede clínica' },
  { name: 'Infraestrutura e observabilidade', current: 'R$ 310', forecast: 'R$ 390', owner: 'Tecnologia' },
];

const guardrails = [
  'Definir teto mensal por paciente para geração de relatórios de IA.',
  'Separar custos fixos, variáveis e custos diretamente atribuíveis a cada contrato.',
  'Criar alerta automático quando margem operacional projetada ficar abaixo da meta.',
];

export default function Page() {
  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Finanças</span>
          <h1>Custos administrativos</h1>
          <p className="muted">Base inicial para controlar custos empresariais. Os valores abaixo funcionam como estrutura de apresentação até a conexão com o backend financeiro.</p>
        </div>
      </div>

      <section className="grid admin-metrics-grid">
        <article className="card"><span className="metric-label">Custo mensal</span><strong className="metric">R$ 7,4 mil</strong><p className="muted compact">Soma operacional estimada</p></article>
        <article className="card"><span className="metric-label">Custo por paciente</span><strong className="metric">R$ 39,78</strong><p className="muted compact">186 pacientes ativos</p></article>
        <article className="card"><span className="metric-label">Margem bruta</span><strong className="metric">70,2%</strong><p className="muted compact">Meta mínima: 62%</p></article>
      </section>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Centro de custo</th><th>Mês atual</th><th>Projeção</th><th>Responsável</th></tr></thead>
          <tbody>
            {costLines.map((line) => <tr key={line.name}><td>{line.name}</td><td>{line.current}</td><td>{line.forecast}</td><td>{line.owner}</td></tr>)}
          </tbody>
        </table>
      </div>

      <section className="card stack admin-section-offset">
        <h2>Como evoluir esta tela</h2>
        <ul className="admin-check-list">{guardrails.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </>
  );
}
