-- Test query to verify current_accounts schema and address column accessibility
-- Run this in Supabase SQL editor to confirm the column exists

-- 1. Check if address column exists in current_accounts table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'current_accounts' 
  AND column_name = 'address';

-- 2. Test direct column access
SELECT 
  COUNT(*) as address_column_exists,
  COUNT(address) as address_values_count
FROM public.current_accounts;

-- 3. Test the exact query that's failing
SELECT 
  id, name, email, phone, address, tax_number, tax_office, company, balance, tenant_id, created_at, updated_at
FROM public.current_accounts
LIMIT 1;

-- If all these queries succeed, the issue is definitely PostgREST schema cache