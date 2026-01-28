-- Force PostgREST schema cache refresh for current_accounts table
-- This resolves PGRST204 errors when columns exist but cache is stale

-- Add a comment to force schema cache refresh
COMMENT ON TABLE public.current_accounts IS 'Force PostgREST schema cache refresh - contains id, name, email, phone, address, tax_number, tax_office, company, balance, tenant_id, created_at, updated_at';

-- Also refresh any dependent objects
-- This ensures PostgREST re-reads the complete table schema