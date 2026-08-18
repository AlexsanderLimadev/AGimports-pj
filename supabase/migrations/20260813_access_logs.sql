-- ============================================================================
-- LOG DE ACESSO — cola no SQL Editor do Supabase (Dashboard > SQL Editor),
-- não passa pelo Lovable nem precisa de nenhuma ferramenta extra.
-- ============================================================================

create table if not exists public.access_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  event text not null, -- 'sign_in' | 'sign_out' | 'sign_up' | 'password_reset'
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists access_logs_user_id_created_at_idx
  on public.access_logs (user_id, created_at desc);

alter table public.access_logs enable row level security;

-- Cada usuário só vê o próprio histórico de acesso — nunca o de outra conta.
create policy "select_own_access_logs"
  on public.access_logs for select
  using (auth.uid() = user_id);

-- Só o próprio usuário registra evento em nome dele (o servidor sempre usa
-- o user_id do token verificado, nunca aceita um valor vindo do cliente).
create policy "insert_own_access_logs"
  on public.access_logs for insert
  with check (auth.uid() = user_id);

-- Limpeza: mantém só 1 ano de histórico (rode manualmente de vez em quando,
-- ou configure um cron do Supabase pra isso).
-- delete from public.access_logs where created_at < now() - interval '1 year';
