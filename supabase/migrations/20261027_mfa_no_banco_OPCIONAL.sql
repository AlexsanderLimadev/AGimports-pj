-- OPCIONAL. Faz o próprio banco exigir o código da verificação em duas etapas.
--
-- Sem este SQL, o código é exigido no login e nas telas do sistema, mas quem tiver a senha
-- ainda poderia falar direto com a API do Supabase sem digitar o código.
-- Com este SQL, quem ativou a verificação em duas etapas só consegue ler ou gravar dados
-- depois de confirmar o código. Quem NÃO ativou continua funcionando normalmente.
--
-- Para desfazer: rode 20261027_mfa_no_banco_DESFAZER.sql.
-- Rode só depois de ativar a verificação na sua conta e conferir que o login pede o código.

create or replace function public.mfa_ok()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      );
$$;

revoke all on function public.mfa_ok() from public;
grant execute on function public.mfa_ok() to authenticated;

-- Política "restritiva": vale em cima das políticas que já existem (as duas precisam passar).
-- access_logs fica de fora para o registro de login (que acontece antes do código) continuar gravando.
do $$
declare t text;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
      and c.relname <> 'access_logs'
  loop
    execute format('drop policy if exists mfa_exigido on public.%I', t);
    execute format(
      'create policy mfa_exigido on public.%I as restrictive for all to authenticated using (public.mfa_ok()) with check (public.mfa_ok())',
      t
    );
  end loop;
end $$;

notify pgrst, 'reload schema';
