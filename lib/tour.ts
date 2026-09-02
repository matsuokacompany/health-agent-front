export type TourStep = { target?: string; title: string; body: string };
export type TourRole = 'professional' | 'patient' | 'admin';

export const TOUR_HOME_FOR_ROLE: Record<TourRole, string> = {
  professional: '/professional/patients',
  patient: '/patient/dashboard',
  admin: '/admin',
};

// Targets are matched via [data-tour="..."] attributes placed on the real
// elements in each role's home page, not CSS classes -- classes change for
// styling reasons and would silently break a step's highlight; a
// data-tour attribute is only ever touched on purpose.
export const TOUR_STEPS: Record<TourRole, TourStep[]> = {
  professional: [
    { title: 'Bem-vindo à Julha', body: 'Vamos te mostrar rapidamente como acompanhar seus pacientes por aqui. Leva menos de um minuto.' },
    { target: '[data-tour="sidebar-nav"]', title: 'Menu de navegação', body: 'Use o menu lateral para transitar entre Pacientes e Assinatura a qualquer momento.' },
    { target: '[data-tour="new-patient"]', title: 'Cadastre um paciente', body: 'Clique aqui para cadastrar um paciente, definir o plano de acompanhamento e a data do primeiro check-in por WhatsApp.' },
    { target: '[data-tour="patients-metrics"]', title: 'Indicadores rápidos', body: 'Veja de relance quantos pacientes estão ativos e quantos relatos de sintomas foram recebidos.' },
    { target: '[data-tour="patients-table"]', title: 'Prontuário do paciente', body: 'Clique em "Ver prontuário" para abrir o histórico completo de check-ins, dados clínicos e relatórios de IA de cada paciente.' },
    { title: 'Pronto!', body: 'Você pode reabrir este tour quando quiser clicando em "Ajuda" no topo da página.' },
  ],
  patient: [
    { title: 'Bem-vindo à Julha', body: 'Vamos te mostrar rapidamente como acompanhar sua evolução por aqui. Leva menos de um minuto.' },
    { target: '[data-tour="sidebar-nav"]', title: 'Menu de navegação', body: 'Use o menu lateral para acessar seu dashboard, anamnese, relatórios e assinatura.' },
    { target: '[data-tour="patient-plan"]', title: 'Seu plano', body: 'Aqui fica o plano de acompanhamento atual, com datas de início e término.' },
    { target: '[data-tour="patient-summary"]', title: 'Seu progresso', body: 'Acompanhe quantos check-ins você já respondeu e sua taxa de resposta.' },
    { target: '[data-tour="patient-symptoms"]', title: 'Evolução dos sintomas', body: 'Veja a proporção de dias com e sem sintomas ao longo do acompanhamento.' },
    { title: 'Pronto!', body: 'Você pode reabrir este tour quando quiser clicando em "Ajuda" no topo da página.' },
  ],
  admin: [
    { title: 'Bem-vindo à administração', body: 'Vamos te mostrar rapidamente o painel administrativo. Leva menos de um minuto.' },
    { target: '[data-tour="sidebar-nav"]', title: 'Menu de navegação', body: 'Use o menu lateral para acessar usuários, pacientes, custos e a operação do WhatsApp.' },
    { target: '[data-tour="admin-metrics"]', title: 'Indicadores gerais', body: 'Usuários ativos, uso de IA e mensagens de WhatsApp do mês atual, tudo em um só lugar.' },
    { target: '[data-tour="admin-shortcuts"]', title: 'Atalhos', body: 'Acesse rapidamente as áreas de gestão da plataforma a partir daqui.' },
    { title: 'Pronto!', body: 'Você pode reabrir este tour quando quiser clicando em "Ajuda" no topo da página.' },
  ],
};

export function tourStorageKey(role: TourRole, userId: string | number) {
  return `julha_tour_seen_v1_${role}_${userId}`;
}
