-- Check current RLS policies for current_accounts table
SELECT 
    polname as policy_name,
    schemaname,
    tablename,
    polcmd as command,
    CASE 
        WHEN polroles = '{0}' THEN 'All roles'
        ELSE pg_get_userbyid(polroles[1])
    END as roles,
    polqual as using_clause,
    polwithcheck as with_check_clause
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'current_accounts';

-- Check if RLS is enabled on the table
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as force_rls
FROM pg_class 
WHERE relname = 'current_accounts';

-- Test JWT functions
SELECT 
    current_setting('request.jwt.claim.sub', true) as user_id,
    current_setting('request.jwt.claim.tenant_id', true) as tenant_id,
    auth.uid() as auth_uid,
    auth.jwt() ->> 'tenant_id' as jwt_tenant_id;