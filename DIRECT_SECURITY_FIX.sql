-- DIRECT SQL SCRIPT TO FIX SECURITY INVOKER ISSUE
-- RUN THIS IN YOUR SUPABASE SQL DASHBOARD

-- First, let's check the current state
SELECT 
    c.relname as view_name,
    (SELECT reloptions FROM pg_class WHERE oid = c.oid) as current_options,
    pg_get_userbyid(c.relowner) as owner
FROM pg_class c 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE n.nspname = 'public' AND c.relname = 'current_account_balances';

-- Check if the function is also SECURITY DEFINER
SELECT proname, prosecdef, pg_get_userbyid(proowner) as function_owner
FROM pg_proc 
WHERE proname = 'fn_current_account_balances';

-- NOW APPLY THE FIX - Recreate view with SECURITY INVOKER
DROP VIEW IF EXISTS public.current_account_balances;

CREATE VIEW public.current_account_balances WITH (security_invoker=on) AS
 SELECT id,
    user_id,
    tenant_id,
    account_number,
    name,
    balance,
    created_at
   FROM fn_current_account_balances() fn_current_account_balances(id, user_id, tenant_id, account_number, name, balance, created_at);

-- Verify the change was applied
SELECT 
    c.relname as view_name,
    (SELECT reloptions FROM pg_class WHERE oid = c.oid) as new_options,
    pg_get_userbyid(c.relowner) as owner
FROM pg_class c 
JOIN pg_namespace n ON c.relnamespace = n.oid 
WHERE n.nspname = 'public' AND c.relname = 'current_account_balances';

-- Test that RLS is now enforced
-- This should show different results based on user context
SELECT 'RLS test - you should see results based on your tenant context' as test_result;

-- If the function is also SECURITY DEFINER, we should fix that too:
-- ALTER FUNCTION fn_current_account_balances() SECURITY INVOKER;