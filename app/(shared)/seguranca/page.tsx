import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Lock, Wall, Stethoscope, Scroll, Receipt, Warning } from '@phosphor-icons/react/ssr';
import { AuthLogo } from '@/components/ui/AuthLogo';
import { Button, Card } from '@/components/ui/design';

export const metadata: Metadata = { title: 'Segurança e Conformidade — Julha Saúde' };

const PILLARS: Array<{ icon: ReactNode; title: string; description: string }> = [
  {
    icon: <Lock aria-hidden="true" size={22} weight="bold" />,
    title: 'Criptografia de ponta a ponta',
    description:
      'Sintomas, anamnese e Relatórios de IA são protegidos com criptografia de envelope (AES-256-GCM). As chaves são geridas por um serviço dedicado (AWS KMS) e vinculadas ao registro, ao paciente e ao campo específicos — um dado criptografado não pode ser reaproveitado fora do contexto original.',
  },
  {
    icon: <Wall aria-hidden="true" size={22} weight="bold" />,
    title: 'Isolamento por paciente no banco de dados',
    description:
      'Row Level Security no PostgreSQL garante que cada consulta só alcança os dados do próprio paciente ou dos pacientes efetivamente vinculados ao profissional que consulta — uma camada de proteção adicional à validação da aplicação, não uma substituta dela.',
  },
  {
    icon: <Stethoscope aria-hidden="true" size={22} weight="bold" />,
    title: 'Triagem de sintomas revisada por médico',
    description:
      'As categorias que orientam o alerta automático de sinais de gravidade são baseadas em diretrizes reconhecidas (CDC, AHA/ACC, NICE) e passam por revisão de um profissional de saúde — não são geradas livremente por um modelo de linguagem a cada mensagem.',
  },
  {
    icon: <Scroll aria-hidden="true" size={22} weight="bold" />,
    title: 'Pronta para a Resolução CFM nº 2.454/2026',
    description:
      'Disponibilizamos um modelo preenchido de avaliação preliminar de risco de IA (art. 12 da Resolução), pronto para o médico responsável do seu consultório ou clínica classificar e assinar — o dever de casa técnico já está feito.',
  },
  {
    icon: <Receipt aria-hidden="true" size={22} weight="bold" />,
    title: 'Toda geração de IA é rastreável',
    description:
      'Cada Relatório de IA fica registrado com paciente, profissional solicitante, modelo de IA utilizado, versão do prompt e data de geração. Nada é produzido de forma anônima ou sem responsável identificável.',
  },
  {
    icon: <Warning aria-hidden="true" size={22} weight="bold" />,
    title: 'A IA nunca decide sozinha',
    description:
      'Toda saída da IA é apresentada como hipótese, nunca como diagnóstico confirmado — tanto na interface quanto em um aviso fixo junto a cada relatório. A decisão clínica é sempre do profissional responsável.',
  },
];

const FAQ: Array<{ question: string; answer: string }> = [
  {
    question: 'A IA pode diagnosticar meu paciente?',
    answer:
      'Não. A modalidade de apoio à avaliação clínica organiza hipóteses, nível de suspeição e sugestões de investigação a partir do histórico relatado — nunca substitui exame físico, anamnese presencial ou julgamento clínico do profissional.',
  },
  {
    question: 'O que acontece se a triagem automática errar ou ficar indisponível?',
    answer:
      'A classificação de sinais de alerta tem um segundo mecanismo, determinístico, que assume quando a IA não pode ser consultada (indisponibilidade do provedor) — a cobertura de segurança não depende de uma única chamada de API. Profissionais também podem avaliar cada relatório de IA gerado e marcar se a hipótese foi útil, o que alimenta a revisão contínua do sistema.',
  },
  {
    question: 'Meus dados clínicos saem do Brasil?',
    answer:
      'Alguns operadores (como o provedor de IA) processam dados em servidores fora do Brasil. Essa transferência segue o art. 33 da LGPD, com cláusulas contratuais e políticas de proteção de dados desses fornecedores — o detalhamento completo está na nossa Política de Privacidade.',
  },
  {
    question: 'Isso substitui minha responsabilidade como profissional?',
    answer:
      'Não. A Resolução CFM nº 2.454/2026 e nossos próprios avisos deixam isso explícito: quem decide o diagnóstico e a conduta terapêutica é sempre o profissional de saúde responsável, com apoio — não substituição — da ferramenta.',
  },
];

export default function SegurancaEConformidade() {
  return (
    <main className="public-pricing-page">
      <header className="public-pricing-nav">
        <Link href="/login" className="public-pricing-brand"><AuthLogo /><span className="sidebar-label">Julha</span></Link>
        <div className="public-pricing-nav-actions">
          <Button href="/login" variant="secondary">Entrar</Button>
          <Button href="/precos">Ver planos</Button>
        </div>
      </header>

      <section className="pricing-heading">
        <div>
          <span className="eyebrow">Segurança e conformidade</span>
          <h1>Dado clínico protegido, IA usada com responsabilidade</h1>
          <p className="muted pricing-subheading">
            Isto não é uma frase de efeito de marketing — é a arquitetura que já está em produção hoje.
            Veja exatamente o que existe, com os mesmos termos que usamos internamente.
          </p>
        </div>
      </section>

      <div className="grid">
        {PILLARS.map((pillar) => (
          <Card key={pillar.title}>
            <span className="metric-icon" aria-hidden="true">{pillar.icon}</span>
            <h3>{pillar.title}</h3>
            <p className="muted compact">{pillar.description}</p>
          </Card>
        ))}
      </div>

      <section className="pricing-heading">
        <div>
          <span className="eyebrow">Perguntas diretas</span>
          <h2>O que profissionais e clínicas costumam perguntar</h2>
        </div>
      </section>

      <div className="stack">
        {FAQ.map((item) => (
          <Card key={item.question}>
            <h3>{item.question}</h3>
            <p className="muted compact">{item.answer}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="muted compact">
          Detalhamento completo em nossa{' '}
          <Link href="/politica-de-privacidade">Política de Privacidade</Link> e nos{' '}
          <Link href="/termos-de-uso">Termos de Uso</Link>. Já tem conta?{' '}
          <Link href="/login">Entrar</Link>.
        </p>
      </Card>
    </main>
  );
}
