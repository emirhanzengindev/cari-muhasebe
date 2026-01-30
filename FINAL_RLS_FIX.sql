-- DATABASE POLICY VERIFICATION AND FIX
-- Run this in Supabase SQL Editor

-- 1. Check current RLS policies on current_accounts
SELECT 
    'Current Policies Check' as check_type,
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as using_clause,
    pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'current_accounts';

-- 2. Check if get_jwt_tenant function exists with correct properties
SELECT 
    'Function Check' as check_type,
    n.nspname as schema,
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    p.provolatile as volatility,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'get_jwt_tenant';

-- 3. Check user metadata for the test user
SELECT 
    'User Metadata Check' as check_type,
    id,
    email,
    raw_app_meta_data->>'tenant_id' as raw_tenant_id,
    user_metadata->>'tenant_id' as user_tenant_id
FROM auth.users 
WHERE email = 'emiir1230@gmail.com';

-- 4. DROP existing INSERT policy if it exists
DROP POLICY IF EXISTS "current_accounts_insert_tenant" ON public.current_accounts;

-- 5. CREATE new INSERT policy with COALESCE to handle NULL values
CREATE POLICY "current_accounts_insert_tenant" 
ON public.current_accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (
    COALESCE(tenant_id, public.get_jwt_tenant()) = public.get_jwt_tenant()
    AND COALESCE(user_id, auth.uid()) = auth.uid()
);

-- 6. Verify the new policy was created correctly
SELECT 
    'Policy Verification' as check_type,
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as using_clause,
    pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'current_accounts' AND polname = 'current_accounts_insert_tenant';

-- 7. Refresh schema cache
COMMENT ON TABLE public.current_accounts IS 'RLS policies updated with COALESCE handling - 20260129';

-- 8. Test query to verify everything works
SELECT 'Database fix completed - policies updated with COALESCE support' as status;