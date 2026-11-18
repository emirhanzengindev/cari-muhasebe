-- Faz 0: close database objects that were reachable through the Data API
-- without any authorization check. Every object below was verified to be
-- unused by the application code on 2026-11-18. Only grants and two policies
-- change: no table, row or function body is dropped, so this is reversible.

BEGIN;

-- 1) app_users is a view over auth.users owned by postgres without
--    security_invoker, so it bypassed RLS and exposed every user's e-mail and
--    name to anon. Views cannot have RLS: revoke access and make it run with
--    the caller's privileges. No trigger or app route uses it.
REVOKE ALL ON TABLE public.app_users FROM PUBLIC, anon, authenticated;
ALTER VIEW public.app_users SET (security_invoker = true);

-- 2) SECURITY DEFINER functions that skip tenant checks or are debug/test
--    helpers. Postgres grants EXECUTE to PUBLIC by default, so revoke from
--    PUBLIC as well as the API roles.
REVOKE EXECUTE ON FUNCTION public.get_tenant_accounts(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.insert_warehouse(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_user_role(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_test_auth(text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_test_auth(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_jwt_context() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_request_jwt() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_current_user_context() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_jwt_tenant_safe() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.secure_current_account_balances() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_current_account_balances_definer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_stock_movement(uuid, uuid, integer, numeric, text, text) FROM PUBLIC, anon, authenticated;
-- Old 4-argument overload; the app calls the 6-argument version.
REVOKE EXECUTE ON FUNCTION public.apply_stock_movement(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;

-- 3) apply_stock_movement (6 args) is used by /api/stock-movements with a
--    signed-in session. Keep authenticated, remove anonymous access.
REVOKE EXECUTE ON FUNCTION public.apply_stock_movement(uuid, integer, text, text, uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_stock_movement(uuid, integer, text, text, uuid, numeric) TO authenticated;

-- 4) Any signed-in user could add or keep themselves in admins, which grants
--    full control of user_roles through the manage_roles_admins policy.
DROP POLICY IF EXISTS "Admins insert own" ON public.admins;
DROP POLICY IF EXISTS "Admins update own" ON public.admins;

COMMIT;
