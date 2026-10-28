-- Desfaz 20261027_mfa_no_banco_OPCIONAL.sql: remove a exigência do código no banco.
-- (O login e as telas continuam pedindo o código para quem ativou.)
do $$
declare t text;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('drop policy if exists mfa_exigido on public.%I', t);
  end loop;
end $$;

drop function if exists public.mfa_ok();

notify pgrst, 'reload schema';
