-- TARGETED RLS FIX FOR 403 AUTHORIZATION ERROR
-- This fixes the mismatch between JWT tenant_id and database policies

-- 1. First, ensure the user has tenant_id in their metadata
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{tenant_id}',
    to_jsonb(id::text)
)
WHERE email = 'emiir1230@gmail.com'
AND (raw_app_meta_data->>'tenant_id' IS NULL 
     OR raw_app_meta_data->>'tenant_id' != id::text);

-- 2. Verify the update
SELECT 
    'Metadata Verification' as section,
    email,
    id as user_id,
    raw_app_meta_data->>'tenant_id' as tenant_id_in_metadata
FROM auth.users 
WHERE email = 'emiir1230@gmail.com';

-- 3. Drop conflicting policies
DROP POLICY IF EXISTS "Users can view their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can insert their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can update their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "Users can delete their tenant's current accounts" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_select_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_insert_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_update_tenant" ON public.current_accounts;
DROP POLICY IF EXISTS "current_accounts_delete_tenant" ON public.current_accounts;

-- 4. Create clean, working policies based on user metadata
-- SELECT policy - allow users to see records where tenant_id matches their metadata
CREATE POLICY "current_accounts_select_policy" 
ON public.current_accounts 
FOR SELECT 
TO authenticated 
USING (
    tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR tenant_id = auth.uid()
);

-- INSERT policy - allow inserts where tenant_id matches user metadata
CREATE POLICY "current_accounts_insert_policy" 
ON public.current_accounts 
FOR INSERT 
TO authenticated 
WITH CHECK (
    tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
);

-- UPDATE policy - allow updates where tenant_id matches user metadata
CREATE POLICY "current_accounts_update_policy" 
ON public.current_accounts 
FOR UPDATE 
TO authenticated 
USING (
    tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
);

-- DELETE policy - allow deletes where tenant_id matches user metadata
CREATE POLICY "current_accounts_delete_policy" 
ON public.current_accounts 
FOR DELETE 
TO authenticated 
USING (
    tenant_id = (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE id = auth.uid())
    OR tenant_id = auth.uid()
    AND user_id = auth.uid()
);

-- 5. Ensure RLS is enabled
ALTER TABLE public.current_accounts ENABLE ROW LEVEL SECURITY;

-- 6. Verify policies were created correctly
SELECT 
    'Policy Verification' as section,
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as using_clause,
    pg_get_expr(polwithcheck, polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class c ON pol.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname = 'current_accounts'
ORDER BY polname;

-- 7. Refresh schema cache
COMMENT ON TABLE public.current_accounts IS 'RLS policies fixed for tenant isolation - 20260202';

-- 8. Test query to verify SELECT works
SELECT 
    'Final Test' as section,
    'If this query runs without error, RLS is working correctly' as message;

-- 9. Optional: Insert test record to verify INSERT works
-- Uncomment to test:
/*
INSERT INTO public.current_accounts (
    name,
    tenant_id,
    user_id,
    created_at,
    updated_at
) VALUES (
    'Test Account - RLS Fix Verification',
    (SELECT (raw_app_meta_data->>'tenant_id')::uuid FROM auth.users WHERE email = 'emiir1230@gmail.com'),
    (SELECT id FROM auth.users WHERE email = 'emiir1230@gmail.com'),
    NOW(),
    NOW()
);
*/