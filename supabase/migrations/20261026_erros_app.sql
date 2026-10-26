-- Painel de erros: guarda o código de cada erro que a pessoa viu, para você achar o problema.
-- Segura para rodar mais de uma vez. Cada pessoa só enxerga os próprios erros.
create table if not exists public.erros_app (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  codigo text not null check (codigo ~ '^[A-Z0-9]{3,8}$'),
  tipo text not null check (tipo in ('sessao','duplicado','vinculo','permissao','campos','rede','limite','banco','generico')),
  tela text not null check (char_length(tela) <= 200),
  mensagem text not null check (char_length(mensagem) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists erros_app_user_data on public.erros_app (user_id, created_at desc);

grant select, insert, delete on public.erros_app to authenticated;
grant all on public.erros_app to service_role;

alter table public.erros_app enable row level security;

drop policy if exists erros_app_select_proprio on public.erros_app;
create policy erros_app_select_proprio on public.erros_app
  for select using (auth.uid() = user_id);

drop policy if exists erros_app_insert_proprio on public.erros_app;
create policy erros_app_insert_proprio on public.erros_app
  for insert with check (auth.uid() = user_id);

drop policy if exists erros_app_delete_proprio on public.erros_app;
create policy erros_app_delete_proprio on public.erros_app
  for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
