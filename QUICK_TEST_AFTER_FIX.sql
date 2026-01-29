-- QUICK TEST SCRIPT - RUN AFTER APPLYING THE FIX
-- This tests that the security invoker is working correctly

-- 1. Check current view settings
SELECT 
    'View Security Settings' as test,
    c.relname,
    (SELECT reloptions FROM pg_class WHERE oid = c.oid) as security_options
FROM pg_class c 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE n.nspname = 'public' AND c.relname = 'current_account_balances';

-- 2. Test basic query (should work if view exists)
SELECT 
    'Basic Query Test' as test,
    COUNT(*) as record_count
FROM current_account_balances;

-- 3. Check function security settings
SELECT 
    'Function Security' as test,
    proname,
    CASE 
        WHEN prosecdef THEN 'SECURITY DEFINER (BAD - bypasses RLS)'
        ELSE 'SECURITY INVOKER (GOOD - respects RLS)'
    END as security_status
FROM pg_proc 
WHERE proname = 'fn_current_account_balances';

-- 4. Test with simulated user context (if you want to test RLS)
-- Uncomment and modify with actual test values:
/*
SET LOCAL "request.jwt.claim.tenant_id" = 'your-test-tenant-id';
SET LOCAL "request.jwt.claim.sub" = 'your-test-user-id';

SELECT 
    'RLS Test with Context' as test,
    COUNT(*) as filtered_count
FROM current_account_balances;

-- Clean up
RESET "request.jwt.claim.tenant_id";
RESET "request.jwt.claim.sub";
*/