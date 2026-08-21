-- Cola no SQL Editor do Supabase.
alter table public.suppliers add column if not exists deleted_at timestamptz;
alter table public.suppliers add column if not exists is_international boolean not null default false;
create index if not exists suppliers_active_idx on public.suppliers (id) where deleted_at is null;
