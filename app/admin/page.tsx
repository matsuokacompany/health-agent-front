import Link from 'next/link';

const metrics = [
  { label: 'Receita mensal estimada', value: 'R$ 24,8 mil', hint: '+12% vs. mês anterior' },
  { label: 'Custo operacional', value: 'R$ 7,4 mil', hint: '29,8% da receita' },
  { label: 'Pacientes ativos', value: '186', hint: '42 em acompanhamento intenso' },
  { label: 'Alertas administrativos', value: '8', hint: '3 exigem decisão nesta semana' },
];

const shortcuts = [
  { title: 'Pacientes', description: 'Cadastre pacientes, consulte anamneses, planos e relatórios.', href: '/admin/pacientes', cta: 'Abrir pacientes' },
  { title: 'Custos', description: 'Acompanhe custos com IA, WhatsApp, atendimento e margem operacional.', href: '/admin/custos', cta: 'Ver custos' },
  { title: 'Parâmetros empresariais', description: 'Revise metas, SLA, limites operacionais e regras de cobrança.', href: '/admin/parametros', cta: 'Configurar' },
  { title: 'WhatsApp', description: 'Monitore status de envio, templates e falhas operacionais.', href: '/admin/whatsapp', cta: 'Ver operação' },
] as const;

export default function Page() {
  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Administração</span>
          <h1>Dashboard administrativo</h1>
          <p className="muted">Visão executiva para acompanhar operação, custos, capacidade e parâmetros empresariais antes de conectar os endpoints definitivos do backend.</p>
        </div>
        <Link className="button" href="/admin/parametros">Revisar parâmetros</Link>
      </div>

      <section className="grid admin-metrics-grid" aria-label="Indicadores administrativos">
        {metrics.map((metric) => (
          <article className="card" key={metric.label}>
            <span className="metric-label">{metric.label}</span>
            <strong className="metric">{metric.value}</strong>
            <p className="muted compact">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid" aria-label="Atalhos administrativos">
        {shortcuts.map((shortcut) => (
          <article className="card stack" key={shortcut.href}>
            <h2>{shortcut.title}</h2>
            <p className="muted">{shortcut.description}</p>
            <Link className="button secondary" href={shortcut.href}>{shortcut.cta}</Link>
          </article>
        ))}
      </section>

      <section className="split">
        <article className="card stack">
          <h2>Próximas integrações recomendadas</h2>
          <ul className="admin-check-list">
            <li>Endpoint consolidado de métricas financeiras e operacionais.</li>
            <li>Logs auditáveis para mudanças em parâmetros críticos.</li>
            <li>Alertas de custo quando consumo de IA ou WhatsApp ultrapassar limites.</li>
          </ul>
        </article>
        <article className="card stack">
          <h2>Governança</h2>
          <p className="muted">Mantenha esta área restrita a super administradores, com MFA, trilha de auditoria e aprovação dupla para mudanças que alterem cobrança, SLA ou limites clínicos.</p>
        </article>
      </section>
    </>
  );
}
