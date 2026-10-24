-- Limites dos alertas de negócio, por usuário (margem mínima e dias de estoque parado).
-- Segura para rodar mais de uma vez.
create table if not exists public.config_negocio (
  user_id uuid primary key references auth.users(id) on delete cascade,
  margem_minima_pct numeric(5,2) not null default 20 check (margem_minima_pct >= 0 and margem_minima_pct <= 100),
  dias_estoque_parado integer not null default 60 check (dias_estoque_parado >= 1 and dias_estoque_parado <= 3650),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.config_negocio to authenticated;
grant all on public.config_negocio to service_role;

alter table public.config_negocio enable row level security;

drop policy if exists own_config_negocio on public.config_negocio;
create policy own_config_negocio on public.config_negocio
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists trg_config_negocio_updated on public.config_negocio;
create trigger trg_config_negocio_updated before update on public.config_negocio
  for each row execute function public.tg_set_updated_at();

notify pgrst, 'reload schema';
