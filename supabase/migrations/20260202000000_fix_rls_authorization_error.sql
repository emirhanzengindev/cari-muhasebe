-- Migration to fix 403 Authorization Error - RLS Policy Mismatch
-- Date: 2026-02-02
-- Issue: JWT tenant_id not matching database RLS policies

-- 1. Ensure user has tenant_id in metadata
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{tenant_id}',
    to_jsonb(id::text)
)
WHERE email = 'emiir1230@gmail.com'
AND (raw_app_meta_data->>'tenant_id' IS NULL 
     OR raw_app_meta_data->>'tenant_id' != id::text);

-- 2. Drop all existing conflicting policies
DROP POLICY IF EXISTS "Users can view their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can insert their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can update their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can delete their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_select_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_insert_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_update_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_delete_tenant" ON public.current_accounts;

-- 3. Create clean, working policies based on user metadata
-- SELECT policy
CREATE POLICY "current_accounts_select_policy" 
ON public.current_accounts 
FOR SELECT 
TO authenticated 
USING (
    tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR tenant_id = auth.uid()
);

-- INSERT policy
CREATE POLICY "current_accounts_insert_policy" 
ON public.current_accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (
    tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
);

-- UPDATE policy
CREATE POLICY "current_accounts_update_policy" 
ON public.current_accounts 
FOR UPDATE 
TO authenticated 
USING (
    tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
);

-- DELETE policy
CREATE POLICY "current_accounts_delete_policy" 
ON public.current_accounts 
FOR DELETE 
TO authenticated 
USING (
    tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
);

-- 4. Ensure RLS is enabled
ALTER TABLE public.current_accounts ENABLE ROW LEVEL SECURITY;

-- 5. Refresh schema cache
COMMENT ON TABLE public.current_accounts IS 'RLS policies fixed for tenant isolation - 20260202 migration';

-- 6. Verification query
SELECT 'RLS policies successfully updated for tenant isolation' as migration_status;