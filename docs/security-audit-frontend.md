# Auditoria estática de autorização e segurança do frontend

**Data:** 2026-08-17  
**Escopo:** todo código versionado do frontend (rotas, componentes, serviços, infraestrutura HTTP, build, testes e documentação). Dependências em `node_modules` foram excluídas das buscas de código próprio.

## Conclusão executiva

O frontend **não é e não deve ser tratado como barreira de autorização**. Os guards React e o RBAC em `lib/rbac.ts` servem somente a UX/defesa em profundidade. A autoridade é a sessão em cookie HttpOnly e o usuário/papéis retornados por `GET /api/auth/me`; cada endpoint precisa validar papel e vínculo com o paciente no backend. Alterar ou ocultar um ID no browser nunca concede acesso e um `403` não é repetido com outro ID.

Não foi encontrado token de sessão ou papel persistido em `localStorage`/`sessionStorage`. `julha.activeAccessContext` guarda apenas a área de navegação escolhida e é sempre subordinado aos papéis de `/api/auth/me`; tema e idioma são preferências não sensíveis. O código remove uma antiga sessão Supabase do storage.

## A. Achados confirmados

| Severidade | Arquivo/linha | Evidência | Exploração/impacto | Correção mínima |
|---|---|---|---|---|
| Alta | `components/patient/PatientDataProvider.tsx` (cache em módulo) e `lib/tanstack-react-query.tsx` | Relatórios, planos, anamnese, check-ins e respostas de IA podiam permanecer em `Map` durante toda a vida da aba, inclusive depois do logout. | Em computador compartilhado, uma conta posterior poderia receber dados em cache da conta anterior se uma chave fosse reutilizada ou uma consulta não incluísse identidade. | **Corrigido:** limpar QueryClient no logout e apagar cache/requisições do paciente na troca/remoção do usuário. |
| Média | `app/layout.tsx` | O script estático de tema era injetado por `dangerouslySetInnerHTML`; não recebia entrada clínica, mas mantinha um sink perigoso e exigia `unsafe-inline`. | Uma futura interpolação acidental transformaria o sink em XSS; CSP permissiva diminuía a defesa. | **Corrigido:** mover para `public/theme-init.js`, carregar com `src` constante e remover `unsafe-inline` de `script-src` em produção. |
| Média | `infrastructure/http/ApiClient.ts` | 401 e 403 tinham classes próprias, mas 404 caía em erro genérico. Telas que suprimem erros com `.catch(() => [])` também confundem acesso negado/recurso ausente com lista vazia. | Usuário não distingue sessão expirada, recurso fora do escopo e ID inexistente; a supressão pode esconder falhas de autorização. Não há tentativa de trocar IDs. | **Parcialmente corrigido:** 401/403/404 agora são tipados centralmente e têm mensagens explícitas. Consumidores legados que convertem qualquer erro em vazio devem migrar para estados de erro. |
| Média | `components/auth/guards.tsx`, `lib/rbac.ts`, layouts de área | Proteção de rota e ocultação de UI ocorrem no React. O middleware só aplica headers/redirect da raiz e não valida sessão. | Chamadas diretas à API ignoram completamente componentes e helpers. Se o backend não aplicar RBAC/vínculo, há IDOR/elevação de privilégio. | Risco arquitetural confirmado no frontend, **não corrigível nele**: manter guards como UX e exigir autorização deny-by-default em todos endpoints. |
| Baixa | `components/auth/AuthProvider.tsx` | `julha.activeAccessContext` é persistido em `localStorage`. | Um usuário pode alterar a área escolhida, mas não os `roles` obtidos de `/api/auth/me`; guards revalidam papel. Se código futuro confundir contexto com permissão, haverá elevação local. | Manter explicitamente como preferência UX; nunca enviar como prova de autorização. |

## B. Riscos condicionais (dependem do backend/deploy)

| Severidade | Local | Condição e evidência | Exploração possível | Verificação necessária |
|---|---|---|---|---|
| Crítica | Todos os endpoints com IDs em `services/*` | IDs de paciente, usuário, relatório e plano aparecem no path/body. O browser não consegue comprovar enforcement server-side. | IDOR por troca de `/patients/{id}`, `/users/{id}`, `/ai-reports/{id}` ou `patient_id` se o backend não validar ator, papel e vínculo. | Testes de API: mesmo recurso retorna 401 sem sessão, 403 para sessão sem vínculo/papel e 404 apenas conforme política anti-enumeração. Nunca tentar contornar 403 com outro ID. |
| Alta | Cookies de autenticação no backend | O cliente usa `credentials: include`, não consegue verificar flags de `Set-Cookie`. | Roubo/replay de sessão se cookies não forem HttpOnly, Secure, SameSite e rotacionados/invalidados. | Inspecionar respostas de login/refresh/logout e configuração do backend. |
| Alta | CSRF | Mutações recebem `x-csrf-token`, obtido de `/api/auth/csrf`, com uma repetição apenas quando o backend declara token inválido. | CSRF se backend não validar o header, aceitar origens indevidas ou permitir mutações GET. | Testar ausência/token incorreto/origem hostil no backend; ambos devem falhar. |
| Alta | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_BASE_URL`, `VITE_API_URL`, `VITE_API_BASE_URL`, `NEXT_PUBLIC_USE_MOCK` | Variáveis com prefixo público entram no bundle. Não há chave privada versionada, mas valores de CI/deploy não estão no repositório. | Operador pode publicar secret por engano ou apontar preview para produção; `NEXT_PUBLIC_USE_MOCK=true` em produção alteraria comportamento. | Allowlist no pipeline somente para URL pública e flag de build; bloquear nomes/valores de segredo. |
| Média | `components/patient/dashboard/ProfessionalsCard.tsx` | `photo` retornado pela API é usado como `img src`. CSP de produção restringe imagens a self/data/blob, mas não há validação explícita do esquema no componente. | Tracking/exfiltração para URL externa caso a CSP seja relaxada; esquemas perigosos dependem do browser. | Backend deve fornecer URL/asset confiável; adicionar allowlist explícita antes de permitir CDN externa. |
| Média | `services/audit.ts` | Auditoria local não é persistente nem evidência de segurança. | Acesso indevido não deixa trilha confiável; logs do frontend são adulteráveis. | Auditoria imutável e minimizada no backend, sem PHI/tokens/prompt/resposta de IA. |
| Média | Source maps/build | Nenhum `.map` próprio foi versionado e `next.config.ts` não habilita browser source maps; artefatos reais não estavam no escopo. | Deploy pode publicar maps e revelar fontes/configuração. | Inspecionar `.next/static` e CDN a cada release; não inserir secrets no fonte mesmo com maps desabilitados. |

## Inventário de armazenamento, URLs e dados sensíveis

- **Storage:** somente contexto de navegação, tema e idioma; a chave legada `health-agent.supabase.session` é removida. Nenhum uso de `sessionStorage` foi encontrado.
- **Sessão:** cookies via `credentials: 'include'`; nenhum `Authorization: Bearer` montado pelo aplicativo e nenhum access/refresh token persistido.
- **Cache:** dados clínicos existem em memória no QueryClient e no provider enquanto a conta está ativa. O patch limpa ambos ao sair/trocar usuário. O cache não é persistido em disco.
- **URLs/query strings:** IDs aparecem em segmentos de rota; filtros/paginação/data/status aparecem em query string. Não foram encontrados CPF, telefone, token ou texto clínico montados em query string. `created` e `anamneseError` são flags de UX, não papéis.
- **Logs/analytics/error tracking:** não há SDK de analytics/error tracking e não há `console.*` no código de runtime pesquisado. Não adicionar conteúdo clínico, CPF, telefone, tokens ou respostas de IA sem redaction.
- **Stores:** `AuthProvider` mantém usuário/papéis de `/api/auth/me` em memória. Papéis não são aceitos de query, storage ou token decodificado no browser.

## E. Resultado completo da busca de sinks XSS

Busca executada no código próprio por `dangerouslySetInnerHTML`, `.innerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function`, renderizadores Markdown/rich text e `href/src` dinâmicos.

| Sink | Resultado |
|---|---|
| `dangerouslySetInnerHTML` | **0 após patch** (1 antes: script constante de tema em `app/layout.tsx`, removido). |
| `innerHTML` / `insertAdjacentHTML` / `document.write` | 0. |
| `eval` / `new Function` | 0. |
| Markdown/HTML bruto/rich text | 0 bibliotecas e 0 renderizadores; conteúdo clínico usa interpolação React como texto. |
| `href` dinâmico | Links internos construídos com IDs/rotas conhecidos; nenhum `href` vindo diretamente de texto clínico. React/Next fazem escaping, mas autorização continua no backend. |
| `src` dinâmico | 1: foto de profissional vinda da API. Bloqueada para origens externas pela CSP atual; risco condicional documentado acima. |
| Respostas IA/anamnese/sintomas/bio/planos | Renderizados por children/texto ou `<pre>`, sem HTML bruto. |

## Secrets e configuração de build

A busca incluiu `.env*`, prefixos públicos, termos usuais de token/private key/secret, source maps e configuração Next. Não há `.env` ou chave privada versionada. `README.md` contém apenas uma URL pública de API. Prefixos públicos encontrados são usados somente para URL/base pública e mock; **qualquer secret nesses prefixos seria exposição intencional ao bundle**. O repositório não prova os valores configurados no deploy, portanto essa parte permanece risco condicional.

## C. Patch mínimo por arquivo

- `infrastructure/http/ApiClient.ts`: classe `NotFoundError` e mapeamento explícito de 404; preserva refresh único em 401, negação em 403 e CSRF.
- `components/ui/errors.ts`: mensagem segura e explícita para 404, sem ecoar payload do servidor.
- `lib/tanstack-react-query.tsx`: operação `clear()` para descarte imediato de respostas sensíveis.
- `components/auth/AuthProvider.tsx`: limpa cache de queries ao limpar autenticação/logout.
- `components/patient/PatientDataProvider.tsx`: elimina cache/requisições clínicas na troca/logout.
- `app/layout.tsx` e `public/theme-init.js`: elimina o único `dangerouslySetInnerHTML` sem mudança visual.
- `middleware.ts`: `script-src 'self'` em produção; permissões de desenvolvimento permanecem isoladas.
- `tests/unit/api-client.test.ts`: regressão para 401/403/404/409.

## D. Matriz de testes de rota e componente

Cobertura automatizada relevante: `tests/security/access.test.ts`, `tests/security/service-guards.test.ts`, `tests/integration/navigation.test.ts`, `tests/unit/auth-provider.test.tsx`, `tests/unit/api-client.test.ts` e `e2e/security.spec.ts`.

Cenários obrigatórios no pipeline integrado com backend:

1. Sem cookie: cada rota visual protegida redireciona para login e cada endpoint retorna 401.
2. Cookie válido, papel errado: UI mostra acesso negado e API retorna 403.
3. Profissional A consulta ID do paciente de B: API retorna 403/404 pela política, sem segunda tentativa com outro ID e sem dado parcial no corpo.
4. ID inexistente: UI mostra “recurso não encontrado” e API retorna 404.
5. Logout/login como outro usuário na mesma aba: nenhum dado anterior aparece antes da nova resposta.
6. Mutação sem CSRF ou com CSRF incorreto: backend nega; com token correto: prossegue conforme autorização.
7. Dados clínicos contendo `<img onerror=...>`, tags e Markdown HTML aparecem literalmente como texto e não criam nós executáveis.
8. Alterar `julha.activeAccessContext` ou flags da query não altera papel nem permite chamada protegida.

## F. Limite de confiança

Esta é uma auditoria **estática do frontend**. Ela confirma que o browser busca papéis em `/api/auth/me`, não persiste tokens e trata respostas de autorização no cliente; ela não pode confirmar flags dos cookies, CORS, validação CSRF, vínculo profissional-paciente ou RBAC do servidor. A aprovação de segurança exige testes negativos diretamente contra a API. Ocultar botões, guards React, middleware Next e helpers locais são exclusivamente UX/defesa em profundidade.
