-- Test script to verify current_account_balances view security settings
-- Run this after deploying the migration to verify the changes

-- 1. Check the current view definition and security settings
SELECT 
    n.nspname AS schema_name,
    c.relname AS view_name,
    pg_get_userbyid(c.relowner) AS owner,
    (SELECT obj_description(c.oid)) AS description,
    c.relkind,
    -- Check if security invoker is set
    (SELECT reloptions FROM pg_class WHERE oid = c.oid) AS reloptions
FROM pg_class c 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE n.nspname = 'public' AND c.relname = 'current_account_balances';

-- 2. Check the underlying function security settings
SELECT 
    proname,
    prosecdef, -- true if SECURITY DEFINER, false if SECURITY INVOKER
    pg_get_userbyid(proowner) AS owner
FROM pg_proc 
WHERE proname = 'fn_current_account_balances';

-- 3. Test RLS behavior with a sample query
-- This will show if RLS is being enforced properly
SET LOCAL "request.jwt.claim.tenant_id" = 'test-tenant-id';
SET LOCAL "request.jwt.claim.sub" = 'test-user-id';

-- Try to query the view (this should respect RLS now)
SELECT * FROM current_account_balances LIMIT 5;

-- 4. Check current user context
SELECT 
    current_user,
    session_user,
    current_setting('request.jwt.claim.tenant_id', true) AS tenant_id,
    current_setting('request.jwt.claim.sub', true) AS user_id;

-- 5. Test with service role (should bypass RLS)
-- This would require service role connection which we can't test here
-- But you can verify that service role still works as expected

-- Clean up test settings
RESET "request.jwt.claim.tenant_id";
RESET "request.jwt.claim.sub";