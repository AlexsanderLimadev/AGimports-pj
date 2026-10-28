-- OPCIONAL. Rode só se quiser ver, no painel de erros, os erros de TODAS as pessoas
-- que usam o sistema (e não apenas os seus). Depende de 20261026_erros_app.sql.
--
-- Por que uma tabela separada: a tabela profiles deixa cada pessoa editar a própria linha,
-- então uma coluna "is_admin" ali deixaria qualquer um se promover a administrador.
-- Aqui as pessoas só podem LER esta tabela; quem escreve nela é você, pelo SQL Editor.
create table if not exists public.administradores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

grant select on public.administradores to authenticated;
grant all on public.administradores to service_role;

alter table public.administradores enable row level security;
drop policy if exists administradores_ver_proprio on public.administradores;
create policy administradores_ver_proprio on public.administradores
  for select using (auth.uid() = user_id);

-- Quem está na tabela administradores também enxerga os erros dos outros (só leitura).
drop policy if exists erros_app_select_admin on public.erros_app;
create policy erros_app_select_admin on public.erros_app
  for select using (exists (select 1 from public.administradores a where a.user_id = auth.uid()));

-- ÚLTIMO PASSO: troque o e-mail abaixo pelo seu e rode esta linha UMA vez.
-- insert into public.administradores (user_id)
--   select id from auth.users where email = 'SEU_EMAIL_AQUI' on conflict do nothing;

notify pgrst, 'reload schema';
