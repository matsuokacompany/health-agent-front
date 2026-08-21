# Health Agent Frontend

Frontend Next.js integrado à API FastAPI em `https://api.julha.com.br`, com autenticação gerenciada pelo backend via cookies HttpOnly e autorização por roles locais retornadas pela API.

## Variáveis de ambiente

Crie `.env.local` apontando para sua API em produção/EC2:

```env
NEXT_PUBLIC_API_URL=https://api.julha.com.br
```

`NEXT_PUBLIC_API_URL` é obrigatória fora dos testes automatizados. As variáveis públicas do Supabase não são necessárias para autenticação no navegador.

## Fluxo de login

1. A tela `/login` chama `POST /api/auth/login` no FastAPI.
2. O FastAPI autentica server-to-server no Supabase e define cookies de sessão `HttpOnly`.
3. O navegador não recebe nem persiste `access_token` ou `refresh_token`.
4. O `ApiClient` envia chamadas autenticadas com `credentials: "include"`, sem montar `Authorization: Bearer`.
5. Após login ou restauração de sessão, o frontend chama `GET /api/auth/me`.
6. O FastAPI valida a sessão/JWT Supabase, resolve/cria o usuário local e devolve `UserRead` com `roles`.

Enquanto houver um usuário autenticado e a aba estiver visível, o frontend chama
`POST /api/auth/refresh` a cada 10 minutos. Ao voltar para uma aba que ficou em
segundo plano por esse período, a renovação também é feita imediatamente. Isso
evita que o access token expire durante o uso normal da plataforma.

Se uma chamada protegida ainda assim responder `401`, o cliente obtém um CSRF
novo em `GET /api/auth/csrf`, renova os cookies em `POST /api/auth/refresh` e
repete a chamada original uma única vez. Renovações concorrentes compartilham a
mesma operação (*single-flight*), para não disputar a rotação do refresh cookie.

A duração máxima da sessão continua sendo definida pelo backend. Para aumentá-la,
ajuste no FastAPI a expiração do cookie de refresh (`Max-Age`/`Expires`) e a política
de rotação/expiração do provedor, mantendo um limite absoluto adequado para dados
de saúde. O endpoint `/api/auth/refresh` precisa renovar os cookies `HttpOnly`; não
é seguro resolver isso armazenando tokens no `localStorage`.

Em todos os ambientes, a origem exata do frontend deve estar liberada no CORS
do backend com credenciais, e proxies devem preservar `Set-Cookie` e
`X-CSRF-Token`. O cookie `__Host-ha_refresh` usa `SameSite=Strict`: frontend e
API precisam continuar no mesmo *site* (por exemplo, subdomínios HTTPS do mesmo
domínio registrável). Se forem publicados em sites distintos, o navegador não
enviará esse cookie; essa limitação deve ser resolvida em conjunto com o backend,
sem reduzir isoladamente a política para `SameSite=None`.


## Recuperação e alteração de senha

As telas de senha chamam o FastAPI e dependem da sessão em cookie `HttpOnly`:

- `/forgot-password`: chama `POST /api/auth/forgot-password`.
- `/reset-password`: aceita um `code` de recuperação para troca server-side em `POST /api/auth/recovery/exchange`; links legados com tokens no fragmento são rejeitados e limpos da URL.
- `/change-password`: chama `POST /api/auth/change-password` quando o usuário já está autenticado.

Para que o e-mail de recuperação funcione em produção, configure no Supabase o callback definido pelo backend em **Authentication > URL Configuration > Redirect URLs**. O frontend não deve receber tokens Supabase em links de recuperação.

## Roles

As roles aceitas são:

- `super_admin`
- `admin`
- `professional`
- `patient`

Um usuário pode ter múltiplas roles. A UI calcula:

- `isSuperAdmin`: contém `super_admin`
- `isAdmin`: contém `admin` ou `super_admin`
- `isProfessional`: contém `professional`
- `isPatient`: contém `patient`

Menus e guards devem usar roles retornadas em `/api/auth/me`, nunca e-mail nem UUID Supabase. Dados de domínio devem usar sempre `users.id` local do backend; `supabase_user_id` é apenas diagnóstico.

## Guards disponíveis

- `RequireAuth`
- `RequireRole`
- `RequireAdmin`
- `RequireSuperAdmin`

Hooks disponíveis:

- `useAuth`
- `useRequireAuth`
- `useHasRole`

## Testando com super_admin

1. Crie o usuário no Supabase Auth.
2. Garanta no backend que o usuário local retornado por `GET /api/auth/me` possua `roles: ["super_admin", "admin"]`.
3. Faça login em `/login`.
4. Acesse `/admin` e `/admin/users/:id/roles`.

## Erros HTTP tratados

- `401`: tenta renovar a sessão uma vez em `/api/auth/refresh`; se falhar, redireciona para `/login`.
- `403`: exibe mensagem de permissão insuficiente.
- `409`: exibe mensagem amigável para conflito, incluindo e-mail Supabase já vinculado a outro usuário local.
