-- Cadastro de vendedores. Segura para rodar mais de uma vez.
-- Depende de 20260901_pedidos_vendedor.sql (coluna pedidos.vendedor_nome).
create table if not exists public.vendedores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- "Joao" e "joao" contam como o mesmo vendedor.
create unique index if not exists vendedores_nome_unico
  on public.vendedores (user_id, lower(btrim(nome))) where deleted_at is null;

grant select, insert, update, delete on public.vendedores to authenticated;
grant all on public.vendedores to service_role;

alter table public.vendedores enable row level security;
drop policy if exists own_vendedores on public.vendedores;
create policy own_vendedores on public.vendedores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists trg_vendedores_updated on public.vendedores;
create trigger trg_vendedores_updated before update on public.vendedores
  for each row execute function public.tg_set_updated_at();

-- Liga o pedido ao vendedor. O nome continua guardado no pedido (vendedor_nome),
-- como o cliente_nome_snapshot, para o histórico não mudar se o cadastro mudar.
alter table public.pedidos
  add column if not exists vendedor_id uuid references public.vendedores(id) on delete set null;
create index if not exists pedidos_vendedor_id_idx on public.pedidos (vendedor_id) where deleted_at is null;

-- Aproveita os nomes digitados antes: cria um vendedor para cada nome distinto
-- (sem diferenciar maiúsculas) e liga os pedidos antigos a ele.
insert into public.vendedores (user_id, nome)
select distinct on (user_id, lower(btrim(vendedor_nome))) user_id, btrim(vendedor_nome)
from public.pedidos
where vendedor_nome is not null and btrim(vendedor_nome) <> '' and deleted_at is null
on conflict do nothing;

update public.pedidos p
set vendedor_id = v.id, vendedor_nome = v.nome
from public.vendedores v
where p.vendedor_id is null
  and p.vendedor_nome is not null
  and p.user_id = v.user_id
  and v.deleted_at is null
  and lower(btrim(v.nome)) = lower(btrim(p.vendedor_nome));

notify pgrst, 'reload schema';
