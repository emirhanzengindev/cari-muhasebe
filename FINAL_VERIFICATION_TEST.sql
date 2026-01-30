-- FINAL VERIFICATION TEST
-- Run this after applying the previous fixes to confirm everything works

-- 1. Check current user context (run this first to see your user ID)
SELECT 
    auth.uid() as current_user_id,
    auth.jwt() ->> 'tenant_id' as jwt_tenant_id;

-- 2. Test the get_jwt_tenant() function
SELECT public.get_jwt_tenant() as function_result;

-- 3. Insert test record (replace 'your-user-id' with actual user ID from step 1)
-- This simulates what your application would do
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
    auth.uid(),  -- This should match get_jwt_tenant()
    auth.uid(),
    NOW(),
    NOW()
) RETURNING id, name, tenant_id, user_id;

-- 4. Verify the insert worked and RLS is enforced
SELECT 
    id,
    name,
    tenant_id,
    user_id,
    created_at
FROM public.current_accounts 
WHERE name = 'Test Account Verification';

-- 5. Test that other tenants can't see this record
-- (This would require a different authenticated session)
-- SELECT COUNT(*) FROM public.current_accounts WHERE name = 'Test Account Verification';

-- 6. Clean up test record (uncomment to remove test data)
-- DELETE FROM public.current_accounts WHERE name = 'Test Account Verification';