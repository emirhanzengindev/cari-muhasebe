-- CURRENT RLS DIAGNOSIS FOR 403 ERROR
-- Run this in Supabase SQL Editor to diagnose the exact issue

-- 1. Check user metadata for the authenticated user
SELECT 
    'User Metadata Check' as section,
    id,
    email,
    raw_app_meta_data->>'tenant_id' as raw_tenant_id,
    user_metadata->>'tenant_id' as user_tenant_id,
    (raw_app_meta_data->>'tenant_id') IS NOT NULL as has_raw_tenant,
    (user_metadata->>'tenant_id') IS NOT NULL as has_user_tenant
FROM auth.users 
WHERE email = 'emiir1230@gmail.com';

-- 2. Check current RLS policies on current_accounts
SELECT 
    'Current RLS Policies' as section,
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as using_clause,
    pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'current_accounts'
ORDER BY polname;

-- 3. Check if get_jwt_tenant function exists and works
SELECT 
    'JWT Function Check' as section,
    proname as function_name,
    prosecdef as is_security_definer,
    provolatile as volatility,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'get_jwt_tenant';

-- 4. Test the function directly (may fail if not in auth context)
SELECT 
    'Function Test' as section,
    public.get_jwt_tenant() as tenant_from_function;

-- 5. Check current JWT claims (will show NULL if not in proper auth context)
SELECT 
    'Current JWT Context' as section,
    current_setting('request.jwt.claim.sub', true) as user_id_claim,
    current_setting('request.jwt.claim.tenant_id', true) as tenant_id_claim,
    auth.uid() as auth_uid,
    auth.jwt() ->> 'tenant_id' as jwt_tenant_id;

-- 6. Check table structure
SELECT 
    'Table Structure' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'current_accounts'
ORDER BY ordinal_position;

-- 7. Count existing records
SELECT 
    'Data Count' as section,
    COUNT(*) as total_records,
    COUNT(DISTINCT tenant_id) as unique_tenants
FROM public.current_accounts;

-- 8. Test SELECT with current policies (should work if RLS allows)
SELECT 
    'SELECT Test' as section,
    id,
    name,
    tenant_id,
    user_id
FROM public.current_accounts 
LIMIT 5;