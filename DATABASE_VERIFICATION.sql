-- DATABASE STATUS VERIFICATION
-- Run this in Supabase SQL Editor to check current status

-- 1. Check user metadata
SELECT 
    id,
    email,
    raw_app_meta_data->>'tenant_id' as tenant_id,
    user_metadata->>'tenant_id' as user_metadata_tenant_id
FROM auth.users 
WHERE email = 'emiir1230@gmail.com';

-- 2. Check if get_jwt_tenant function exists and is correct
SELECT 
    n.nspname as schema, 
    p.proname as function_name, 
    pg_get_functiondef(p.oid) as definition,
    p.prosecdef as is_security_definer,
    p.provolatile as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'get_jwt_tenant';

-- 3. Check current RLS policies
SELECT 
    pol.polname AS policy_name,
    pol.polcmd AS command,
    pg_get_policydef(pol.oid) as policy_def,
    pol.polroles as roles
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'current_accounts';

-- 4. Test the function directly
SELECT public.get_jwt_tenant() as function_result;

-- 5. Check current JWT context (if possible)
SELECT 
    current_setting('request.jwt.claim.tenant_id', true) as jwt_tenant_id,
    auth.uid() as auth_user_id;

-- 6. Quick test insert with proper tenant_id
INSERT INTO public.current_accounts (
    name, 
    code, 
    type, 
    tenant_id, 
    user_id
) VALUES (
    'Test Account', 
    'TEST001', 
    'CUSTOMER', 
    '9f3d2a4e-8b61-4c3a-b5a4-123456789abc', 
    '9f3d2a4e-8b61-4c3a-b5a4-123456789abc'
) RETURNING id, name, tenant_id;

-- 7. Clean up test record
DELETE FROM public.current_accounts WHERE name = 'Test Account';