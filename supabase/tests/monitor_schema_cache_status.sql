-- Monitor PostgREST schema cache status
-- Run this periodically to check if the cache refresh is complete

-- Check current schema cache status
SELECT 
  schemaname,
  tablename,
  attname as column_name,
  typname as data_type
FROM pg_tables t
JOIN pg_attribute a ON a.attrelid = t.tablename::regclass
JOIN pg_type ty ON ty.oid = a.atttypid
WHERE t.schemaname = 'public' 
  AND t.tablename = 'current_accounts'
  AND a.attnum > 0
ORDER BY a.attnum;

-- Test direct column access
SELECT 
  'Direct access test' as test_type,
  COUNT(*) as total_rows,
  COUNT(address) as address_populated,
  COUNT(*) - COUNT(address) as address_null
FROM public.current_accounts;

-- Check for any schema inconsistencies
SELECT 
  'Schema validation' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'current_accounts' 
      AND column_name = 'address'
    ) THEN 'COLUMN EXISTS'
    ELSE 'COLUMN MISSING'
  END as address_status;