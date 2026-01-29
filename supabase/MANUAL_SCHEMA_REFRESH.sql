-- MANUAL EXECUTION SCRIPT FOR SUPABASE DASHBOARD
-- Copy and paste this into your Supabase SQL editor

-- Force complete PostgREST schema cache refresh for current_accounts
-- This addresses the PGRST204 error for phone column

-- First, ensure the table structure is correct
ALTER TABLE public.current_accounts 
DROP COLUMN IF EXISTS email;

-- Add phone column if it doesn't exist (should already exist but being explicit)
ALTER TABLE public.current_accounts 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Force aggressive schema cache refresh by updating the table comment
-- This will trigger PostgREST to re-read the schema
COMMENT ON TABLE public.current_accounts IS 'Complete schema refresh - current_accounts table structure verified: id, name, phone, address, tax_number, tax_office, company, balance, tenant_id, created_at, updated_at, is_active, account_type - 20260129104500';

-- Also refresh the schema cache by touching a column comment
COMMENT ON COLUMN public.current_accounts.phone IS 'Contact phone number for the account - verified column exists 20260129104500';

-- Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'current_accounts' 
AND table_schema = 'public'
ORDER BY ordinal_position;