-- Ensure email column exists in current_accounts table and force schema cache refresh
ALTER TABLE public.current_accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Force PostgREST schema cache refresh
COMMENT ON TABLE public.current_accounts IS 'Current accounts table with all columns including email, address, name, phone, tax_number, tax_office, company, balance, tenant_id, created_at, updated_at, is_active, account_type - schema cache refresh 20260129102128';

-- Ensure all columns are properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_current_accounts_email ON public.current_accounts(email);
