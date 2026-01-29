-- Remove email column from current_accounts table - cleaner Supabase architecture
ALTER TABLE public.current_accounts DROP COLUMN IF EXISTS email;

-- Force PostgREST schema cache refresh
COMMENT ON TABLE public.current_accounts IS 'Current accounts table with email column removed for cleaner architecture - using tenant_id for user isolation 20260129103105';
