-- Fix SECURITY DEFINER issue for current_account_balances view
-- Convert view to use SECURITY INVOKER to properly enforce RLS policies

-- First, let's check the current view definition and security settings
-- This is for verification purposes
/*
SELECT pg_get_viewdef('public.current_account_balances', true) AS view_def;
SELECT c.oid, n.nspname, c.relname, pg_get_userbyid(c.relowner) AS owner, 
       (SELECT obj_description(c.oid)) AS description, c.relkind 
FROM pg_class c 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE n.nspname = 'public' AND c.relname = 'current_account_balances';
*/

-- Recreate the view with SECURITY INVOKER to ensure RLS is properly enforced
CREATE OR REPLACE VIEW public.current_account_balances WITH (security_invoker=on) AS
 SELECT id,
    user_id,
    tenant_id,
    account_number,
    name,
    balance,
    created_at
   FROM fn_current_account_balances() fn_current_account_balances(id, user_id, tenant_id, account_number, name, balance, created_at);

-- Verify the change was applied correctly
-- This query can be run after deployment to confirm the security setting
/*
SELECT relname, relacl, relowner, pg_get_userbyid(relowner) AS owner 
FROM pg_class 
WHERE relname = 'current_account_balances' 
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
*/

-- Next step: Check if fn_current_account_balances() is also SECURITY DEFINER
-- If it is, we should also convert it to SECURITY INVOKER
-- Run this query to check:
-- SELECT proname, prosecdef FROM pg_proc WHERE proname = 'fn_current_account_balances';

-- If prosecdef is true, we should create a migration to fix that function as well:
-- ALTER FUNCTION fn_current_account_balances() SECURITY INVOKER;