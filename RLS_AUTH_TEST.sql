-- Test script to verify RLS authentication is working properly
-- Run this in Supabase SQL Editor to check if auth context is properly set

-- Test 1: Check current auth context
SELECT 
    'Auth Context Test' as test_name,
    auth.uid() as current_user_id,
    auth.jwt() ->> 'tenant_id' as jwt_tenant_id,
    current_user as db_user,
    session_user as session_user;

-- Test 2: Test get_jwt_tenant function
SELECT 
    'Function Test' as test_name,
    public.get_jwt_tenant() as function_result,
    (public.get_jwt_tenant() IS NOT NULL) as function_works;

-- Test 3: Test COALESCE expressions that are used in RLS policies
SELECT 
    'COALESCE Test' as test_name,
    COALESCE(NULL::uuid, public.get_jwt_tenant()) as coalesce_tenant,
    COALESCE(NULL::uuid, auth.uid()) as coalesce_user,
    (COALESCE(NULL::uuid, public.get_jwt_tenant()) = public.get_jwt_tenant()) as tenant_check,
    (COALESCE(NULL::uuid, auth.uid()) = auth.uid()) as user_check;

-- Test 4: Check if we can simulate a proper auth context
-- This would require setting JWT claims which we can't do directly
-- But we can check what the functions return in current context

-- Test 5: Verify RLS policy structure
SELECT 
    'Policy Structure' as test_name,
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as using_clause,
    pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'current_accounts' 
AND polname = 'current_accounts_insert_tenant';

-- Test 6: Check user metadata for test user
SELECT 
    'User Metadata' as test_name,
    id,
    email,
    raw_app_meta_data->>'tenant_id' as raw_tenant_id,
    user_metadata->>'tenant_id' as user_tenant_id
FROM auth.users 
WHERE email = 'emiir1230@gmail.com';