-- COMPREHENSIVE PostgREST Schema Cache Status Report
-- Run this to diagnose current cache state and determine next steps

-- 1. Verify physical column existence
SELECT 
  'Physical Schema' as check_category,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'current_accounts'
ORDER BY ordinal_position;

-- 2. Test direct column access
SELECT 
  'Direct Access Test' as test_category,
  COUNT(*) as total_records,
  COUNT(address) as address_populated,
  COUNT(*) - COUNT(address) as address_null,
  CASE 
    WHEN COUNT(address) > 0 THEN 'ADDRESS ACCESSIBLE'
    ELSE 'ADDRESS INACCESSIBLE'
  END as access_status
FROM public.current_accounts;

-- 3. Check for schema inconsistencies
SELECT 
  'Schema Consistency' as check_category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'current_accounts' 
      AND column_name = 'address'
    ) THEN 'PHYSICAL COLUMN EXISTS'
    ELSE 'PHYSICAL COLUMN MISSING'
  END as physical_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relname = 'current_accounts'
      AND a.attname = 'address'
      AND a.attnum > 0
    ) THEN 'CATALOG ENTRY EXISTS'
    ELSE 'CATALOG ENTRY MISSING'
  END as catalog_status;

-- 4. Check active PostgREST connections
SELECT 
  'Service Status' as status_category,
  pid,
  application_name,
  state,
  query_start,
  state_change
FROM pg_stat_activity 
WHERE application_name LIKE '%postgrest%'
ORDER BY query_start DESC;

-- 5. Recommendations based on findings
SELECT 
  'Action Recommendation' as recommendation_category,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'current_accounts' 
      AND column_name = 'address'
    ) THEN 
      'COLUMN EXISTS PHYSICALLY - RESTART POSTGREST SERVICE VIA DASHBOARD'
    ELSE 
      'COLUMN MISSING PHYSICALLY - ADD COLUMN OR REMOVE REFERENCES'
  END as recommended_action;