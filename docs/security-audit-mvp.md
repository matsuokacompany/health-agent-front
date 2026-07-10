# Auditoria de segurança MVP — Health Agent Front

Data da auditoria: 2026-07-08
Escopo: aplicação Next.js/front-end, autenticação Supabase via REST, RBAC client-side, serviços HTTP e testes existentes.

## Resumo executivo

O front-end já possui algumas proteções úteis para MVP: headers básicos de segurança no middleware, guards de rotas por perfil, token Bearer nas chamadas à API, mensagens genéricas para recuperação de senha e testes de RBAC. Mesmo assim, há pontos que devem ser tratados antes de expor dados reais de saúde:

1. **Sessão em `localStorage` é o maior risco do front-end**, porque qualquer XSS consegue ler access/refresh tokens.
2. **CSP ainda permite `unsafe-inline`**, mas `unsafe-eval` foi removido para produção; o próximo passo é nonce/hash para o script de tema.
3. **Autorização real depende do backend**, pois guards do front-end são apenas barreira de UX/defesa em profundidade.
4. **Testes E2E usam cookie `role` como autenticação simulada**, o que pode mascarar cenários reais se vazar para ambiente fora de teste.
5. **Auditoria fica só em memória no browser/processo**, sem trilha persistente para incidentes.
6. **Política de senha mínima foi elevada para 10 caracteres no front-end**, mas ainda precisa de enforcement equivalente no backend/Supabase e MFA para perfis sensíveis.
7. **Configuração pública de API agora falha sem URL explícita fora de testes**, reduzindo risco de builds apontarem acidentalmente para produção.
8. **Há rotas legadas `/app` no repositório**, enquanto o RBAC explicitamente nega acesso a `/app`, criando risco de manutenção/confusão.
9. **Sanitização de texto clínico é limitada**, útil para exibição rápida, mas insuficiente como anonimização/controle de PHI.
10. **Teste completo falha em data corrente**, reduzindo confiança de regressão antes de releases.

## Achados priorizados

### P0 — Deve resolver antes de dados reais

#### 1. Tokens em `localStorage`

A sessão Supabase é serializada diretamente no `localStorage` (`health-agent.supabase.session`). Isso facilita persistência, mas torna access/refresh tokens legíveis por qualquer JavaScript executado na origem. Em um produto de saúde, um XSS pequeno vira sequestro de sessão.

**Evidência:** `getStoredSession` lê do `localStorage`, `storeSession` grava/remove a sessão e `recoverSessionFromUrl` persiste tokens vindos do link de recuperação.

**Recomendação MVP:** migrar para sessão em cookie `HttpOnly`, `Secure`, `SameSite=Lax/Strict`, gerenciada no servidor/middleware ou por um backend-for-frontend. Se isso for grande demais agora, reduzir TTL dos tokens, reforçar CSP e revisar todos os pontos de renderização de conteúdo dinâmico.

#### 2. CSP ainda permite `unsafe-inline`

O middleware configura CSP e já removeu `unsafe-eval` de `script-src`; ainda resta `unsafe-inline`, principalmente por causa do script de tema em `app/layout.tsx`. Isso ainda reduz a proteção contra XSS, principalmente combinado com tokens em `localStorage`.

**Recomendação MVP:** trocar o script inline por nonce/hash ou por estratégia sem script inline. Manter uma CSP diferente para dev se necessário.

#### 3. Autorização deve ser garantida no backend

O projeto usa `RequireAccessContext`, `RequireSuperAdmin` e helpers de RBAC client-side. Isso é importante, mas qualquer usuário consegue chamar a API diretamente fora do navegador. Os checks do front-end não podem ser a fonte de verdade.

**Recomendação MVP:** confirmar/implementar no backend: validação de token em todos endpoints `/api/*`, checagem de papel para admin/super_admin/professional/patient, vínculo profissional-paciente em endpoints de paciente, e testes de integração/API para 401/403.

### P1 — Resolver no MVP ou antes de piloto fechado

#### 4. E2E autentica por cookie `role`

Os testes Playwright injetam cookie `role=patient`/`professional` para simular acesso. Isso é aceitável só como mock explícito. Se algum código de runtime confiar nesse cookie, vira elevação de privilégio trivial.

**Recomendação MVP:** manter esse padrão apenas em ambiente de teste, documentar, e preferir fixtures que façam login real ou mockem `/api/auth/me` de forma controlada.

#### 5. Auditoria não é persistente

`services/audit.ts` mantém logs em um array local. Isso não atende rastreabilidade mínima para dados sensíveis, nem ajuda a investigar acessos indevidos.

**Recomendação MVP:** enviar eventos críticos para backend: login/logout, leitura de paciente, leitura de anamnese, geração de relatório IA, alteração de papéis e falhas 403. Incluir `actor_id`, recurso, timestamp server-side, IP/user-agent quando disponível.

#### 6. Senha mínima elevada no front-end

As telas de reset/change-password agora usam mínimo de 10 caracteres. Para MVP com dados clínicos, essa regra também precisa ser reforçada no backend/Supabase, porque validação no navegador pode ser burlada.

**Recomendação MVP:** validar força no backend/Supabase, bloquear senhas comuns e manter mensagens amigáveis. Preferir MFA para perfis admin/profissional.

#### 7. Fallback público para API de produção

`ApiClient` não usa mais `https://api.julha.com.br` como fallback fora de testes; se `NEXT_PUBLIC_API_URL`/`VITE_API_URL` não existirem, a aplicação falha explicitamente. Isso evita que builds locais, previews ou homologação falem com produção por acidente.

**Recomendação MVP:** manter URLs por ambiente com validação no boot/deploy e documentar variáveis obrigatórias.

#### 8. Rotas legadas `/app` contradizem RBAC

`canAccessRoute` retorna `false` para `/app`, mas ainda existem várias páginas em `app/app/*`. Isso aumenta risco de uma rota antiga ficar sem manutenção, guard inconsistente ou link quebrado.

**Recomendação MVP:** remover rotas legadas ou redirecioná-las claramente para os novos contextos (`/patient`, `/professional`, `/admin`) com cobertura de teste.

### P2 — Melhorias importantes após estabilizar MVP

#### 9. Sanitização de texto clínico é limitada

`sanitizeClinicalText` remove alguns e-mails, telefones e CPF, mas não cobre nomes, endereços, CNS, RG, datas de nascimento e outros identificadores. Isso não deve ser tratado como anonimização.

**Recomendação:** classificar como redaction best-effort para UI/logs, nunca como anonimização LGPD/HIPAA-equivalente. Para IA, minimizar dados antes de enviar e auditar prompts/respostas no backend.

#### 10. Full test suite estabilizada para cenário sensível à data

`npm test` foi estabilizado em `patientDashboard.test.ts` congelando o relógio no cenário sensível à data. Isso devolve confiabilidade básica à pipeline unitária com cobertura.

**Recomendação:** manter cenários dependentes de data com relógio controlado (`vi.setSystemTime`) ou expectativas relativas.

## O que eu solucionaria primeiro no MVP

1. **Backend como fonte de autorização:** garantir 401/403 reais em todos endpoints sensíveis.
2. **Sessão em cookie HttpOnly:** ou pelo menos plano de migração + CSP forte se não couber no sprint.
3. **CSP sem `unsafe-inline`:** próximo passo é nonce/hash para eliminar script inline.
4. **Auditoria persistente no backend:** mínimo para saúde: quem acessou qual paciente e quando.
5. **Senha/MFA no backend:** senha forte já no front; falta enforcement server-side e MFA para admin/profissionais.
6. **Remover/redirect rotas legadas `/app`:** reduzir confusão de manutenção e superfície de rota.

## Observação importante

As proteções adicionadas nos serviços do front-end são defesa em profundidade e melhoram UX/evitam chamadas indevidas, mas **não substituem RBAC e controle de escopo no backend**.
