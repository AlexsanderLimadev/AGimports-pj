REVOKE ALL ON FUNCTION public.purge_old_rate_limit_hits() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_old_rate_limit_hits() FROM anon;
REVOKE ALL ON FUNCTION public.purge_old_rate_limit_hits() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_rate_limit_hits() TO service_role;