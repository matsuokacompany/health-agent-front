export type TourStep = { target?: string; title: string; body: string };

// Targets are matched via [data-tour="..."] attributes placed on the real
// elements on each page, not CSS classes -- classes change for styling
// reasons and would silently break a step's highlight; a data-tour
// attribute is only ever touched on purpose.
//
// Keyed by pathname: each page that has entries here gets its own short,
// self-contained tour (auto-started once per page per user, and reopenable
// from the "Ajuda" button whenever that page is open). The two home-page
// tours (patients list, patient dashboard, admin dashboard) open with a
// welcome step and a reminder of the sidebar; the rest jump straight into
// that page's own content, since navigation was already covered there.
export const TOUR_STEPS: Record<string, TourStep[]> = {
  '/professional/patients': [
    { title: 'Bem-vindo à Julha', body: 'Vamos te mostrar rapidamente como acompanhar seus pacientes por aqui. Leva menos de um minuto.' },
    { target: '[data-tour="sidebar-nav"]', title: 'Menu de navegação', body: 'Use o menu lateral para transitar entre Pacientes e Assinatura a qualquer momento.' },
    { target: '[data-tour="new-patient"]', title: 'Cadastre um paciente', body: 'Clique aqui para cadastrar um paciente, definir o plano de acompanhamento e a data do primeiro check-in por WhatsApp.' },
    { target: '[data-tour="patients-metrics"]', title: 'Indicadores rápidos', body: 'Veja de relance quantos pacientes estão ativos e quantos relatos de sintomas foram recebidos.' },
    { target: '[data-tour="patients-table"]', title: 'Prontuário do paciente', body: 'Clique em "Ver prontuário" para abrir o histórico completo de check-ins, dados clínicos e relatórios de IA de cada paciente.' },
    { title: 'Pronto!', body: 'Você pode reabrir este tour quando quiser clicando em "Ajuda" no topo da página.' },
  ],
  '/professional/assinatura': [
    { target: '[data-tour="assinatura-status"]', title: 'Status da assinatura', body: 'Veja o status atual, quantos pacientes você já usa do seu limite e as ações disponíveis (trocar de plano, cancelar).' },
    { target: '[data-tour="assinatura-plans"]', title: 'Planos disponíveis', body: 'Compare os planos e clique em "Assinar agora" ou "Trocar para este plano" para mudar a qualquer momento.' },
    { target: '[data-tour="assinatura-invoices"]', title: 'Histórico de cobranças', body: 'Suas faturas anteriores ficam aqui. Você pode reabrir este tour quando quiser clicando em "Ajuda".' },
  ],
  '/patient/dashboard': [
    { title: 'Bem-vindo à Julha', body: 'Vamos te mostrar rapidamente como acompanhar sua evolução por aqui. Leva menos de um minuto.' },
    { target: '[data-tour="sidebar-nav"]', title: 'Menu de navegação', body: 'Use o menu lateral para acessar seu dashboard, calendário, anamnese, relatórios e assinatura.' },
    { target: '[data-tour="patient-plan"]', title: 'Seu plano', body: 'Aqui fica o plano de acompanhamento atual, com datas de início e término.' },
    { target: '[data-tour="patient-summary"]', title: 'Seu progresso', body: 'Acompanhe quantos check-ins você já respondeu e sua taxa de resposta.' },
    { target: '[data-tour="patient-symptoms"]', title: 'Evolução dos sintomas', body: 'Veja a proporção de dias com e sem sintomas ao longo do acompanhamento.' },
    { title: 'Pronto!', body: 'Você pode reabrir este tour quando quiser clicando em "Ajuda" no topo da página.' },
  ],
  '/patient/monitoring': [
    { target: '[data-tour="monitoring-calendar"]', title: 'Seu calendário', body: 'Cada dia mostra se você respondeu o check-in e se relatou sintomas. Clique em um dia para ver os detalhes ou editar sua resposta.' },
    { target: '[data-tour="monitoring-legend"]', title: 'Legenda', body: 'As cores indicam o status de cada dia: sem sintomas, com sintomas, pendente ou sem check-in. Você pode reabrir este tour quando quiser clicando em "Ajuda".' },
  ],
  '/patient/anamnese': [
    { target: '[data-tour="anamnese-card"]', title: 'Sua anamnese', body: 'Aqui fica o histórico clínico registrado pelo seu profissional. É somente leitura — só ele pode editar. Você pode reabrir este tour quando quiser clicando em "Ajuda".' },
  ],
  '/patient/relatorios': [
    { target: '[data-tour="relatorios-list"]', title: 'Histórico de resumos', body: 'Cada resumo gerado por IA no Automonitoramento fica registrado aqui, para você acompanhar sua evolução ao longo do tempo. Você pode reabrir este tour quando quiser clicando em "Ajuda".' },
  ],
  '/patient/assinatura': [
    { target: '[data-tour="assinatura-status"]', title: 'Status da assinatura', body: 'Veja o status atual da sua assinatura e as ações disponíveis (trocar de plano, cancelar).' },
    { target: '[data-tour="assinatura-plans"]', title: 'Planos disponíveis', body: 'Compare os planos e clique em "Assinar agora" ou "Trocar para este plano" para mudar a qualquer momento.' },
    { target: '[data-tour="assinatura-invoices"]', title: 'Histórico de cobranças', body: 'Suas faturas anteriores ficam aqui. Você pode reabrir este tour quando quiser clicando em "Ajuda".' },
  ],
  '/admin': [
    { title: 'Bem-vindo à administração', body: 'Vamos te mostrar rapidamente o painel administrativo. Leva menos de um minuto.' },
    { target: '[data-tour="sidebar-nav"]', title: 'Menu de navegação', body: 'Use o menu lateral para acessar usuários, pacientes, custos e a operação do WhatsApp.' },
    { target: '[data-tour="admin-metrics"]', title: 'Indicadores gerais', body: 'Usuários ativos, uso de IA e mensagens de WhatsApp do mês atual, tudo em um só lugar.' },
    { target: '[data-tour="admin-shortcuts"]', title: 'Atalhos', body: 'Acesse rapidamente as áreas de gestão da plataforma a partir daqui.' },
    { title: 'Pronto!', body: 'Você pode reabrir este tour quando quiser clicando em "Ajuda" no topo da página.' },
  ],
  '/admin/usuarios': [
    { target: '[data-tour="admin-users-metrics"]', title: 'Indicadores', body: 'Total de usuários da plataforma e quantos estão ativos ou inativos.' },
    { target: '[data-tour="admin-users-filters"]', title: 'Buscar e filtrar', body: 'Filtre por nome, e-mail, papel (paciente, profissional, admin) ou status.' },
    { target: '[data-tour="admin-users-table"]', title: 'Ações por usuário', body: 'Edite os papéis de um usuário ou gerencie a assinatura dele diretamente na tabela. Você pode reabrir este tour quando quiser clicando em "Ajuda".' },
  ],
  '/admin/pacientes': [
    { target: '[data-tour="admin-patients-new"]', title: 'Novo paciente', body: 'Cadastre um paciente diretamente pela administração.' },
    { target: '[data-tour="admin-patients-table"]', title: 'Lista de pacientes', body: 'Clique em um paciente para ver seus detalhes. Você pode reabrir este tour quando quiser clicando em "Ajuda".' },
  ],
  '/admin/custos': [
    { target: '[data-tour="custos-billing"]', title: 'Receita e assinaturas', body: 'MRR (receita recorrente mensal), assinaturas ativas e taxa de churn dos últimos 30 dias.' },
    { target: '[data-tour="custos-metrics"]', title: 'Custos do período', body: 'Custo total estimado, relatórios de IA gerados e mensagens de WhatsApp enviadas, calculados automaticamente a partir do uso.' },
    { target: '[data-tour="custos-manual"]', title: 'Lançamentos manuais', body: 'Adicione gastos que este painel não calcula sozinho (contratos, ferramentas, suporte) e veja o histórico na tabela abaixo. Você pode reabrir este tour quando quiser clicando em "Ajuda".' },
  ],
  '/admin/whatsapp': [
    { target: '[data-tour="whatsapp-metrics"]', title: 'Indicadores do período', body: 'Mensagens enviadas, custo estimado e média diária — ajuste o período no seletor acima.' },
    { target: '[data-tour="whatsapp-chart"]', title: 'Envios por dia', body: 'Acompanhe o volume de check-ins enviados dia a dia. Você pode reabrir este tour quando quiser clicando em "Ajuda".' },
  ],
};

export function tourStorageKey(path: string, userId: string | number) {
  return `julha_tour_seen_v2_${path}_${userId}`;
}
