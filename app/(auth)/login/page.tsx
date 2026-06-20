export default function Login() {
  return (
    <main className="hero">
      <section>
        <span className="badge">Julha Saúde</span>
        <h1>Entrar na plataforma clínica</h1>
        <p className="muted">
          Autenticação mock temporária com usuário fixo para manter o fluxo local sem provedor externo.
        </p>
        <a className="button" href="/mock-login?role=patient">
          Paciente mock
        </a>
        <a className="button" href="/mock-login?role=professional">
          Profissional mock
        </a>
      </section>
      <aside className="panel">
        <h2>Segurança</h2>
        <p>Rotas protegidas por role, acesso por vínculo profissional-paciente e nenhum token sensível em localStorage.</p>
      </aside>
    </main>
  );
}
