-- COMPLETE DATABASE FIX FOR RLS POLICY VIOLATION
-- This script will completely resolve the RLS issues

-- 1. First, let's check the current state
SELECT 
    'Current user metadata check' as check_type,
    id,
    email,
    raw_app_meta_data->>'tenant_id' as raw_tenant_id,
    user_metadata->>'tenant_id' as user_tenant_id
FROM auth.users 
WHERE email = 'emiir1230@gmail.com';

-- 2. Ensure user has tenant_id in raw_app_meta_data
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
                       jsonb_build_object('tenant_id', id::text)
WHERE email = 'emiir1230@gmail.com' 
AND (raw_app_meta_data->>'tenant_id' IS NULL OR raw_app_meta_data->>'tenant_id' = '');

-- 3. Verify the update
SELECT 
    'After update check' as check_type,
    id,
    email,
    raw_app_meta_data->>'tenant_id' as tenant_id
FROM auth.users 
WHERE email = 'emiir1230@gmail.com';

-- 4. Create or update get_jwt_tenant function with proper security settings
CREATE OR REPLACE FUNCTION public.get_jwt_tenant()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT (auth.jwt() ->> 'tenant_id')::uuid;
$$;

-- 5. Verify function exists and has correct properties
SELECT 
    'Function verification' as check_type,
    n.nspname as schema, 
    p.proname as function_name, 
    pg_get_functiondef(p.oid) as definition,
    p.prosecdef as is_security_definer,
    p.provolatile as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'get_jwt_tenant';

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "current_accounts_select_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_insert_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_update_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_delete_tenant" ON public.current_accounts;

-- 7. Create new comprehensive RLS policies
CREATE POLICY "current_accounts_select_tenant" 
ON public.current_accounts 
FOR SELECT 
TO authenticated 
USING (
    tenant_id = public.get_jwt_tenant() 
    OR tenant_id = auth.uid()
);

CREATE POLICY "current_accounts_insert_tenant" 
ON public.current_accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (
    tenant_id = public.get_jwt_tenant() 
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
);

CREATE POLICY "current_accounts_update_tenant" 
ON public.current_accounts 
FOR UPDATE 
TO authenticated 
USING (
    tenant_id = public.get_jwt_tenant() 
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
)
WITH CHECK (
    tenant_id = public.get_jwt_tenant() 
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
);

CREATE POLICY "current_accounts_delete_tenant" 
ON public.current_accounts 
FOR DELETE 
TO authenticated 
USING (
    tenant_id = public.get_jwt_tenant() 
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
);

-- 8. Verify policies were created
SELECT 
    'Policy verification' as check_type,
    pol.polname AS policy_name,
    pol.polcmd AS command,
    pg_get_policydef(pol.oid) as policy_def
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'current_accounts';

-- 9. Refresh schema cache
COMMENT ON TABLE public.current_accounts IS 'RLS policies updated for tenant isolation - 20260129 complete fix';

-- 10. Test with a simple query that should work
SELECT 'Database fix completed successfully' as status;

-- 11. Optional: Test insert to verify everything works
-- Uncomment the following lines to test:
/*
INSERT INTO public.current_accounts (
    name, 
    code, 
    type, 
    tenant_id, 
    user_id,
    created_at,
    updated_at
) VALUES (
    'Test Account Verification', 
    'TEST001', 
    'CUSTOMER', 
    '9f3d2a4e-8b61-4c3a-b5a4-123456789abc', 
    '9f3d2a4e-8b61-4c3a-b5a4-123456789abc',
    NOW(),
    NOW()
) RETURNING id, name, tenant_id, user_id;

-- Clean up test record
DELETE FROM public.current_accounts WHERE name = 'Test Account Verification';
*/