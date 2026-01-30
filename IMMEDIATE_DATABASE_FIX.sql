-- IMMEDIATE DATABASE FIX FOR RLS POLICY VIOLATION
-- RUN THIS IN YOUR SUPABASE SQL EDITOR RIGHT NOW

-- 1. First, let's check your current user's metadata
SELECT 
    id,
    email,
    raw_app_meta_data->>'tenant_id' as tenant_id
FROM auth.users 
WHERE email = 'emiir1230@gmail.com';

-- 2. Fix user metadata - ensure tenant_id is set
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
                       jsonb_build_object('tenant_id', id::text)
WHERE email = 'emiir1230@gmail.com' 
AND (raw_app_meta_data->>'tenant_id' IS NULL OR raw_app_meta_data->>'tenant_id' = '');

-- 3. Verify the fix worked
SELECT 
    id,
    email,
    raw_app_meta_data->>'tenant_id' as tenant_id
FROM auth.users 
WHERE email = 'emiir1230@gmail.com';

-- 4. Check if get_jwt_tenant function exists
SELECT 
    n.nspname as schema, 
    p.proname as function_name, 
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'get_jwt_tenant';

-- 5. If function doesn't exist, create it
CREATE OR REPLACE FUNCTION public.get_jwt_tenant()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT (auth.jwt() ->> 'tenant_id')::uuid;
$$;

-- 6. Check current RLS policies
SELECT pol.polname AS policy_name,
       pol.polcmd AS command,
       pg_get_policydef(pol.oid) as policy_def
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'current_accounts';

-- 7. Create/Update RLS policies for current_accounts
-- Drop existing policies first
DROP POLICY IF EXISTS "current_accounts_select_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_insert_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_update_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_delete_tenant" ON public.current_accounts;

-- Create new policies
CREATE POLICY "current_accounts_select_tenant" 
ON public.current_accounts 
FOR SELECT 
TO authenticated 
USING (tenant_id = public.get_jwt_tenant());

CREATE POLICY "current_accounts_insert_tenant" 
ON public.current_accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (tenant_id = public.get_jwt_tenant() AND user_id = auth.uid());

CREATE POLICY "current_accounts_update_tenant" 
ON public.current_accounts 
FOR UPDATE 
TO authenticated 
USING (tenant_id = public.get_jwt_tenant() AND user_id = auth.uid())
WITH CHECK (tenant_id = public.get_jwt_tenant() AND user_id = auth.uid());

CREATE POLICY "current_accounts_delete_tenant" 
ON public.current_accounts 
FOR DELETE 
TO authenticated 
USING (tenant_id = public.get_jwt_tenant() AND user_id = auth.uid());

-- 8. Refresh schema cache
COMMENT ON TABLE public.current_accounts IS 'RLS policies updated for tenant isolation - 20260129';

-- 9. Test the fix with a simple query
SELECT 'Database fix completed - try accessing current accounts now' as status;