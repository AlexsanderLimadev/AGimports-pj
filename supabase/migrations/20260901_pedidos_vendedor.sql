alter table public.pedidos add column if not exists vendedor_nome text;
create index if not exists pedidos_vendedor_idx on public.pedidos (vendedor_nome) where deleted_at is null;
