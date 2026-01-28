-- Force schema cache refresh specifically for the address column issue
-- This migration ensures that PostgREST recognizes the address column in current_accounts table

-- Verify that the address column exists in the table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'current_accounts' 
        AND column_name = 'address'
    ) THEN
        RAISE EXCEPTION 'address column does not exist in current_accounts table';
    END IF;
END $$;

-- Force PostgREST schema cache refresh by adding a comment that explicitly mentions the address column
COMMENT ON TABLE public.current_accounts IS 'Current accounts table with all columns including address, name, email, phone, tax_number, tax_office, company, balance, tenant_id, created_at, updated_at, is_active, account_type - schema cache refresh 2025-01-28';

-- Ensure all columns are properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_current_accounts_address ON public.current_accounts(address);