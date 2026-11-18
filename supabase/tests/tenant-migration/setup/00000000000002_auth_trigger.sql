-- LOCAL TEST DATABASE ONLY (copied into the separate test project by prepare_local.ps1).
-- auth.users triggers are not part of a public-schema dump. Definition read from
-- live (read-only, 2026-11-18, pg_get_triggerdef, enabled = 'O'):
--   CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user()
-- It is the only non-internal trigger on auth.users on live.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
