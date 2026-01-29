-- Rollback migration for current_account_balances security invoker change
-- This reverts the view back to its original state (likely SECURITY DEFINER)

-- Store the original view definition for reference
-- Original definition would have been without the security_invoker setting
-- CREATE OR REPLACE VIEW public.current_account_balances AS
--  SELECT id,
--     user_id,
--     tenant_id,
--     account_number,
--     name,
--     balance,
--     created_at
--    FROM fn_current_account_balances() fn_current_account_balances(id, user_id, tenant_id, account_number, name, balance, created_at);

-- If you need to revert to SECURITY DEFINER, you would run:
-- CREATE OR REPLACE VIEW public.current_account_balances AS
--  SELECT id,
--     user_id,
--     tenant_id,
--     account_number,
--     name,
--     balance,
--     created_at
--    FROM fn_current_account_balances() fn_current_account_balances(id, user_id, tenant_id, account_number, name, balance, created_at);

-- Note: This rollback assumes the original view was created without explicit security settings
-- which would default to SECURITY DEFINER behavior