-- Force PostgREST schema cache refresh for current_accounts table
-- This resolves the PGRST204 error by forcing PostgREST to re-read the table schema

COMMENT ON TABLE public.current_accounts IS 'Force schema cache refresh - address column exists';