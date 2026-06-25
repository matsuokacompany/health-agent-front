# Health Agent Frontend

Frontend Next.js para FastAPI com Supabase Auth no cliente e autorização por roles locais retornadas pelo backend.

## Variáveis de ambiente

Crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=false
```

`NEXT_PUBLIC_USE_MOCK=true` mantém os mocks locais para desenvolvimento isolado. Em integração real, use `false` para chamar o FastAPI.

## Fluxo de login

1. A tela `/login` chama `supabase.auth.signInWithPassword({ email, password })`.
2. A senha nunca é enviada ao FastAPI.
3. O `ApiClient` busca a sessão atual do Supabase antes de cada request.
4. Se existir `access_token`, o header `Authorization: Bearer <supabase_access_token>` é enviado.
5. Após login, restore de sessão ou refresh de token, o frontend chama `GET /api/auth/me`.
6. O FastAPI valida o JWT Supabase, resolve/cria o usuário local e devolve `UserRead` com `roles`.

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

- `401`: limpa sessão Supabase/local e redireciona para `/login`.
- `403`: exibe mensagem de permissão insuficiente.
- `409`: exibe mensagem amigável para conflito, incluindo e-mail Supabase já vinculado a outro usuário local.
