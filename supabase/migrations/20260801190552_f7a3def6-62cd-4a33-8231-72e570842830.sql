CREATE TABLE public.rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  created_at timestamptz not null default now(),
  unique (user_id, bucket, window_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limit_hits TO authenticated;
GRANT ALL ON public.rate_limit_hits TO service_role;

ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_rate_limit_hits" ON public.rate_limit_hits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_rate_limit_hits_lookup ON public.rate_limit_hits (user_id, bucket, window_start DESC);

CREATE TABLE public.bi_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_snapshots TO authenticated;
GRANT ALL ON public.bi_snapshots TO service_role;

ALTER TABLE public.bi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_bi_snapshots" ON public.bi_snapshots
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER bi_snapshots_set_updated_at
  BEFORE UPDATE ON public.bi_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.purge_old_rate_limit_hits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_hits WHERE window_start < now() - interval '1 day';
$$;